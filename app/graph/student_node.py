from langchain_core.tools import tool
from langchain_groq.chat_models import ChatGroq
from typing import List, Dict
from api.student import *
from langchain_core.messages import SystemMessage, HumanMessage
from fastapi import APIRouter, HTTPException
import json
import logging

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define tools using @tool decorator
@tool
async def get_today_classes_tool(user_id: int) -> List[Dict]:
    """Get today's classes for the student."""
    return await get_today_classes(user_id)

@tool
async def get_attendance_tool(user_id: int, subject: str = None) -> List[Dict]:
    """Get attendance records. Optionally filter by subject."""
    attendance = await get_attendance(user_id)
    if subject:
        return [a for a in attendance if subject.lower() in a["subject"].lower()]
    return attendance

@tool
async def get_results_tool(user_id: int, subject: str = None) -> List[Dict]:
    """Get exam results or marks in subject. Optionally filter by subject."""
    results = await get_results(user_id)
    if subject:
        return [r for r in results if subject.lower() in r["subject"].lower()]
    return results

@tool
async def get_notices_tool() -> List[Dict]:
    """Get all notices."""
    return await get_notices()

@tool
async def get_profile_tool(user_id: int) -> Dict:
    """Get student profile information."""
    return await get_profile(user_id)

# List of available tools
STUDENT_TOOLS = [
    get_today_classes_tool,
    get_attendance_tool,
    get_results_tool,
    get_notices_tool,
    get_profile_tool
]

async def student_node(input: dict) -> dict:
    try:
        question = input["input"]
        user_id = input["user_id"]
        token = input["token"]

        logger.info(f"Processing request for user {user_id}: {question}")

        # Initialize LLM and bind tools
        llm = ChatGroq(model="llama3-70b-8192", temperature=0)
        llm_with_tools = llm.bind_tools(STUDENT_TOOLS)

        # Step 1: Let LLM decide if any tool is needed
        messages = [
    SystemMessage(content="""
You are COSMO, an intelligent assistant for COSMO University's helpdesk system. 
Your main job is to **use tools whenever available** to fetch accurate and real-time information like:
- Attendance
- Results
- Profile details
- Today's class schedule
- Notices
You are smart intelligent super robotic ai analayze the question and respond accordingly .
If you get more data from tools anaylaze it according to question respond short and simple. 

**Important rules:**
- Prefer using tools rather than guessing.
- If the question can be answered using any available tool, you must use it.
- Respond in a friendly, student-assistant tone.
- If the user greets you (hi, hello), respond casually without tools.
- If the user asks something you cannot answer, politely guide them.

"""),
    HumanMessage(content=question)
]


        # ✅ Await required here
        ai_msg = await llm_with_tools.ainvoke(messages)

        tool_calls = ai_msg.additional_kwargs.get("tool_calls", [])
        logger.info(f"Tool calls: {tool_calls}")

        if not tool_calls:
            logger.info("No tools called, returning direct response")
            return {
                "output": ai_msg.content if ai_msg.content else "I couldn't generate a response. Please try again."
            }

        # Step 2: Call the required tools
        results = {}
        for tool_call in tool_calls:
            func_name = tool_call["function"]["name"]
            kwargs = json.loads(tool_call["function"]["arguments"])

            # Always attach user_id
            kwargs["user_id"] = user_id

            logger.info(f"Calling tool {func_name} with args: {kwargs}")

            for tool in STUDENT_TOOLS:
                if tool.name == func_name:
                    try:
                        result = await tool.ainvoke(kwargs)  # ✅ Await here
                        results[func_name] = result
                        logger.info(f"Tool {func_name} returned: {result}")
                    except Exception as e:
                        logger.error(f"Error calling tool {func_name}: {str(e)}")
                        results[func_name] = f"Error retrieving data: {str(e)}"
                    break

        # Step 3: Summarize the tool results using LLM
        summary_prompt = [
            SystemMessage(content="You are a helpful student assistant. Summarize this information in a friendly, conversational way."),
            HumanMessage(content=question),
            HumanMessage(content=f"Here's the data I found: {json.dumps(results)}")
        ]

        response = await llm.ainvoke(summary_prompt)  # ✅ Await here

        logger.info(f"Final response: {response.content}")

        return {
            "output": response.content if response.content else "Here's the information I found: " + str(results)
        }

    except Exception as e:
        logger.error(f"Error in student_node: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )
