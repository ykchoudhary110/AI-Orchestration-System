from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Dict, List, Any
from backend.database import get_db
from backend.models.schemas import Student, Assessment, CompetencyScore, LearningGap, RiskLevel

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Total Students
    total_students = db.query(Student).count()

    # 2. Risk Level Counts
    risk_counts = db.query(RiskLevel.risk_level, func.count(RiskLevel.id))\
                    .group_by(RiskLevel.risk_level).all()
    
    risk_map = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for r_level, count in risk_counts:
        if r_level.upper() in risk_map:
            risk_map[r_level.upper()] = count

    # 3. Average Learning Gap
    avg_gap_res = db.query(func.avg(LearningGap.gap_years)).scalar()
    avg_learning_gap = round(float(avg_gap_res), 2) if avg_gap_res is not None else 0.0

    # 4. Recent Assessments
    recent_assessments_db = db.query(Assessment)\
                              .order_by(Assessment.date.desc())\
                              .limit(5).all()
                              
    recent_assessments = []
    for a in recent_assessments_db:
        student = db.query(Student).filter(Student.id == a.student_id).first()
        recent_assessments.append({
            "id": a.id,
            "student_name": student.name if student else "Unknown",
            "student_id": a.student_id,
            "subject": a.subject.title(),
            "date": a.date.strftime("%Y-%m-%d %H:%M"),
            "score": a.score
        })

    # 5. Top 3 Weakest Competencies (across all students, where score is > 0 but low)
    # We query average score per competency where average score is low
    weak_comp_res = db.query(CompetencyScore.competency, func.avg(CompetencyScore.score))\
                      .group_by(CompetencyScore.competency)\
                      .order_by(func.avg(CompetencyScore.score).asc())\
                      .limit(3).all()
                      
    weak_competencies = []
    for comp, avg_s in weak_comp_res:
        weak_competencies.append(comp.replace("_", " ").title())

    return {
        "total_students": total_students,
        "high_risk_count": risk_map["HIGH"],
        "medium_risk_count": risk_map["MEDIUM"],
        "low_risk_count": risk_map["LOW"],
        "avg_learning_gap": avg_learning_gap,
        "recent_assessments": recent_assessments,
        "weak_competencies": weak_competencies
    }


@router.get("/heatmap")
def get_competency_heatmap(db: Session = Depends(get_db)):
    # Group students by grade and calculate average competency scores
    # Output schema: List of dicts, e.g. [{"competency": "Phonics", "G1": 85, "G2": 70, "G3": 45}]
    
    # Let's query competency scores joined with students to get their grades
    results = db.query(
        CompetencyScore.competency,
        Student.grade,
        func.avg(CompetencyScore.score)
    ).join(Student, Student.id == CompetencyScore.student_id)\
     .group_by(CompetencyScore.competency, Student.grade).all()

    # Format the data for Recharts
    # Matrix of competency -> {grade -> average_score}
    matrix = {}
    for comp, grade, avg_score in results:
        comp_title = comp.replace("_", " ").title()
        if comp_title not in matrix:
            matrix[comp_title] = {"competency": comp_title}
        
        grade_key = f"G{grade}"
        matrix[comp_title][grade_key] = round(float(avg_score), 1)

    # Convert dictionary values to a list
    # Ensure all grades 1, 2, 3 have default 0 if missing
    formatted_data = []
    for comp_name, comp_data in matrix.items():
        for g in ["G1", "G2", "G3"]:
            if g not in comp_data:
                comp_data[g] = 0.0
        formatted_data.append(comp_data)

    return formatted_data


@router.get("/gap-chart")
def get_gap_distribution(db: Session = Depends(get_db)):
    # Count students with learning gap: 0-1 years, 1-2 years, 2+ years
    gaps = db.query(LearningGap.gap_years).all()
    
    categories = {
        "0-1 Years": 0,
        "1-2 Years": 0,
        "2+ Years": 0
    }
    
    for gap in gaps:
        g = gap[0]
        if g < 1.0:
            categories["0-1 Years"] += 1
        elif g < 2.0:
            categories["1-2 Years"] += 1
        else:
            categories["2+ Years"] += 1

    # Format as list of dicts for Recharts
    # e.g. [{"range": "0-1 Years", "students": 15}, ...]
    chart_data = []
    for label, count in categories.items():
        chart_data.append({
            "range": label,
            "students": count
        })
        
    return chart_data
