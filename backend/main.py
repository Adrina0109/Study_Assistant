from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers.notes import router as notes_router
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from pathlib import Path
import os
import json



load_dotenv(dotenv_path=Path(__file__).parent / ".env")


print("🔍 Loaded API Key:", os.getenv("OPENAI_API_KEY"))


app = FastAPI(title="Study Assistant AI", version="2.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


app.include_router(notes_router)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
)


class TextInput(BaseModel):
    text: str


@app.post("/process-text")
def process_text(data: TextInput):
    """
    Generates AI-based study materials (summary, key points, quiz, MCQs)
    using Gemini API dynamically based on the given topic.
    """
    text = data.text.strip()
    if not text:
        return {"summary": "", "key_points": [], "quiz": [], "mcqs": []}

    try:
        
        prompt = f"""
        You are an expert teacher. Based on the below text, generate:
        1️⃣ A summary (max 5 lines).
        2️⃣ 4 key points.
        3️⃣ 3 fill-in-the-blank questions (with answers).
        4️⃣ 3 meaningful multiple-choice questions based on the topic.
        
        Make sure all content is **relevant** to the given text.
        Each MCQ must have 4 options, one correct answer, and a short explanation.

        Format response strictly as JSON:
        {{
            "summary": "string",
            "key_points": ["string", "string"],
            "quiz": [{{"question": "string", "answer": "string"}}],
            "mcqs": [
                {{
                    "question": "string",
                    "options": ["string", "string", "string", "string"],
                    "answer": "string",
                    "explanation": "string"
                }}
            ]
        }}

        Text:
        {text}
        """

        response = client.chat.completions.create(
            model="gemini-2.0-flash", 
            messages=[
                {"role": "system", "content": "You are a helpful educational AI tutor."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )

        content = response.choices[0].message.content.strip()

        
        content = content.strip("```json").strip("```").strip()

        return json.loads(content)

    except Exception as e:
        print(f" AI generation failed: {e}")
        return {
            "summary": "Unable to generate detailed output right now.",
            "key_points": [],
            "quiz": [],
            "mcqs": [],
        }
