from fastapi import APIRouter, Depends, HTTPException, status, File, Form, UploadFile
from sqlalchemy.orm import Session
import os
import requests
from datetime import datetime
from typing import List, Dict, Any
from backend.database import get_db
from backend.models.schemas import (
    Student, Question, Assessment, QuestionResponse, CompetencyScore,
    LearningGap, RiskLevel, ProgressHistory, Recommendation,
    AssessmentStartRequest, AssessmentStartResponse, AdaptiveNextRequest,
    AdaptiveNextResponse, AssessmentSubmitRequest, VoiceEvaluationRequest,
    VoiceEvaluationResponse, QuestionResponseSchema
)
from backend.services.assessment.engine import get_next_adaptive_question, evaluate_reading_fluency
from backend.services.ai.recommender import generate_teacher_recommendation
from faster_whisper import WhisperModel

# Initialize Whisper model globally for fast offline reuse
try:
    print("[Whisper] Pre-loading local Whisper model...")
    whisper_model = WhisperModel("tiny", device="cpu", compute_type="float32")
    print("[Whisper] Local Whisper model loaded successfully.")
except Exception as ex:
    print(f"[Whisper Error] Failed to pre-load Whisper model: {ex}")
    whisper_model = None

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

@router.post("/start", response_model=AssessmentStartResponse)
def start_assessment(req: AssessmentStartRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Create Assessment session
    assessment = Assessment(
        student_id=req.student_id,
        subject=req.subject.lower(),
        score=0.0,
        duration_seconds=0
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Get first adaptive question
    adaptive_result = get_next_adaptive_question(db, assessment.id)
    first_q = adaptive_result["next_question"]

    return AssessmentStartResponse(
        assessment_id=assessment.id,
        first_question=QuestionResponseSchema.from_orm(first_q) if first_q else None
    )


@router.post("/next-question", response_model=AdaptiveNextResponse)
def next_question(req: AdaptiveNextRequest, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    # Fetch the question to compare answer
    question = db.query(Question).filter(Question.id == req.last_question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Previous question not found")

    # Check correctness
    # Ignore case and trailing spaces
    expected = question.correct_answer.strip().lower()
    received = req.student_response.strip().lower()
    
    # For multiple choice, check if they sent Option index or option content
    is_correct = (received == expected)

    # Record the response
    response = QuestionResponse(
        assessment_id=req.assessment_id,
        question_id=req.last_question_id,
        student_response=req.student_response,
        is_correct=is_correct,
        response_time_seconds=req.response_time_seconds
    )
    db.add(response)
    db.commit()

    # Determine next question
    adaptive_result = get_next_adaptive_question(db, req.assessment_id)
    
    next_q = adaptive_result["next_question"]
    finished = adaptive_result["finished"]

    return AdaptiveNextResponse(
        finished=finished,
        next_question=QuestionResponseSchema.from_orm(next_q) if next_q else None,
        current_progress=adaptive_result["progress"]
    )


@router.post("/submit")
def submit_assessment(req: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    student = db.query(Student).filter(Student.id == assessment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Update assessment metadata
    assessment.duration_seconds = req.duration_seconds

    # Load all responses in this session
    responses = db.query(QuestionResponse).filter(QuestionResponse.assessment_id == req.assessment_id).all()
    if not responses:
        raise HTTPException(status_code=400, detail="No responses found in this session.")

    total_questions = len(responses)
    correct_count = sum(1 for r in responses if r.is_correct)
    overall_score = (correct_count / total_questions) * 100.0 if total_questions > 0 else 0.0
    assessment.score = round(overall_score, 1)

    # Group responses by competency to update scores
    comp_map = {}
    for r in responses:
        q = db.query(Question).filter(Question.id == r.question_id).first()
        if q:
            if q.competency not in comp_map:
                comp_map[q.competency] = []
            comp_map[q.competency].append(r)

    # Competency Scoring Logic:
    # We find the highest difficulty level (1-5) answered correctly for each tested competency
    # Normalized score: max_correct_difficulty * 20 (e.g. 5 = 100%, 3 = 60%, 1 = 20%, 0 = 0%)
    updated_scores = {}
    for competency, comp_responses in comp_map.items():
        max_correct_diff = 0
        for r in comp_responses:
            q = db.query(Question).filter(Question.id == r.question_id).first()
            if q and r.is_correct and q.difficulty > max_correct_diff:
                max_correct_diff = q.difficulty
        
        # If they got none correct, but answered some, check if they answered difficulty 1 wrong (score 0%)
        # Let's say: score = max_correct_diff * 20
        score_value = float(max_correct_diff * 20)
        
        # Find or create CompetencyScore record
        comp_score_rec = db.query(CompetencyScore).filter(
            CompetencyScore.student_id == student.id,
            CompetencyScore.competency == competency
        ).first()

        if comp_score_rec:
            # If current test is better or it's a diagnostic update, update the score
            # (We overwrite it with the latest assessment results to keep a fresh profile)
            comp_score_rec.score = score_value
            comp_score_rec.updated_at = datetime.utcnow()
        else:
            comp_score_rec = CompetencyScore(
                student_id=student.id,
                competency=competency,
                score=score_value
            )
            db.add(comp_score_rec)
        
        updated_scores[competency] = score_value

        # Log into longitudinal ProgressHistory
        prog = ProgressHistory(
            student_id=student.id,
            date=datetime.utcnow(),
            competency=competency,
            score=score_value
        )
        db.add(prog)

    # Re-calculate the Overall Actual Learning Level of the student
    # We map the competency scores to an equivalent grade level (0.0 to 5.0)
    # Average of all competency scores (0-100) converted to a scale of 1-5
    all_scores = db.query(CompetencyScore).filter(CompetencyScore.student_id == student.id).all()
    if all_scores:
        avg_score = sum(s.score for s in all_scores) / len(all_scores)
        # Convert 0-100 to 0.0 - 5.0 grade equivalent (e.g. 60% = Grade 3.0 level)
        actual_level = round((avg_score / 100.0) * 5.0, 2)
    else:
        actual_level = 0.0

    # Update Learning Gap
    expected_grade = float(student.grade)
    gap_years = max(0.0, round(expected_grade - actual_level, 2))

    gap_rec = db.query(LearningGap).filter(LearningGap.student_id == student.id).first()
    if gap_rec:
        gap_rec.actual_level = actual_level
        gap_rec.gap_years = gap_years
        gap_rec.updated_at = datetime.utcnow()
    else:
        gap_rec = LearningGap(
            student_id=student.id,
            expected_grade=expected_grade,
            actual_level=actual_level,
            gap_years=gap_years
        )
        db.add(gap_rec)

    # Update Risk Level: Gap > 2 = HIGH, 1-2 = MEDIUM, < 1 = LOW
    new_risk = "LOW"
    if gap_years >= 2.0:
        new_risk = "HIGH"
    elif gap_years >= 1.0:
        new_risk = "MEDIUM"

    risk_rec = db.query(RiskLevel).filter(RiskLevel.student_id == student.id).first()
    if risk_rec:
        risk_rec.risk_level = new_risk
        risk_rec.updated_at = datetime.utcnow()
    else:
        risk_rec = RiskLevel(
            student_id=student.id,
            risk_level=new_risk
        )
        db.add(risk_rec)

    # Identify the weakest competency from the latest test to generate a targeted intervention
    weakest_comp = None
    lowest_score = 101.0
    for competency, score in updated_scores.items():
        if score < lowest_score:
            lowest_score = score
            weakest_comp = competency

    ai_recom = {"teacher": "Keep practicing core competencies.", "parent": "नियमित अभ्यास कराएं।"}
    if weakest_comp:
        # Call the AI recommender
        ai_recom = generate_teacher_recommendation(
            student_name=student.name,
            subject=assessment.subject,
            competency=weakest_comp,
            risk_level=new_risk,
            grade=student.grade
        )
        # Save Recommendation
        recom_rec = Recommendation(
            student_id=student.id,
            competency=weakest_comp,
            risk_level=new_risk,
            recommendation_text=ai_recom["teacher"],
            parent_report=ai_recom["parent"]
        )
        db.add(recom_rec)

    db.commit()

    return {
        "assessment_id": assessment.id,
        "score": assessment.score,
        "duration_seconds": assessment.duration_seconds,
        "updated_competency_scores": updated_scores,
        "actual_level": actual_level,
        "learning_gap": gap_years,
        "risk_level": new_risk,
        "weakest_competency": weakest_comp,
        "recommendation": ai_recom
    }


@router.post("/voice-eval", response_model=VoiceEvaluationResponse)
def voice_evaluation(req: VoiceEvaluationRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Evaluate voice reading fluency
    result = evaluate_reading_fluency(req.expected_text, req.spoken_text, req.duration_seconds)

    # Update or add Reading Fluency score as a CompetencyScore in the database
    fluency_score = result["reading_fluency"]
    
    comp_score = db.query(CompetencyScore).filter(
        CompetencyScore.student_id == student.id,
        CompetencyScore.competency == "reading_fluency"
    ).first()

    if comp_score:
        comp_score.score = fluency_score
        comp_score.updated_at = datetime.utcnow()
    else:
        comp_score = CompetencyScore(
            student_id=student.id,
            competency="reading_fluency",
            score=fluency_score
        )
        db.add(comp_score)

    # Add to Progress History
    prog = ProgressHistory(
        student_id=student.id,
        date=datetime.utcnow(),
        competency="reading_fluency",
        score=fluency_score
    )
    db.add(prog)
    db.commit()

    return VoiceEvaluationResponse(
        expected_text=result["expected_text"],
        spoken_text=result["spoken_text"],
        accuracy=result["accuracy"],
        words_per_minute=result["words_per_minute"],
        skipped_words=result["skipped_words"],
        wrong_words=result["wrong_words"],
        reading_fluency=result["reading_fluency"]
    )


LM_STUDIO_AUDIO_URL = "http://localhost:1234/v1/audio/transcriptions"

@router.post("/voice-upload-file")
async def voice_upload_file(
    student_id: int = Form(...),
    expected_text: str = Form(...),
    duration_seconds: float = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Save the file temporarily
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    temp_dir = os.path.join(backend_dir, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Save with a clean extension (like wav or webm depending on MIME)
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'wav'
    temp_file_path = os.path.join(temp_dir, f"temp_{student_id}_{int(datetime.utcnow().timestamp())}.{ext}")

    try:
        content = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        print(f"[Audio Save Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save temporary audio file: {e}")

    transcribed_text = ""
    transcription_source = "Local Python Whisper"

    # Transcribe the audio file using the local Whisper model
    try:
        global whisper_model
        if whisper_model is None:
            print("[Whisper] Model not pre-loaded. Attempting to load now...")
            whisper_model = WhisperModel("tiny", device="cpu", compute_type="float32")
        
        segments, info = whisper_model.transcribe(temp_file_path, beam_size=5)
        transcribed_text = "".join([segment.text for segment in segments]).strip()
        print(f"[Audio Transcription] Successfully transcribed offline: {transcribed_text}")
    except Exception as e:
        print(f"[Audio Transcription Failed] Local Whisper failed: {e}. Prompting manual grade.")
        transcription_source = "Offline (Failed to connect to Local Whisper)"
        transcribed_text = "FAILED_LOCAL_TRANSCRIPTION"

    # Clean up file
    try:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
    except Exception as e:
        print(f"[Audio Cleanup Error] Failed to delete temp file: {e}")

    if transcribed_text == "FAILED_LOCAL_TRANSCRIPTION":
        # Return fallback error results so the frontend knows to unlock manual evaluation
        return {
            "expected_text": expected_text,
            "spoken_text": "",
            "accuracy": 0.0,
            "words_per_minute": 0.0,
            "skipped_words": expected_text.split(),
            "wrong_words": [],
            "reading_fluency": 0.0,
            "transcription_source": "Offline (Failed to connect to Local Whisper)"
        }

    # Evaluate voice reading fluency metrics
    result = evaluate_reading_fluency(expected_text, transcribed_text, duration_seconds)

    # Save to database
    fluency_score = result["reading_fluency"]
    
    comp_score = db.query(CompetencyScore).filter(
        CompetencyScore.student_id == student.id,
        CompetencyScore.competency == "reading_fluency"
    ).first()

    if comp_score:
        comp_score.score = fluency_score
        comp_score.updated_at = datetime.utcnow()
    else:
        comp_score = CompetencyScore(
            student_id=student.id,
            competency="reading_fluency",
            score=fluency_score
        )
        db.add(comp_score)

    # Add to Progress History log
    prog = ProgressHistory(
        student_id=student.id,
        date=datetime.utcnow(),
        competency="reading_fluency",
        score=fluency_score
    )
    db.add(prog)
    db.commit()

    return {
        "expected_text": result["expected_text"],
        "spoken_text": result["spoken_text"],
        "accuracy": result["accuracy"],
        "words_per_minute": result["words_per_minute"],
        "skipped_words": result["skipped_words"],
        "wrong_words": result["wrong_words"],
        "reading_fluency": result["reading_fluency"],
        "transcription_source": transcription_source
    }
