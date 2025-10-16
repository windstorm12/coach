#!/usr/bin/env python3
"""
CoachAI Logic - Gemini-Powered Goal Planning
"""

import os
import json
import re
from datetime import datetime, timedelta
from typing import Optional

# =============================================================================
# GEMINI SETUP
# =============================================================================

def setup_gemini():
    """Initialize Gemini AI model"""
    try:
        import google.generativeai as genai
    except ImportError:
        raise RuntimeError("Run: pip install google-generativeai")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Set GEMINI_API_KEY environment variable")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    return model


def extract_json(text: str):
    """Extract JSON from AI response"""
    if not text:
        return None

    text = re.sub(r'^\s*```(?:json)?\s*|\s*```\s*$', '', text, flags=re.S)

    try:
        return json.loads(text)
    except:
        pass

    for open_ch, close_ch in [('{', '}'), ('[', ']')]:
        depth = 0
        start = None
        for i, ch in enumerate(text):
            if ch == open_ch:
                if depth == 0:
                    start = i
                depth += 1
            elif ch == close_ch and depth:
                depth -= 1
                if depth == 0 and start is not None:
                    try:
                        return json.loads(text[start:i+1])
                    except:
                        pass

    return None


def call_gemini(model, prompt: str, max_tokens: int = 4096) -> Optional[dict]:
    """Call Gemini and return JSON response"""
    try:
        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": max_tokens}
        )
        
        text = response.text if hasattr(response, 'text') else ""
        
        # Try to extract JSON
        data = extract_json(text)
        if data:
            print(f"[SUCCESS] Parsed JSON response")
            return data
        else:
            print(f"[WARN] Could not parse JSON from response")
            print(f"[DEBUG] Response text: {text[:200]}...")
            return None
            
    except Exception as e:
        print(f"[ERROR] Gemini call failed: {e}")
        import traceback
        traceback.print_exc()
        return None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _parse_minutes(value) -> int:
    """Coerce various minute formats to int minutes. Defaults to 60 if unknown."""
    if value is None:
        return 60
    if isinstance(value, (int, float)):
        return max(1, int(value))
    if isinstance(value, str):
        s = value.strip().lower()
        hours = 0
        mins = 0
        try:
            if 'h' in s or 'm' in s:
                h = re.search(r'(\d+)\s*h', s)
                m = re.search(r'(\d+)\s*m', s)
                if h: hours = int(h.group(1))
                if m: mins = int(m.group(1))
                if not h and not m:
                    digits = re.findall(r'\d+', s)
                    if digits:
                        mins = int(digits[0])
                return max(1, hours * 60 + mins)
            return max(1, int(float(s)))
        except:
            return 60
    return 60


def _format_hm(total_minutes: int) -> str:
    """Format minutes as 'Xh Ym' or 'Xh' or 'Ym'"""
    total_minutes = max(0, int(total_minutes))
    h = total_minutes // 60
    m = total_minutes % 60
    if h > 0 and m > 0: return f"{h}h {m}m"
    if h > 0: return f"{h}h"
    return f"{m}m"


def _sanitize_plan_dict(data: dict, goal: str) -> dict:
    """Coerce Gemini output into a shape that satisfies PlanResponse."""
    if not isinstance(data, dict):
        return {}

    # Ensure steps exists and is a list
    steps = data.get("steps")
    if not isinstance(steps, list) or len(steps) == 0:
        steps = [{
            "step_number": 1,
            "do": f"Research and scope: {goal}",
            "why": "Need to understand requirements before planning",
            "check": "You have a clear breakdown of what's needed",
            "resources": ["Google", "YouTube", "Online forums"]
        }]

    sanitized_steps = []
    for i, step in enumerate(steps, 1):
        if not isinstance(step, dict):
            step = {}
        
        sanitized_steps.append({
            "step_number": i,
            "do": step.get("do") or f"Step {i} task",
            "why": step.get("why") or "Important for progress",
            "check": step.get("check") or "Verify completion",
            "resources": [str(r) for r in step.get("resources", []) if r] or ["Online resources"]
        })

    data["steps"] = sanitized_steps

    # Ensure tips is a list of strings
    tips = data.get("tips")
    if isinstance(tips, list):
        tips = [str(t) for t in tips if t]
    if not tips:
        tips = ["Stay consistent", "Track progress", "Adjust as you learn"]
    data["tips"] = tips

    # Ensure required fields exist
    data["goal"] = data.get("goal") or goal

    return data

