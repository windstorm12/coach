#!/usr/bin/env python3
"""
CoachAI FastAPI Backend
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import coach
from typing import List, Optional, Union
from pydantic import BaseModel
# main.py
import os


# Hugging Face Spaces runs on port 7860
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "*"  # For Hugging Face, allow all (or specify your Vercel domain)
).split(",")
app = FastAPI(title="CoachAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class ClarifyRequest(BaseModel):
    goal: str

class ClarifyResponse(BaseModel):
    questions: List[str]

class QAPair(BaseModel):
    question: str
    answer: str

class PlanRequest(BaseModel):
    goal: str
    qa_pairs: List[QAPair]

class Step(BaseModel):
    step_number: int
    do: str
    why: str
    check: str
    resources: List[str]

class PlanResponse(BaseModel):
    goal: str
    steps: List[Step]
    tips: List[str]
    
    # Goal adjustment tracking
    original_goal: Optional[str] = None
    goal_changed_reason: Optional[str] = None
    
    # Optional existing fields
    total_minutes_calculated: Optional[int] = None
    user_requested_hours: Optional[float] = None
    realistic_hours_needed: Optional[Union[int, str]] = None
    timeline_adjusted: Optional[bool] = None
    adjustment_explanation: Optional[str] = None
    realistic_goal_level: Optional[str] = None

# NEW: Adaptive questioning models
class ContinueRequest(BaseModel):
    goal: str
    qa_pairs: List[QAPair]

class ContinueResponse(BaseModel):
    action: str  # "ask" or "ready"
    question: Optional[str] = None
    reasoning: Optional[str] = None

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    return {"message": "CoachAI API is running"}


@app.post("/api/clarify", response_model=ClarifyResponse)
async def clarify(request: ClarifyRequest):
    """Return initial time question"""
    # Just return the time question - let /api/continue handle adaptive questions
    return {
        "questions": [
            "How much time do you have to achieve this goal? (e.g., '5 days', '3 months', '2 hours per week for 6 months')"
        ]
    }

@app.post("/api/continue", response_model=ContinueResponse)
async def continue_conversation(request: ContinueRequest):
    """Decide if we need more questions or can generate plan"""
    try:
        qa_pairs = [{"question": qa.question, "answer": qa.answer} for qa in request.qa_pairs]
        result = coach.should_ask_more_questions(request.goal, qa_pairs)
        return result
    except Exception as e:
        print(f"[ERROR] Continue conversation failed: {e}")
        import traceback
        traceback.print_exc()
        # On error, default to generating plan with what we have
        return {
            "action": "ready",
            "question": None,
            "reasoning": "Error occurred, proceeding with available information"
        }


@app.post("/api/plan", response_model=PlanResponse)
async def plan(request: PlanRequest):
    """Generate a complete plan"""
    try:
        qa_pairs = [{"question": qa.question, "answer": qa.answer} for qa in request.qa_pairs]
        result = coach.generate_plan(request.goal, qa_pairs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)