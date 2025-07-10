from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_core.runnables import RunnableLambda
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph
from typing import TypedDict, Optional
import json
from datetime import datetime
import time
from supabase_client import supabase
import asyncio
# -------------------------------
# TOOLS (Return dicts now)
# ------------------------------- 

async def get_subjectID(code):
    res = await asyncio.to_thread(
        lambda: supabase.table("subjects").select("subject_id").eq("subject_code", code).execute()
    )
    if res.data and len(res.data) > 0:
        return res.data[0]["subject_id"]
    raise ValueError(f"❌ Subject with code '{code}' not found.")

@tool
async def mark_attendance_tool(absentees: list, presentees: list, subject: str) -> dict:
    """Mark attendance by recording absentees and presentees for a subject."""
    current_date = datetime.now().strftime("%Y-%m-%d")
    subject_id = await get_subjectID(subject)
    rows = []

    for student_id in range(1, 101):
        status = "absent" if student_id in absentees else "present"
        rows.append({
            "subject_id": subject_id,
            "student_id": student_id,
            "status": status,
            "date": current_date
        })

    await asyncio.to_thread(lambda: supabase.table("attendance").insert(rows).execute())
    return {
        "type": "attendance",
        "data": {
            "subject": subject,
            "absentees": absentees,
            "presentees": presentees
        },
        "message": f"✅ Attendance marked for subject {subject}."
    }


@tool
async def set_class_schedule_tool(subject_code: str, date: str, time: str, block: str, room_no: str) -> dict:
    """Set class schedule for a subject on a specific date, time, block, and room."""
    subject_id = await get_subjectID(subject_code)
    new_row = {
        "subject_id": subject_id,
        "date": date,
        "time": time,
        "block": block,
        "room_no": room_no
    }
    await asyncio.to_thread(lambda: supabase.table("classes_schedule").insert(new_row).execute())
    return {
        "type": "class_schedule",
        "data": {
            "subject_code": subject_code,
            "block": block,
            "room_no": room_no,
            "date": date,
            "time": time
        },
        "message": f"📅 Class scheduled for {subject_code} at {time} on {date} in {block}-{room_no}"
    }

@tool
async def notice_updation_tool(topic: str, description: str) -> dict:
    """Publish a notice with topic and description."""
    new_row = {
        "topic": topic,
        "description": description,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M:%S"),
        "staff_id": 2
    }
    await asyncio.to_thread(lambda: supabase.table("notice").insert([new_row]).execute())
    return {
        "type": "notice",
        "data": {
            "topic": topic,
            "description": description
        },
        "message": f"📢 Notice: {topic} added successfully"
    }

@tool
async def result_updation_tool(subject_code: str, university_roll: int, mid_term_marks: int, end_term_marks: int) -> dict:
    """Update student result for a given subject."""
    subject_id = await get_subjectID(subject_code)
    new_row = {
        "user_id": university_roll,
        "subject_id": subject_id,
        "mid_term_score": mid_term_marks,
        "end_term_score": end_term_marks
    }
    await asyncio.to_thread(lambda: supabase.table("results").insert(new_row).execute())
    return {
        "type": "result",
        "data": {
            "subject_code": subject_code,
            "university_roll": university_roll,
            "mid_term_marks": mid_term_marks,
            "end_term_marks": end_term_marks
        },
        "message": f"📊 Result updated for {university_roll} in {subject_code}"
    }

# -------------------------------
# PROMPT
# -------------------------------

prompt = ChatPromptTemplate.from_messages([
    ("system", """
You are a college helpdesk assistant bot. Read the user's message and return JSON.

✅ To mark attendance:
{{ 
  "action": "mark_attendance", 
  "absentees": [5, 78, 90], 
  "presentees": [1, 2, 3, ..., excluding absentees], 
  "subject": "bcsc0089" 
}}

✅ To schedule a class:
{{ 
  "action": "set_class_schedule", 
  "subject_code": "bmas1011", 
  "date": "2025-08-12", 
  "time": "14:00:00", 
  "block": "AB1", 
  "room_no": "406" 
}}

✅ To post a notice:
{{ 
  "action": "notice_updation", 
  "topic": "Exam Notice", 
  "description": "All students must be ready for the Loda Lasan practical next week." 
}}

✅ To update results:
{{ 
  "action": "result_updation", 
  "subject_code": "bmas1010", 
  "university_roll": 23234, 
  "mid_term_marks": 55, 
  "end_term_marks": 44 
}}

⚠️ Always return valid JSON. If unsure, return: "invalid"
"""),
    ("user", "{input}")
])

# -------------------------------
# STATE
# -------------------------------

class StaffState(TypedDict):
    input: str
    parsed: Optional[dict]
    output: Optional[dict]

# -------------------------------
# LLM + PARSER
# -------------------------------

llm = ChatGroq(model="llama3-70b-8192", temperature=0)
chain = prompt | llm | (lambda x: json.loads(x.content))

async def extract_node(state: StaffState) -> StaffState:
    parsed = await chain.ainvoke({"input": state["input"]})

    if parsed.get("action") == "mark_attendance":
        all_students = set(range(1, 101))
        absentees = set(parsed["absentees"])
        parsed["presentees"] = sorted(list(all_students - absentees))

    if parsed.get("action") == "set_class_schedule":
        parsed["block"] = parsed["block"].upper()
        try:
            parsed["date"] = datetime.strptime(parsed["date"], "%Y-%m-%d").strftime("%Y-%m-%d")
            parsed["time"] = datetime.strptime(parsed["time"], "%H:%M:%S").strftime("%H:%M:%S")
        except Exception:
            return {"input": state["input"], "parsed": "invalid"}

    return {"input": state["input"], "parsed": parsed}

# -------------------------------
# ROUTER
# -------------------------------

async def tool_router(state: StaffState) -> StaffState:
    parsed = state["parsed"]

    if parsed.get("action") == "mark_attendance":
        res = await mark_attendance_tool.ainvoke(parsed)
    elif parsed.get("action") == "set_class_schedule":
        res = await set_class_schedule_tool.ainvoke(parsed)
    elif parsed.get("action") == "notice_updation":
        res = await notice_updation_tool.ainvoke(parsed)
    elif parsed.get("action") == "result_updation":
        res = await result_updation_tool.ainvoke(parsed)
    else:
        res = {"type": "error", "message": "❌ No matching tool found."}

    return {
        "input": state["input"],
        "parsed": parsed,
        "output": res
    }


# -------------------------------
# BUILD STAFF NODE
# -------------------------------

graph = StateGraph(StaffState)
graph.add_node("extract", RunnableLambda(extract_node))  # async
graph.add_node("route", RunnableLambda(tool_router))     # now async
graph.set_entry_point("extract")
graph.add_edge("extract", "route")
graph.set_finish_point("route")

staff_node = graph.compile()


# -------------------------------
# WRAPPER FOR MAIN GRAPH (GraphState adapter)
# -------------------------------

def get_staff_node():
    def adapt_input(state):
        return {"input": state["input"]}

    def adapt_output(staff_state, original_state):
        return {
            "input": staff_state["input"],
            "output": staff_state["output"],
            "token": original_state.get("token"),
            "auth": True,
            "user_id": original_state.get("user_id"),
            "role": "staff"
        }

    async def run(state):
        result = await staff_node.ainvoke(adapt_input(state))
        return adapt_output(result, state)

    return run
