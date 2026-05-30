import re
import json
import difflib
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models.schemas import Student, Question, Assessment, QuestionResponse, CompetencyScore, LearningGap, RiskLevel, ProgressHistory

LITERACY_COMPETENCIES = [
    "letter_recognition",
    "phonics",
    "word_reading",
    "sentence_reading",
    "comprehension"
]

NUMERACY_COMPETENCIES = [
    "number_recognition",
    "counting",
    "number_sense",
    "addition",
    "subtraction",
    "multiplication"
]

# ==========================================
# Adaptive Assessment Engine
# ==========================================

def get_next_adaptive_question(db: Session, assessment_id: int) -> Dict[str, Any]:
    """
    Determines the next question to ask in the adaptive assessment.
    Returns a dict with keys: 'finished' (bool), 'next_question' (Question model or None), 'progress' (int)
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise ValueError("Assessment session not found")

    student = db.query(Student).filter(Student.id == assessment.student_id).first()
    
    # Get all responses in this session
    responses = db.query(QuestionResponse)\
                  .filter(QuestionResponse.assessment_id == assessment_id)\
                  .order_by(QuestionResponse.id)\
                  .all()
    
    answered_count = len(responses)
    subject = assessment.subject.lower()
    competencies = LITERACY_COMPETENCIES if subject == "literacy" else NUMERACY_COMPETENCIES

    # If no questions answered yet, start with the first competency at student's grade level (or default to 2)
    if answered_count == 0:
        first_comp = competencies[0]
        start_difficulty = max(1, min(student.grade, 5))
        
        question = find_question(db, subject, first_comp, start_difficulty, student.language)
        if not question:
            # Fallback to any difficulty if student language question not found
            question = find_question(db, subject, first_comp, 1, student.language) or \
                       find_question(db, subject, first_comp, 1, "English")
            
        return {
            "finished": False,
            "next_question": question,
            "progress": 0
        }

    # Analyze responses to see which competency and difficulty we are currently testing
    # Find the last response
    last_response = responses[-1]
    last_question = db.query(Question).filter(Question.id == last_response.question_id).first()
    
    current_comp = last_question.competency
    comp_index = competencies.index(current_comp)
    
    # How many questions for the current competency have been answered in this session?
    comp_responses = []
    for r in responses:
        q = db.query(Question).filter(Question.id == r.question_id).first()
        if q and q.competency == current_comp:
            comp_responses.append(r)
            
    comp_answered_count = len(comp_responses)
    
    # Check if we should switch to the next competency
    # Condition: 
    # 1. Answered 3 questions for this competency, OR
    # 2. Got it right at max difficulty (5) OR wrong at min difficulty (1)
    should_switch = False
    
    if comp_answered_count >= 3:
        should_switch = True
    elif last_response.is_correct and last_question.difficulty == 5:
        should_switch = True
    elif not last_response.is_correct and last_question.difficulty == 1:
        should_switch = True

    if should_switch:
        # Move to next competency
        next_comp_index = comp_index + 1
        if next_comp_index >= len(competencies):
            # All competencies tested!
            return {
                "finished": True,
                "next_question": None,
                "progress": answered_count
            }
        
        # Start next competency at a reasonable default based on student grade
        next_comp = competencies[next_comp_index]
        start_difficulty = max(1, min(student.grade, 5))
        
        question = find_question(db, subject, next_comp, start_difficulty, student.language)
        if not question:
            question = find_question(db, subject, next_comp, 1, student.language) or \
                       find_question(db, subject, next_comp, 1, "English")
                       
        return {
            "finished": False,
            "next_question": question,
            "progress": answered_count
        }
    else:
        # Continue current competency, adjust difficulty
        next_difficulty = last_question.difficulty
        if last_response.is_correct:
            next_difficulty = min(5, last_question.difficulty + 1)
        else:
            next_difficulty = max(1, last_question.difficulty - 1)
            
        # Ensure we don't ask the exact same question again in this session
        already_asked_ids = [r.question_id for r in responses]
        
        question = find_question(db, subject, current_comp, next_difficulty, student.language, exclude_ids=already_asked_ids)
        
        if not question:
            # If no new question at this difficulty, check adjacent difficulties
            for diff in [next_difficulty + 1, next_difficulty - 1, 3, 2, 4, 1, 5]:
                if 1 <= diff <= 5:
                    question = find_question(db, subject, current_comp, diff, student.language, exclude_ids=already_asked_ids)
                    if question:
                        break
                        
        if not question:
            # If still nothing, move to the next competency
            next_comp_index = comp_index + 1
            if next_comp_index >= len(competencies):
                return {
                    "finished": True,
                    "next_question": None,
                    "progress": answered_count
                }
            next_comp = competencies[next_comp_index]
            start_difficulty = max(1, min(student.grade, 5))
            question = find_question(db, subject, next_comp, start_difficulty, student.language) or \
                       find_question(db, subject, next_comp, 1, "English")

        return {
            "finished": False,
            "next_question": question,
            "progress": answered_count
        }

def find_question(db: Session, subject: str, competency: str, difficulty: int, language: str, exclude_ids: List[int] = None) -> Optional[Question]:
    """Helper to query the question bank matching criteria."""
    if exclude_ids is None:
        exclude_ids = []
        
    # Standardize language (literacy needs language match, numeracy can fallback to English easily)
    query = db.query(Question).filter(
        Question.subject == subject,
        Question.competency == competency,
        Question.difficulty == difficulty
    )
    
    if subject == "literacy":
        # Literacy is language-specific
        query = query.filter(Question.text.like(f"%[{language}]%") | (Question.media_url == language))
    
    if exclude_ids:
        query = query.filter(Question.id.not_in(exclude_ids))
        
    question = query.first()
    
    # Fallback to language-neutral / any language if not found and subject is numeracy
    if not question and subject == "numeracy":
        query_fallback = db.query(Question).filter(
            Question.subject == subject,
            Question.competency == competency,
            Question.difficulty == difficulty
        )
        if exclude_ids:
            query_fallback = query_fallback.filter(Question.id.not_in(exclude_ids))
        question = query_fallback.first()
        
    return question


# ==========================================
# Speech Evaluation Engine (Fluency Metrics)
# ==========================================

def evaluate_reading_fluency(expected_text: str, spoken_text: str, duration_seconds: float) -> Dict[str, Any]:
    """
    Evaluates speech reading fluency by comparing standard expected text against spoken transcription.
    Calculates Accuracy, Words Per Minute (WPM), Skipped Words, Incorrect Words, and final Fluency Score.
    """
    # Normalize strings: lowercase, remove punctuation
    def clean_text(text: str) -> str:
        text = text.lower()
        # Keep letters, numbers, and basic spaces
        text = re.sub(r'[^\w\s]', '', text)
        return text.strip()

    expected_clean = clean_text(expected_text)
    spoken_clean = clean_text(spoken_text)

    expected_words = expected_clean.split()
    spoken_words = spoken_clean.split()

    if not expected_words:
        return {
            "expected_text": expected_text,
            "spoken_text": spoken_text,
            "accuracy": 0.0,
            "words_per_minute": 0.0,
            "skipped_words": [],
            "wrong_words": [],
            "reading_fluency": 0.0
        }

    # Match words using SequenceMatcher
    matcher = difflib.SequenceMatcher(None, expected_words, spoken_words)
    matching_blocks = matcher.get_matching_blocks()

    correct_indices = set()
    for block in matching_blocks:
        for i in range(block.size):
            correct_indices.add(block.a + i)

    correct_count = len(correct_indices)
    accuracy = (correct_count / len(expected_words)) * 100.0

    # Calculate WPM
    # standard WPM is based on total words read correctly over duration in minutes
    duration_minutes = max(duration_seconds, 1.0) / 60.0
    wpm = correct_count / duration_minutes

    # Identify skipped words (words in expected not in spoken)
    skipped_words = [expected_words[i] for i in range(len(expected_words)) if i not in correct_indices]

    # Identify wrong words (spoken words that did not match expected words)
    # Simple heuristic: spoken words that weren't part of any match block
    spoken_matched_indices = set()
    for block in matching_blocks:
        for i in range(block.size):
            spoken_matched_indices.add(block.b + i)
    wrong_words = [spoken_words[i] for i in range(len(spoken_words)) if i not in spoken_matched_indices]

    # Compute a combined Reading Fluency Score (0 to 100)
    # Weighted: 60% accuracy, 40% speed (benchmarked around 90 WPM as maximum speed for Grade 1-3)
    speed_factor = min(wpm / 90.0, 1.0) * 40.0
    accuracy_factor = (accuracy / 100.0) * 60.0
    reading_fluency = min(100.0, accuracy_factor + speed_factor)

    return {
        "expected_text": expected_text,
        "spoken_text": spoken_text,
        "accuracy": round(accuracy, 1),
        "words_per_minute": round(wpm, 1),
        "skipped_words": skipped_words,
        "wrong_words": wrong_words,
        "reading_fluency": round(reading_fluency, 1)
    }
