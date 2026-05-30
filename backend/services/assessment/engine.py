import re
import json
import difflib
import random
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from backend.models.schemas import Student, Question, Assessment, QuestionResponse, CompetencyScore, LearningGap, RiskLevel, ProgressHistory

LITERACY_COMPETENCIES = [
    "dictation",
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
# Phonetic Homophone Mappings for Letters
# ==========================================
PHONETIC_MAPPINGS = {
    # English Letters
    "a": ["a", "ay", "ae", "eh", "hey", "eight", "un", "one", "8"],
    "b": ["b", "be", "bee", "bi", "me"],
    "c": ["c", "see", "sea", "si", "she"],
    "d": ["d", "de", "dee", "di", "the"],
    "e": ["e", "ee", "he", "eh"],
    "f": ["f", "ef", "eff"],
    "g": ["g", "ji", "gee", "je"],
    "h": ["h", "aitch", "age", "each"],
    "i": ["i", "eye", "ay", "ai"],
    "j": ["j", "jay", "je"],
    "k": ["k", "kay", "ca"],
    "l": ["l", "el", "ell"],
    "m": ["m", "em", "am"],
    "n": ["n", "en", "an", "and"],
    "o": ["o", "oh", "ow"],
    "p": ["p", "pee", "pi"],
    "q": ["q", "cue", "queue", "kyu"],
    "r": ["r", "are", "ar"],
    "s": ["s", "ess", "as"],
    "t": ["t", "tee", "tea", "ti"],
    "u": ["u", "you", "yoo"],
    "v": ["v", "vee", "we"],
    "w": ["w", "double u", "double-u", "dablu"],
    "x": ["x", "ex"],
    "y": ["y", "wye", "why"],
    "z": ["z", "zee", "zed"],
    
    # Hindi/Marathi Letters
    "अ": ["अ", "ah", "a", "aa"],
    "आ": ["आ", "aa", "ah"],
    "इ": ["इ", "i", "ee"],
    "ई": ["ई", "ee", "i"],
    "उ": ["उ", "u", "oo"],
    "ऊ": ["ऊ", "oo", "u"],
    "ए": ["ए", "e", "ay"],
    "ऐ": ["ऐ", "ai", "aye"],
    "ओ": ["ओ", "o", "oh"],
    "औ": ["औ", "au", "ow"],
    "क": ["क", "k", "ka"],
    "ख": ["ख", "kh", "kha"],
    "ग": ["ग", "g", "ga"],
    "घ": ["घ", "gh", "gha"],
    "ङ": ["ङ", "nga"],
    "च": ["च", "ch", "cha"],
    "छ": ["छ", "chh", "chha"],
    "ज": ["ज", "j", "ja"],
    "झ": ["झ", "jh", "jha"],
    "ञ": ["ञ", "nya"],
    "ट": ["ट", "t", "ta"],
    "ठ": ["ठ", "th", "tha"],
    "ड": ["ड", "d", "da"],
    "ढ": ["ढ", "dh", "dha"],
    "ण": ["ण", "n", "na"],
    "त": ["त", "t", "ta"],
    "थ": ["थ", "th", "tha"],
    "द": ["द", "d", "da"],
    "ध": ["ध", "dh", "dha"],
    "न": ["न", "n", "na"],
    "प": ["प", "p", "pa"],
    "फ": ["फ", "ph", "pha", "f", "fa"],
    "ब": ["ब", "b", "ba"],
    "भ": ["भ", "bh", "bha"],
    "म": ["म", "m", "ma"],
    "य": ["य", "y", "ya"],
    "र": ["र", "r", "ra"],
    "ल": ["ल", "l", "la"],
    "व": ["व", "v", "va", "w", "wa"],
    "श": ["श", "sh", "sha"],
    "ष": ["ष", "sh", "sha"],
    "स": ["स", "s", "sa"],
    "ह": ["ह", "h", "ha"],
    "ळ": ["ळ", "la", "lda"],
    "क्ष": ["क्ष", "ksh", "ksha"],
    "ज्ञ": ["ज्ञ", "gya", "gyan", "dnya"]
}

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

    # If no questions answered yet, start with the first competency at student's grade level
    if answered_count == 0:
        first_comp = competencies[0]
        start_difficulty = max(1, min(student.grade, 5))
        
        question = find_question(db, subject, first_comp, start_difficulty, student.language)
        if not question:
            # Fallback to any difficulty
            question = find_question(db, subject, first_comp, 1, student.language) or \
                       find_question(db, subject, first_comp, 1, "English")
            
        return {
            "finished": False,
            "next_question": question,
            "progress": 0
        }

    # Analyze responses to see which competency and difficulty we are currently testing
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
    """Helper to query the question bank matching criteria and pick one randomly."""
    if exclude_ids is None:
        exclude_ids = []
        
    query = db.query(Question).filter(
        Question.subject == subject,
        Question.competency == competency,
        Question.difficulty == difficulty,
        Question.language == language,
        Question.is_active == True
    )
    
    if exclude_ids:
        query = query.filter(Question.id.not_in(exclude_ids))
        
    questions = query.all()
    if questions:
        return random.choice(questions)
        
    # Fallback to English for numeracy if other language matches are missing
    if subject == "numeracy" and language != "English":
        query_fallback = db.query(Question).filter(
            Question.subject == subject,
            Question.competency == competency,
            Question.difficulty == difficulty,
            Question.language == "English",
            Question.is_active == True
        )
        if exclude_ids:
            query_fallback = query_fallback.filter(Question.id.not_in(exclude_ids))
        questions_fallback = query_fallback.all()
        if questions_fallback:
            return random.choice(questions_fallback)
            
    # Extra fallback: search using text patterns for legacy seeds if any
    if not questions and subject == "literacy":
        query_legacy = db.query(Question).filter(
            Question.subject == subject,
            Question.competency == competency,
            Question.difficulty == difficulty,
            Question.is_active == True,
            Question.text.like(f"%[{language}]%")
        )
        if exclude_ids:
            query_legacy = query_legacy.filter(Question.id.not_in(exclude_ids))
        questions_legacy = query_legacy.all()
        if questions_legacy:
            return random.choice(questions_legacy)

    return None


# ==========================================
# Speech Evaluation Engine (Fluency Metrics)
# ==========================================

def words_match_phonetically(expected: str, spoken: str) -> bool:
    """Helper to check if two words or letters match phonetically."""
    e_clean = expected.lower().strip()
    s_clean = spoken.lower().strip()
    
    if e_clean == s_clean:
        return True
        
    # Match phonetic dictionary
    if e_clean in PHONETIC_MAPPINGS:
        if s_clean in PHONETIC_MAPPINGS[e_clean]:
            return True
            
    if s_clean in PHONETIC_MAPPINGS:
        if e_clean in PHONETIC_MAPPINGS[s_clean]:
            return True
            
    # Accept edit distance similarity for longer vocabulary words
    if len(e_clean) > 2 and len(s_clean) > 2:
        diff_ratio = difflib.SequenceMatcher(None, e_clean, s_clean).ratio()
        if diff_ratio >= 0.8:
            return True
            
    return False

def align_words(expected_words: List[str], spoken_words: List[str]) -> Set[int]:
    """
    Returns a set of indices in expected_words that match spoken_words, 
    accounting for phonetic mappings.
    """
    matched_expected_indices = set()
    spoken_used_indices = set()
    
    # Pass 1: Exact matches (in order to maintain index synchronization)
    for i, e in enumerate(expected_words):
        for j, s in enumerate(spoken_words):
            if j not in spoken_used_indices:
                if e.lower().strip() == s.lower().strip():
                    matched_expected_indices.add(i)
                    spoken_used_indices.add(j)
                    break
                    
    # Pass 2: Phonetic matches
    for i, e in enumerate(expected_words):
        if i not in matched_expected_indices:
            for j, s in enumerate(spoken_words):
                if j not in spoken_used_indices:
                    if words_match_phonetically(e, s):
                        matched_expected_indices.add(i)
                        spoken_used_indices.add(j)
                        break
                        
    return matched_expected_indices

def evaluate_reading_fluency(expected_text: str, spoken_text: str, duration_seconds: float) -> Dict[str, Any]:
    """
    Evaluates speech reading fluency by comparing standard expected text against spoken transcription.
    Calculates Accuracy, Words Per Minute (WPM), Skipped Words, Incorrect Words, and final Fluency/Pronunciation Scores.
    """
    # Normalize strings: lowercase, remove punctuation
    def clean_text(text: str) -> str:
        text = text.lower()
        # Keep words and alphabets, including devanagari characters
        text = re.sub(r'[^\w\s\u0900-\u097F]', '', text)
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
            "reading_fluency": 0.0,
            "pronunciation_score": 0.0
        }

    # Align words using phonetic matcher
    matched_expected_indices = align_words(expected_words, spoken_words)
    correct_count = len(matched_expected_indices)
    
    accuracy = (correct_count / len(expected_words)) * 100.0

    # Calculate WPM
    duration_minutes = max(duration_seconds, 1.0) / 60.0
    wpm = correct_count / duration_minutes

    # Identify skipped words
    skipped_words = [expected_words[i] for i in range(len(expected_words)) if i not in matched_expected_indices]

    # Identify wrong words (spoken words that were not matched to any expected index)
    # Re-run alignment tracking spoken indices to identify unmatched ones
    spoken_used_indices = set()
    for i in matched_expected_indices:
        for j, s in enumerate(spoken_words):
            if j not in spoken_used_indices:
                if expected_words[i].lower().strip() == s.lower().strip() or words_match_phonetically(expected_words[i], s):
                    spoken_used_indices.add(j)
                    break
    
    wrong_words = [spoken_words[j] for j in range(len(spoken_words)) if j not in spoken_used_indices]

    # Calculate word-level Pronunciation Scores
    word_scores = []
    for i, e in enumerate(expected_words):
        if i in matched_expected_indices:
            # Find which spoken word it matched
            matched_word = None
            for j, s in enumerate(spoken_words):
                if e.lower().strip() == s.lower().strip():
                    matched_word = s
                    break
            
            if matched_word:
                word_scores.append(100.0) # Exact match
            else:
                word_scores.append(85.0)  # Phonetic/similarity match
        else:
            word_scores.append(0.0)       # Skipped / mispronounced

    pronunciation_score = sum(word_scores) / len(expected_words)

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
        "reading_fluency": round(reading_fluency, 1),
        "pronunciation_score": round(pronunciation_score, 1)
    }
