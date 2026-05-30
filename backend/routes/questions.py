from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.models.schemas import Question, QuestionCreate, QuestionUpdate, QuestionResponseSchema

router = APIRouter(prefix="/api/questions", tags=["Questions"])

class QuestionStatusUpdate(BaseModel):
    is_active: bool

class QuestionImportList(BaseModel):
    questions: List[QuestionCreate]

@router.get("", response_model=List[QuestionResponseSchema])
def list_questions(
    subject: Optional[str] = None,
    competency: Optional[str] = None,
    grade_level: Optional[int] = None,
    language: Optional[str] = None,
    question_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Question)
    if subject:
        query = query.filter(Question.subject == subject.lower())
    if competency:
        query = query.filter(Question.competency == competency.lower())
    if grade_level:
        query = query.filter(Question.grade_level == grade_level)
    if language:
        query = query.filter(Question.language == language)
    if question_type:
        query = query.filter(Question.question_type == question_type)
    if is_active is not None:
        query = query.filter(Question.is_active == is_active)
        
    return query.all()


@router.post("", response_model=QuestionResponseSchema, status_code=status.HTTP_201_CREATED)
def create_question(question_in: QuestionCreate, db: Session = Depends(get_db)):
    db_question = Question(
        subject=question_in.subject.lower(),
        competency=question_in.competency.lower(),
        difficulty=question_in.difficulty,
        grade_level=question_in.grade_level,
        text=question_in.text,
        options=question_in.options,
        correct_answer=question_in.correct_answer,
        media_url=question_in.media_url,
        language=question_in.language or "English",
        question_type=question_in.question_type or "MCQ",
        is_active=question_in.is_active if question_in.is_active is not None else True,
        is_teacher_created=question_in.is_teacher_created if question_in.is_teacher_created is not None else False
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.put("/{question_id}", response_model=QuestionResponseSchema)
def update_question(question_id: int, question_in: QuestionUpdate, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    update_data = question_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "subject" or key == "competency":
            setattr(q, key, value.lower())
        else:
            setattr(q, key, value)
            
    db.commit()
    db.refresh(q)
    return q


@router.patch("/{question_id}/status", response_model=QuestionResponseSchema)
def toggle_question_status(question_id: int, status_in: QuestionStatusUpdate, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.is_active = status_in.is_active
    db.commit()
    db.refresh(q)
    return q


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question successfully deleted"}


@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_questions(req: QuestionImportList, db: Session = Depends(get_db)):
    imported_list = []
    for q_in in req.questions:
        db_q = Question(
            subject=q_in.subject.lower(),
            competency=q_in.competency.lower(),
            difficulty=q_in.difficulty,
            grade_level=q_in.grade_level,
            text=q_in.text,
            options=q_in.options,
            correct_answer=q_in.correct_answer,
            media_url=q_in.media_url,
            language=q_in.language or "English",
            question_type=q_in.question_type or "MCQ",
            is_active=q_in.is_active if q_in.is_active is not None else True,
            is_teacher_created=q_in.is_teacher_created if q_in.is_teacher_created is not None else False
        )
        db.add(db_q)
        imported_list.append(db_q)
    db.commit()
    return {"message": f"Successfully imported {len(imported_list)} questions."}
