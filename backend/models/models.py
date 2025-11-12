from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from backend.database import Base


note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    key_points = relationship("KeyPoint", back_populates="note", cascade="all, delete-orphan")
    quiz_fill = relationship("QuizFill", back_populates="note", cascade="all, delete-orphan")
    mcq_questions = relationship("MCQQuestion", back_populates="note", cascade="all, delete-orphan")

    tags = relationship("Tag", secondary=note_tags, back_populates="notes", cascade="save-update")

class KeyPoint(Base):
    __tablename__ = "key_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"))
    text: Mapped[str] = mapped_column(Text, nullable=False)

    note = relationship("Note", back_populates="key_points")

class QuizFill(Base):
    __tablename__ = "quiz_fill"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(String(255), nullable=False)

    note = relationship("Note", back_populates="quiz_fill")

class MCQQuestion(Base):
    __tablename__ = "mcq_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    note = relationship("Note", back_populates="mcq_questions")
    options = relationship("MCQOption", back_populates="mcq", cascade="all, delete-orphan")

class MCQOption(Base):
    __tablename__ = "mcq_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mcq_id: Mapped[int] = mapped_column(ForeignKey("mcq_questions.id", ondelete="CASCADE"))
    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    mcq = relationship("MCQQuestion", back_populates="options")

class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    notes = relationship("Note", secondary=note_tags, back_populates="tags")
