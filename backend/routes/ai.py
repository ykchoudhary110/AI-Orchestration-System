from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models.schemas import Student, Recommendation, CompetencyScore, LearningGap, RiskLevel
from backend.services.ai.recommender import generate_class_summary_ai, generate_teacher_recommendation

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.get("/recommendations/{student_id}")
def get_student_recommendations(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    recs = db.query(Recommendation)\
             .filter(Recommendation.student_id == student_id)\
             .order_by(Recommendation.created_at.desc())\
             .all()
             
    # Format and return the latest or list of recommendations
    if not recs:
        # Generate on the fly if none exist
        # Find weakest competency
        weakest = db.query(CompetencyScore)\
                    .filter(CompetencyScore.student_id == student_id)\
                    .order_by(CompetencyScore.score.asc())\
                    .first()
                    
        comp_name = weakest.competency if weakest else "letter_recognition"
        risk_val = student.risk_level.risk_level if student.risk_level else "MEDIUM"
        
        new_recom = generate_teacher_recommendation(
            student_name=student.name,
            subject="literacy" if "reading" in comp_name or "phonics" in comp_name else "numeracy",
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
    # Fetch statistics for students in this grade
    students_in_grade = db.query(Student).filter(Student.grade == grade).all()
    if not students_in_grade:
        return {"summary": f"No student records found for Grade {grade}."}

    student_ids = [s.id for s in students_in_grade]
    total_students = len(student_ids)

    # Risk counts
    high_risk_count = db.query(RiskLevel)\
                        .filter(RiskLevel.student_id.in_(student_ids), RiskLevel.risk_level == "HIGH")\
                        .count()

    # Average learning gap
    avg_gap_res = db.query(func.avg(LearningGap.gap_years))\
                    .filter(LearningGap.student_id.in_(student_ids))\
                    .scalar()
    avg_learning_gap = round(float(avg_gap_res), 2) if avg_gap_res is not None else 0.0

    # Weakest competencies in this grade
    weak_comp_res = db.query(CompetencyScore.competency, func.avg(CompetencyScore.score))\
                      .filter(CompetencyScore.student_id.in_(student_ids))\
                      .group_by(CompetencyScore.competency)\
                      .order_by(func.avg(CompetencyScore.score).asc())\
                      .limit(3).all()
                      
    weak_competencies = [comp.replace("_", " ").title() for comp, avg_s in weak_comp_res]

    # Combine into stats dictionary
    stats = {
        "total_students": total_students,
        "high_risk_count": high_risk_count,
        "avg_learning_gap": avg_learning_gap,
        "weak_competencies": weak_competencies
    }

    # Generate summary text using AI recommender
    summary_text = generate_class_summary_ai(grade, stats)

    return {
        "grade": grade,
        "stats": stats,
        "summary": summary_text
    }
