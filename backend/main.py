from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import random
import re


import nltk
from nltk.tokenize import sent_tokenize


import spacy
from spacy.lang.en.stop_words import STOP_WORDS


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str


nlp = spacy.load("en_core_web_sm")


def clean_text(text: str) -> str:
   
    return re.sub(r"\s+", " ", text).strip()

def extract_sentences(text: str) -> List[str]:
    text = clean_text(text)
    try:
        return [s.strip() for s in sent_tokenize(text) if s.strip()]
    except Exception:
       
        return [s.strip() for s in re.split(r"[.!?]\s+", text) if s.strip()]

def extract_keywords(text: str, top_k: int = 20) -> List[str]:
    """Select salient nouns/proper nouns as keywords."""
    doc = nlp(text)
    freq: Dict[str, int] = {}
    for tok in doc:
        if (
            tok.is_alpha
            and tok.pos_ in {"NOUN", "PROPN"}
            and not tok.is_stop
            and len(tok.lemma_) >= 4
        ):
            key = tok.lemma_.lower()
            freq[key] = freq.get(key, 0) + 1
    
    sorted_keys = sorted(freq.items(), key=lambda x: (x[1], len(x[0])), reverse=True)
    return [k for k, _ in sorted_keys][:top_k]

def summarize(text: str, max_sent: int = 3) -> str:
    """Quick extractive summary = first few important-looking sentences (safe for now)."""
    sents = extract_sentences(text)
    return " ".join(sents[:max_sent]) if len(sents) > max_sent else " ".join(sents)

def key_points(text: str, max_points: int = 5) -> List[str]:
    sents = extract_sentences(text)
    return sents[:max_points] if len(sents) >= max_points else sents

def sentence_contains_keyword(sentence: str, keyword: str) -> bool:
    pattern = r"\b" + re.escape(keyword) + r"s?\b"
    return re.search(pattern, sentence, flags=re.IGNORECASE) is not None

def mask_keyword_in_sentence(sentence: str, keyword: str) -> str:
   
    pattern = r"\b" + re.escape(keyword) + r"s?\b"
    return re.sub(pattern, "______", sentence, count=1, flags=re.IGNORECASE)

def generate_fill_in_blanks(text: str, max_q: int = 3) -> List[Dict[str, str]]:
    sents = extract_sentences(text)
    kws = extract_keywords(text, top_k=30)
    quiz = []
    used = set()

    for sent in sents:
       
        kw = next((k for k in kws if sentence_contains_keyword(sent, k)), None)
        if not kw:
            continue
       
        if kw in used:
            continue
        used.add(kw)
        question = mask_keyword_in_sentence(sent, kw)
        quiz.append({"question": question, "answer": kw})
        if len(quiz) >= max_q:
            break
    return quiz


PIGMENTS = ["chlorophyll", "carotene", "xanthophyll", "anthocyanin"]
PHOTO_TERMS = ["glucose", "oxygen", "carbon dioxide", "stomata", "thylakoid", "chloroplast"]
CS_TERMS = ["algorithm", "database", "compiler", "encryption", "protocol", "framework"]

def choose_domain_pool(text: str) -> List[str]:
    t = text.lower()
    if any(x in t for x in ["photosynthesis", "chlorophyll", "leaf", "plant"]):
        return list(set(PIGMENTS + PHOTO_TERMS))
    if any(x in t for x in ["computer", "software", "database", "algorithm", "network"]):
        return CS_TERMS
    return [] 

def generate_distractors(answer: str, keywords: List[str], doc_words: List[str], domain_pool: List[str], need: int = 3) -> List[str]:
    cand = []

 
    if domain_pool:
        cand += [w for w in domain_pool if w.lower() != answer.lower()]

    cand += [w for w in keywords if w.lower() != answer.lower()]

    cand += [w for w in doc_words if w.lower() != answer.lower()]

    seen = set()
    cleaned = []
    for w in cand:
        lw = w.lower().strip()
        if not lw or lw == answer.lower():
            continue
        if lw in seen:
            continue
        seen.add(lw)
        cleaned.append(w)

    random.shuffle(cleaned)
    return cleaned[:need]

def extract_doc_nouns(text: str, limit: int = 30) -> List[str]:
    doc = nlp(text)
    nouns = []
    for tok in doc:
        if tok.is_alpha and tok.pos_ in {"NOUN", "PROPN"} and not tok.is_stop and len(tok.lemma_) >= 4:
            nouns.append(tok.lemma_.lower())
    
    out = []
    for n in nouns:
        if n not in out:
            out.append(n)
    return out[:limit]

def generate_mcqs(text: str, n_mcq: int = 3) -> List[Dict[str, Any]]:
    sents = extract_sentences(text)
    kws = extract_keywords(text, top_k=30)
    doc_nouns = extract_doc_nouns(text)
    domain_pool = choose_domain_pool(text)

    mcqs = []
    used_kw = set()

    for sent in sents:
      
        kw = next((k for k in kws if sentence_contains_keyword(sent, k) and k not in used_kw), None)
        if not kw:
            continue
        used_kw.add(kw)


        answer = kw
        distractors = generate_distractors(answer, kws, doc_nouns, domain_pool, need=3)
        if len(distractors) < 3:
            
            fillers = ["context", "process", "system", "element", "factor", "structure"]
            for f in fillers:
                if len(distractors) >= 3: break
                if f.lower() != answer.lower() and f not in distractors:
                    distractors.append(f)

        options = [answer] + distractors[:3]
        random.shuffle(options)

        
        question_text = f"Fill in the blank: {mask_keyword_in_sentence(sent, kw)}"
        explanation = f"The sentence in the passage explicitly uses “{kw}”: {sent}"

        mcqs.append({
            "question": question_text,
            "options": options,
            "answer": answer,
            "explanation": explanation
        })

        if len(mcqs) >= n_mcq:
            break

    return mcqs


@app.post("/process-text")
def process_text(request: TextRequest):
    text = clean_text(request.text)
    sents = extract_sentences(text)

    payload = {
        "summary": summarize(text, max_sent=3),
        "key_points": key_points(text, max_points=5),
        "quiz": generate_fill_in_blanks(text, max_q=3),   # KEEP old fill-in-the-blank
        "mcqs": generate_mcqs(text, n_mcq=3),             # NEW MCQs with explanations
    }
    return payload
