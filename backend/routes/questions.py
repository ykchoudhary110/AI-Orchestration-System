from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.schemas import Question, QuestionCreate, QuestionResponseSchema

router = APIRouter(prefix="/api/questions", tags=["Questions"])

@router.get("", response_model=List[QuestionResponseSchema])
def list_questions(
    subject: Optional[str] = None,
    competency: Optional[str] = None,
    grade_level: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Question)
    if subject:
        query = query.filter(Question.subject == subject.lower())
    if competency:
        query = query.filter(Question.competency == competency.lower())
    if grade_level:
        query = query.filter(Question.grade_level == grade_level)
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
        media_url=question_in.media_url
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question successfully deleted"}
