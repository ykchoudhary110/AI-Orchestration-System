from fastapi import APIRouter, Depends, HTTPException, status, File, Form, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import csv
import io
import json
from backend.database import get_db
from backend.models.schemas import (
    Student, StudentCreate, StudentUpdate, StudentResponse,
    CompetencyScore, LearningGap, RiskLevel, School, Teacher,
    SchoolCreate, SchoolResponse, TeacherCreate, TeacherResponse,
    Assessment, QuestionResponse, Question
)

router = APIRouter(prefix="/api/students", tags=["Students"])

INITIAL_LITERACY_COMPETENCIES = ["dictation", "sentence_reading", "comprehension"]
INITIAL_NUMERACY_COMPETENCIES = ["number_recognition", "counting", "number_sense", "addition", "subtraction", "multiplication"]

# ==========================================
# School CRUD APIs
# ==========================================

@router.get("/schools", response_model=List[SchoolResponse])
def list_schools(db: Session = Depends(get_db)):
    return db.query(School).all()

@router.post("/schools", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED)
def create_school(school_in: SchoolCreate, db: Session = Depends(get_db)):
    existing = db.query(School).filter(School.name == school_in.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="School with this name already exists.")
    
    db_school = School(
        name=school_in.name.strip(),
        location=school_in.location.strip() if school_in.location else None
    )
    db.add(db_school)
    db.commit()
    db.refresh(db_school)
    return db_school

