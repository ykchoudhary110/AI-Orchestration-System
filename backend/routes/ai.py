from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from backend.database import get_db
from backend.models.schemas import Student, Recommendation, CompetencyScore, LearningGap, RiskLevel
from backend.services.ai.recommender import (
    generate_class_summary_ai, 
    generate_teacher_recommendation, 
    generate_question_ai
)

router = APIRouter(prefix="/api/ai", tags=["AI"])

class QuestionGenRequest(BaseModel):
    subject: str
    competency: str
    difficulty: int
    grade_level: int
    language: str


@router.get("/recommendations/{student_id}")
def get_student_recommendations(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    recs = db.query(Recommendation)\
             .filter(Recommendation.student_id == student_id)\
             .order_by(Recommendation.created_at.desc())\
             .all()
             
    if not recs:
        # Generate on the fly if none exist
        weakest = db.query(CompetencyScore)\
                    .filter(CompetencyScore.student_id == student_id)\
                    .order_by(CompetencyScore.score.asc())\
                    .first()
                    
        comp_name = weakest.competency if weakest else "dictation"
        risk_val = student.risk_level.risk_level if student.risk_level else "MEDIUM"
        
        is_literacy = comp_name in ["dictation", "sentence_reading", "comprehension", "reading_fluency"]
        new_recom = generate_teacher_recommendation(
            student_name=student.name,
            subject="literacy" if is_literacy else "numeracy",
            competency=comp_name,
            risk_level=risk_val,
            grade=student.grade
        )
        
        # Save it
        rec_rec = Recommendation(
            student_id=student_id,
            competency=comp_name,
            risk_level=risk_val,
            recommendation_text=new_recom["teacher"],
            parent_report=new_recom["parent"]
        )
        db.add(rec_rec)
        db.commit()
        db.refresh(rec_rec)
        recs = [rec_rec]

    return {
        "student_id": student_id,
        "student_name": student.name,
        "recommendations": [
            {
                "id": r.id,
                "competency": r.competency.replace("_", " ").title(),
                "risk_level": r.risk_level,
                "teacher_recommendation": r.recommendation_text,
                "parent_report": r.parent_report,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M")
            } for r in recs
        ]
    }


@router.post("/class-summary")
def get_class_summary(grade: int, db: Session = Depends(get_db)):
    students_in_grade = db.query(Student).filter(Student.grade == grade).all()
    if not students_in_grade:
        return {"summary": f"No student records found for Grade {grade}."}

    student_ids = [s.id for s in students_in_grade]
    total_students = len(student_ids)

    high_risk_count = db.query(RiskLevel)\
                        .filter(RiskLevel.student_id.in_(student_ids), RiskLevel.risk_level == "HIGH")\
                        .count()

    avg_gap_res = db.query(func.avg(LearningGap.gap_years))\
                    .filter(LearningGap.student_id.in_(student_ids))\
                    .scalar()
    avg_learning_gap = round(float(avg_gap_res), 2) if avg_gap_res is not None else 0.0

    weak_comp_res = db.query(CompetencyScore.competency, func.avg(CompetencyScore.score))\
                      .filter(CompetencyScore.student_id.in_(student_ids))\
                      .group_by(CompetencyScore.competency)\
                      .order_by(func.avg(CompetencyScore.score).asc())\
                      .limit(3).all()
                      
    weak_competencies = [comp.replace("_", " ").title() for comp, avg_s in weak_comp_res]

    stats = {
        "total_students": total_students,
        "high_risk_count": high_risk_count,
        "avg_learning_gap": avg_learning_gap,
        "weak_competencies": weak_competencies
    }

    summary_text = generate_class_summary_ai(grade, stats)

    return {
        "grade": grade,
        "stats": stats,
        "summary": summary_text
    }


@router.post("/generate-question")
def generate_question_endpoint(req: QuestionGenRequest):
    try:
        q = generate_question_ai(
            subject=req.subject,
            competency=req.competency,
            difficulty=req.difficulty,
            grade_level=req.grade_level,
            language=req.language
        )
        return q
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
