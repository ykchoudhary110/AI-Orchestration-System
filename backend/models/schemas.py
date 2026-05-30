from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

# ==========================================
# SQLAlchemy Database Models
# ==========================================

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    grade = Column(Integer, nullable=False) # e.g. 1, 2, 3
    gender = Column(String, nullable=False)
    language = Column(String, nullable=False) # English, Hindi, Marathi, etc.
    school = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessments = relationship("Assessment", back_populates="student", cascade="all, delete-orphan")
    competency_scores = relationship("CompetencyScore", back_populates="student", cascade="all, delete-orphan")
    learning_gap = relationship("LearningGap", back_populates="student", uselist=False, cascade="all, delete-orphan")
    risk_level = relationship("RiskLevel", back_populates="student", uselist=False, cascade="all, delete-orphan")
    progress_history = relationship("ProgressHistory", back_populates="student", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="student", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False) # "literacy" or "numeracy"
    competency = Column(String, nullable=False) # e.g. "phonics", "addition", etc.
    difficulty = Column(Integer, nullable=False) # 1 (easy) to 5 (hard)
    grade_level = Column(Integer, nullable=False) # e.g. 1, 2, 3
    text = Column(Text, nullable=False)
    options = Column(Text, nullable=True) # JSON string of options if multiple choice, e.g. ["A", "B", "C"]
    correct_answer = Column(String, nullable=False) # The correct option or text match
    media_url = Column(String, nullable=True) # For audio files or pictures if needed


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject = Column(String, nullable=False) # "literacy" or "numeracy"
    date = Column(DateTime, default=datetime.utcnow)
    score = Column(Float, default=0.0) # Overall score percentage
    duration_seconds = Column(Integer, default=0)

    student = relationship("Student", back_populates="assessments")
    responses = relationship("QuestionResponse", back_populates="assessment", cascade="all, delete-orphan")


class QuestionResponse(Base):
    __tablename__ = "question_responses"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    student_response = Column(String, nullable=True)
    is_correct = Column(Boolean, nullable=False)
    response_time_seconds = Column(Integer, default=0)

    assessment = relationship("Assessment", back_populates="responses")
    question = relationship("Question")


class CompetencyScore(Base):
    __tablename__ = "competency_scores"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    competency = Column(String, nullable=False)
    score = Column(Float, nullable=False) # Score from 0 to 100
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="competency_scores")


class LearningGap(Base):
    __tablename__ = "learning_gaps"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, unique=True)
    expected_grade = Column(Float, nullable=False)
    actual_level = Column(Float, nullable=False)
    gap_years = Column(Float, nullable=False) # expected_grade - actual_level
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="learning_gap")


class RiskLevel(Base):
    __tablename__ = "risk_levels"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, unique=True)
    risk_level = Column(String, nullable=False) # "LOW", "MEDIUM", "HIGH"
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="risk_level")


class ProgressHistory(Base):
    __tablename__ = "progress_history"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    competency = Column(String, nullable=False)
    score = Column(Float, nullable=False)

    student = relationship("Student", back_populates="progress_history")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    competency = Column(String, nullable=False)
    risk_level = Column(String, nullable=False) # "LOW", "MEDIUM", "HIGH"
    recommendation_text = Column(Text, nullable=False)
    parent_report = Column(Text, nullable=True) # Report generated for parent in regional lang
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="recommendations")


# ==========================================
# Pydantic Schemas for Serialization
# ==========================================

class StudentBase(BaseModel):
    name: str
    age: int
    grade: int
    gender: str
    language: str
    school: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    grade: Optional[int] = None
    gender: Optional[str] = None
    language: Optional[str] = None
    school: Optional[str] = None

class CompetencyScoreSchema(BaseModel):
    competency: str
    score: float
    updated_at: datetime
    class Config:
        orm_mode = True

class LearningGapSchema(BaseModel):
    expected_grade: float
    actual_level: float
    gap_years: float
    updated_at: datetime
    class Config:
        orm_mode = True

class RiskLevelSchema(BaseModel):
    risk_level: str
    updated_at: datetime
    class Config:
        orm_mode = True

class StudentResponse(StudentBase):
    id: int
    created_at: datetime
    competency_scores: List[CompetencyScoreSchema] = []
    learning_gap: Optional[LearningGapSchema] = None
    risk_level: Optional[RiskLevelSchema] = None

    class Config:
        orm_mode = True
        from_attributes = True


class QuestionBase(BaseModel):
    subject: str
    competency: str
    difficulty: int
    grade_level: int
    text: str
    options: Optional[str] = None
    correct_answer: str
    media_url: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionResponseSchema(QuestionBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True


class ResponseSubmit(BaseModel):
    question_id: int
    student_response: str
    response_time_seconds: int

class AssessmentStartRequest(BaseModel):
    student_id: int
    subject: str

class AssessmentStartResponse(BaseModel):
    assessment_id: int
    first_question: Optional[QuestionResponseSchema] = None

class AdaptiveNextRequest(BaseModel):
    assessment_id: int
    last_question_id: int
    student_response: str
    response_time_seconds: int

class AdaptiveNextResponse(BaseModel):
    finished: bool
    next_question: Optional[QuestionResponseSchema] = None
    current_progress: int # Count of questions answered

class AssessmentSubmitRequest(BaseModel):
    assessment_id: int
    duration_seconds: int

class VoiceEvaluationRequest(BaseModel):
    student_id: int
    expected_text: str
    spoken_text: str
    duration_seconds: float # Used to compute WPM

class VoiceEvaluationResponse(BaseModel):
    expected_text: str
    spoken_text: str
    accuracy: float
    words_per_minute: float
    skipped_words: List[str]
    wrong_words: List[str]
    reading_fluency: float