# =============================================================================
# MAIN API FUNCTIONS
# =============================================================================
def should_ask_more_questions(goal: str, qa_pairs: list) -> dict:
    """
    Decide if we need more questions or have enough to generate plan.
    Max 10 questions, but can stop early.
    """
    model = setup_gemini()
    qa_text = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in qa_pairs])
    
    current_count = len(qa_pairs)
    max_questions = 10
    
    prompt = f"""Goal: {goal}

Information gathered so far ({current_count} questions answered):
{qa_text}

Decide if you need MORE information or have ENOUGH to create an excellent plan.

Guidelines:
- Maximum {max_questions} questions total
- Only ask if the information is CRITICAL for the plan
- Stop early if you have enough context
- Consider: time, experience level, constraints, resources, context

Return JSON:
{{
  "action": "ask" or "ready",
  "question": "Your next specific question (if action=ask, else null)",
  "reasoning": "Brief why you need this info or why you're ready"
}}

Be efficient - quality over quantity."""

    data = call_gemini(model, prompt, max_tokens=400)
    
    if not data or not isinstance(data, dict):
        # Fallback: if unsure, generate plan
        return {
            "action": "ready",
            "question": None,
            "reasoning": "Fallback - proceeding with available information"
        }
    
    # Ensure we don't exceed max
    if current_count >= max_questions:
        return {
            "action": "ready",
            "question": None,
            "reasoning": f"Reached maximum of {max_questions} questions"
        }
    
    return data

def generate_plan(goal: str, qa_pairs: list) -> dict:
    """Generate actionable plan with flexible implementation approaches"""
    
    model = setup_gemini()
    qa_text = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in qa_pairs])
    
    prompt = f"""{goal}

{qa_text}

Create a realistic, actionable plan.

WHAT MAKES A STEP ACTIONABLE:

✅ GOOD (Specific + Flexible):
"Build a chat interface with text input and message display. Use Streamlit if Python-focused, React if you prefer web frameworks, or a simple HTML/JS setup for minimal dependencies."

❌ TOO VAGUE:
"Build a web interface"

❌ TOO PRESCRIPTIVE:
"Build interface using Streamlit" (ignores user's tech preferences)

✅ GOOD:
"Write 10 example Q&A conversations demonstrating Socratic tutoring (AI asks guiding questions, never gives direct answers)"

❌ TOO VAGUE:
"Refine the AI model"

✅ GOOD:
"Post in student communities (like r/APStudents, Discord study servers, or your school network) offering free tutoring to 5 beta testers"

❌ TOO VAGUE:
"Recruit beta users"

❌ TOO SPECIFIC:
"Post in r/APStudents" (user might not use Reddit)

RULES FOR ACTIONABLE STEPS:

1. Be SPECIFIC about the OUTCOME, FLEXIBLE about the METHOD
   - Describe clearly what needs to be accomplished
   - Provide 2-3 concrete approach options when multiple valid paths exist
   - Respect user's stated preferences from their answers above
   - Let them choose their preferred tools/methods

2. For TECHNICAL steps:
   - If user mentioned tech preferences → use those
   - If user is flexible → suggest 2-3 common options with brief context
   - If only one realistic approach → specify it clearly
   - Example: "Deploy using [their preferred platform] or free options like Vercel, Railway, or Render"

3. For NON-TECHNICAL steps:
   - Give concrete examples relevant to user's context
   - Example: "Find users through [communities relevant to their target audience]"

4. Each step = ONE clear action
   - Not "design and build" → split into two steps
   - Not "research and implement" → split into two steps

5. AVOID meta-work (planning to plan):
   - Not "Design a feedback system" → "Create a Google Form with 5 specific questions: helpfulness rating, clarity rating, would recommend, best feature, what to improve"
   - Not "Plan your marketing strategy" → "Write posts for 3 specific platforms explaining your product's value"

6. "check" field = MEASURABLE outcome
   - Focus on the RESULT achieved, not the method used
   - "You can type a message and receive an AI response" (not "Streamlit app is running")
   - "5 students have signed up and confirmed availability" (not "Posted in 3 subreddits")

Return ONLY valid JSON:
{{
  "goal": "achievable goal (adjusted if needed)",
  "original_goal": "user's original goal text (only if you changed it, else null)",
  "goal_changed_reason": "brief explanation why you adjusted it (only if changed, else null)",
  "steps": [
    {{
      "step_number": 1,
      "do": "Specific action with flexible approach options when relevant",
      "why": "Clear reason this step matters",
      "check": "Measurable completion criterion (outcome-focused)",
      "resources": ["Specific resource/tool option 1", "Alternative option 2", "General learning resource"]
    }}
  ],
  "tips": ["Practical actionable advice", "Common pitfall to avoid", "Strategic reminder"]
}}

Be concrete about WHAT to achieve. Provide options for HOW to achieve it. Someone should be able to start immediately after reading each step."""

    data = call_gemini(model, prompt, max_tokens=4096)
    
    if not data:
        print("[WARN] Gemini failed, using fallback")
        return {
            "goal": goal,
            "steps": [{
                "step_number": 1,
                "do": f"Research and break down what's needed for: {goal}",
                "why": "Need to understand requirements before taking action",
                "check": "You have a clear list of what needs to be built/learned/done",
                "resources": ["Google search", "YouTube tutorials", "Relevant online communities"]
            }],
            "tips": ["Start with small wins", "Track your progress", "Adjust approach based on what you learn"]
        }
    
    return _sanitize_plan_dict(data, goal)