@router.delete("/schools/{school_id}")
def delete_school(school_id: int, db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    db.delete(school)
    db.commit()
    return {"message": f"School '{school.name}' successfully deleted"}


# ==========================================
# Teacher CRUD APIs
# ==========================================

@router.get("/teachers", response_model=List[TeacherResponse])
def list_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()

@router.post("/teachers", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(teacher_in: TeacherCreate, db: Session = Depends(get_db)):
    db_teacher = Teacher(
        name=teacher_in.name.strip(),
        email=teacher_in.email.strip() if teacher_in.email else None,
        school_id=teacher_in.school_id
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.delete("/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    db.delete(teacher)
    db.commit()
    return {"message": f"Teacher '{teacher.name}' successfully deleted"}


# ==========================================
# Student CRUD APIs
# ==========================================

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    # Check if student name already exists in same school and grade
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
        school=student_in.school,
        school_id=student_in.school_id,
        teacher_id=student_in.teacher_id
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


# ==========================================
# Bulk Student CSV Import API
# ==========================================

@router.post("/import")
def import_students_csv(
    file: UploadFile = File(...),
    school_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    try:
        content = file.file.read().decode("utf-8")
        csv_file = io.StringIO(content)
        # Handle excel dialect or commas automatically
        reader = csv.DictReader(csv_file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {e}")

    # Case-insensitive headers lookup
    headers = [h.strip() for h in reader.fieldnames] if reader.fieldnames else []
    required_cols = ["Name", "Age", "Grade", "Gender", "Language"]
    
    headers_lower = [h.lower() for h in headers]
    mapped_headers = {}
    for col in required_cols:
        col_lower = col.lower()
        if col_lower in headers_lower:
            # find original header
            orig_idx = headers_lower.index(col_lower)
            mapped_headers[col] = headers[orig_idx]
        else:
            raise HTTPException(status_code=400, detail=f"Missing required CSV column: {col}")

    # Determine default school
    default_school_name = "Government Primary School"
    if school_id:
        db_school = db.query(School).filter(School.id == school_id).first()
        if db_school:
            default_school_name = db_school.name

    success_records = []
    duplicate_records = []
    error_records = []
    total_processed = 0

    for line_num, row in enumerate(reader, start=2):
        total_processed += 1
        try:
            name_val = row.get(mapped_headers["Name"], "").strip()
            age_val = row.get(mapped_headers["Age"], "").strip()
            grade_val = row.get(mapped_headers["Grade"], "").strip()
            gender_val = row.get(mapped_headers["Gender"], "").strip()
            lang_val = row.get(mapped_headers["Language"], "").strip()

            if not name_val or not age_val or not grade_val or not gender_val or not lang_val:
                error_records.append({"line": line_num, "error": "Missing values in columns."})
                continue

            try:
                age = int(float(age_val))
                grade = int(float(grade_val))
            except ValueError:
                error_records.append({"line": line_num, "error": f"Age ({age_val}) and Grade ({grade_val}) must be numeric."})
                continue

            # Determine school from row or fallback to default
            school_val = row.get("School", row.get("school", default_school_name)).strip()

            # Prevent duplication in database
            existing = db.query(Student).filter(
                Student.name == name_val,
                Student.school == school_val,
                Student.grade == grade
            ).first()
            if existing:
                duplicate_records.append({"line": line_num, "name": name_val, "error": "Record already exists in system."})
                continue

            # Prevent duplication in session itself
            is_dup_in_session = False
            for s in success_records:
                if s["name"] == name_val and s["grade"] == grade and s["school"] == school_val:
                    is_dup_in_session = True
                    break
            if is_dup_in_session:
                duplicate_records.append({"line": line_num, "name": name_val, "error": "Duplicate entry inside the CSV file."})
                continue

            # Create student record
            db_student = Student(
                name=name_val,
                age=age,
                grade=grade,
                gender=gender_val,
                language=lang_val,
                school=school_val,
                school_id=school_id,
                teacher_id=teacher_id
            )
            db.add(db_student)
            db.commit()
            db.refresh(db_student)

            # Initialize scores, gap, and risk
            for comp in INITIAL_LITERACY_COMPETENCIES + INITIAL_NUMERACY_COMPETENCIES:
                score = CompetencyScore(student_id=db_student.id, competency=comp, score=0.0)
                db.add(score)

            gap = LearningGap(
                student_id=db_student.id,
                expected_grade=float(grade),
                actual_level=0.0,
                gap_years=float(grade)
            )
            db.add(gap)

            initial_risk = "LOW" if grade <= 1 else "MEDIUM"
            risk = RiskLevel(student_id=db_student.id, risk_level=initial_risk)
            db.add(risk)

            db.commit()

            success_records.append({
                "id": db_student.id,
                "name": name_val,
                "grade": grade,
                "school": school_val
            })
        except Exception as e:
            db.rollback()
            error_records.append({"line": line_num, "error": str(e)})

    return {
        "summary": {
            "total_processed": total_processed,
            "success_count": len(success_records),
            "duplicate_count": len(duplicate_records),
            "error_count": len(error_records)
        },
        "successes": success_records,
        "duplicates": duplicate_records,
        "errors": error_records
    }


@router.get("/{student_id}/assessments")
def get_student_assessments(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    assessments = db.query(Assessment).filter(Assessment.student_id == student_id).order_by(Assessment.date.desc()).all()
    
    result = []
    for a in assessments:
        responses = []
        for r in a.responses:
            q = db.query(Question).filter(Question.id == r.question_id).first()
            responses.append({
                "id": r.id,
                "question_id": r.question_id,
                "student_response": r.student_response,
                "is_correct": r.is_correct,
                "response_time_seconds": r.response_time_seconds,
                "audio_url": r.audio_url,
                "accuracy_score": r.accuracy_score,
                "pronunciation_score": r.pronunciation_score,
                "fluency_score": r.fluency_score,
                "wpm": r.wpm,
                "skipped_words": json.loads(r.skipped_words) if r.skipped_words else [],
                "wrong_words": json.loads(r.wrong_words) if r.wrong_words else [],
                "question_text": q.text if q else "Question deleted",
                "question_correct_answer": q.correct_answer if q else "",
                "question_type": q.question_type if q else "Reading",
                "competency": q.competency if q else ""
            })
            
        result.append({
            "id": a.id,
            "subject": a.subject,
            "date": a.date.strftime("%Y-%m-%d %H:%M"),
            "score": a.score,
            "duration_seconds": a.duration_seconds,
            "responses": responses
        })
        
    return result

