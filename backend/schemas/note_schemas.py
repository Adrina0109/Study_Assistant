from typing import List, Optional
from pydantic import BaseModel

class MCQOptionBase(BaseModel):
    option_text: str
    is_correct: bool

class MCQQuestionBase(BaseModel):
    question: str
    explanation: Optional[str] = None
    options: List[MCQOptionBase]

class QuizFillBase(BaseModel):
    question: str
    answer: str


class KeyPointBase(BaseModel):
    text: str

class TagBase(BaseModel):
    name: str


class NoteCreate(BaseModel):
    original_text: str
    summary: str
    key_points: List[str]
    quiz: List[QuizFillBase]
    mcqs: List[MCQQuestionBase]
    tags: List[str]


class NoteBrief(BaseModel):
    id: int
    summary: str
    tags: List[TagBase] = []

    class Config:
        orm_mode = True


class NoteDetail(BaseModel):
    id: int
    original_text: str
    summary: str
    key_points: List[KeyPointBase]
    quiz: List[QuizFillBase]
    mcqs: List[MCQQuestionBase]
    tags: List[TagBase]

    class Config:
        orm_mode = True
