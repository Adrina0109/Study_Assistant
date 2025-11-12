from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import SessionLocal
from backend.models.models import Note, KeyPoint, QuizFill, MCQQuestion, MCQOption, Tag
from backend.schemas.note_schemas import NoteCreate, NoteBrief, NoteDetail

router = APIRouter(prefix="/notes", tags=["Notes"])



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def get_or_create_tag(db: Session, name: str) -> Tag:
    name = name.strip()
    tag = db.query(Tag).filter(Tag.name == name).first()
    if tag:
        return tag
    tag = Tag(name=name)
    db.add(tag)
    db.flush()
    return tag



@router.post("/save", response_model=NoteDetail)
def save_note(payload: NoteCreate, db: Session = Depends(get_db)):
    """
    Save a new note along with its summary, key points, quizzes, MCQs, and tags.
    """
    try:
        
        note = Note(
            original_text=payload.original_text,
            summary=payload.summary
        )
        db.add(note)
        db.flush()

        
        for kp in payload.key_points or []:
            db.add(KeyPoint(note_id=note.id, text=kp))

        
        for q in payload.quiz or []:
            db.add(QuizFill(note_id=note.id, question=q.question, answer=q.answer))

        
        for m in payload.mcqs or []:
            mcq_q = MCQQuestion(
                note_id=note.id,
                question=m.question,
                explanation=m.explanation or ""
            )
            db.add(mcq_q)
            db.flush()

            
            for opt in m.options or []:
                try:
                    if isinstance(opt, dict):
                        option_text = opt.get("option_text")
                        is_correct = opt.get("is_correct", False)
                    else:
                        option_text = getattr(opt, "option_text", None)
                        is_correct = getattr(opt, "is_correct", False)

                    if option_text is None:
                        option_text = ""  # fallback

                    db.add(
                        MCQOption(
                            mcq_id=mcq_q.id,
                            option_text=option_text,
                            is_correct=bool(is_correct)
                        )
                    )
                except Exception as e:
                    print(f"⚠️ Error saving MCQ option for question '{m.question}': {e}")

        
        for t in payload.tags or []:
            tag = get_or_create_tag(db, t)
            note.tags.append(tag)

        db.commit()
        return get_note(note.id, db)

    except Exception as e:
        db.rollback()
        print(f"\n🔥 ERROR SAVING NOTE: {e}\n")
        raise HTTPException(status_code=500, detail=f"Error saving note: {str(e)}")



@router.get("", response_model=List[NoteBrief])
def list_notes(db: Session = Depends(get_db)):
    notes = (
        db.query(Note)
        .options(joinedload(Note.tags))
        .order_by(Note.updated_at.desc())
        .all()
    )
    return notes


@router.get("/{note_id}", response_model=NoteDetail)
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = (
        db.query(Note)
        .options(
            joinedload(Note.tags),
            joinedload(Note.key_points),
            joinedload(Note.quiz_fill),
            joinedload(Note.mcq_questions).joinedload(MCQQuestion.options),
        )
        .filter(Note.id == note_id)
        .first()
    )

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    
    return {
        "id": note.id,
        "original_text": note.original_text,
        "summary": note.summary,
        "key_points": [{"text": kp.text} for kp in note.key_points],
        "quiz": [{"question": q.question, "answer": q.answer} for q in note.quiz_fill],
        "mcqs": [
            {
                "question": mcq.question,
                "explanation": mcq.explanation,
                "options": [
                    {"option_text": opt.option_text, "is_correct": opt.is_correct}
                    for opt in mcq.options
                ],
            }
            for mcq in note.mcq_questions
        ],
        "tags": [{"name": tag.name} for tag in note.tags],
    }



@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"status": "deleted", "id": note_id}
