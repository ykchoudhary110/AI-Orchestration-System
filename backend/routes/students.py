from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from backend.database import get_db
from backend.models.schemas import (
    Student, StudentCreate, StudentUpdate, StudentResponse,
    CompetencyScore, LearningGap, RiskLevel
)

router = APIRouter(prefix="/api/students", tags=["Students"])

INITIAL_LITERACY_COMPETENCIES = ["letter_recognition", "phonics", "word_reading", "sentence_reading", "comprehension"]
INITIAL_NUMERACY_COMPETENCIES = ["number_recognition", "counting", "number_sense", "addition", "subtraction", "multiplication"]

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    # Check if student name already exists in same school and grade (simple check)
    existing = db.query(Student).filter(
        Student.name == student_in.name,
        Student.school == student_in.school,
        Student.grade == student_in.grade
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already exists in this grade and school.")

    # Create Student
    db_student = Student(
        name=student_in.name,
        age=student_in.age,
        grade=student_in.grade,
        gender=student_in.gender,
        language=student_in.language,
        school=student_in.school
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    # Initialize default baseline competency scores at 0%
    for comp in INITIAL_LITERACY_COMPETENCIES + INITIAL_NUMERACY_COMPETENCIES:
        score = CompetencyScore(student_id=db_student.id, competency=comp, score=0.0)
        db.add(score)

    # Initialize learning gap record: expected level is the current grade level
    gap = LearningGap(
        student_id=db_student.id,
        expected_grade=float(student_in.grade),
        actual_level=0.0,
        gap_years=float(student_in.grade) # default gap matches expected grade since actual level is 0
    )
    db.add(gap)

    # Initialize risk level as LOW or MEDIUM based on grade (higher grades start with medium gap risk)
    initial_risk = "LOW" if student_in.grade <= 1 else "MEDIUM"
    risk = RiskLevel(student_id=db_student.id, risk_level=initial_risk)
    db.add(risk)

    db.commit()
    db.refresh(db_student)
    return db_student


@router.get("", response_model=List[StudentResponse])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student_in: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = student_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)

    # If grade is updated, recalculate the gap expected level
    if "grade" in update_data and student.learning_gap:
        student.learning_gap.expected_grade = float(student.grade)
        student.learning_gap.gap_years = student.learning_gap.expected_grade - student.learning_gap.actual_level

    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"message": f"Student '{student.name}' successfully deleted"}
