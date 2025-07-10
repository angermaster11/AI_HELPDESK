from langchain_core.tools import tool
from langchain_groq.chat_models import ChatGroq
from typing import List, Dict
from api.student import *
from langchain_core.messages import SystemMessage, HumanMessage
from fastapi import APIRouter, HTTPException
import json
import logging
from graph.staff_helper import get_staff_node

#########################
system_message = """
You are COSMO — an AI assistant for staff at COSMO University.

You can use the tool `cosmo_command_tool` to perform internal staff actions like:

✅ Marking attendance  
✅ Scheduling classes  
✅ Posting notices  
✅ Updating results

🎯 Instructions:
- Analyze the user's message.
- If it's related to staff tasks, use the `cosmo_command_tool` and pass the full input as a string.
- Do NOT call any tool like `mark_attendance_tool` or `notice_updation_tool` directly — use `cosmo_command_tool` only.

Example:
If user says: “Post a notice saying class is cancelled”
Then call:
```json
{
  "input": "Post a notice saying class is cancelled"
}
"""

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import asyncio

@tool
async def cosmo_command_tool(input: str) -> dict:
    """Use this for staff-level queries like attendance or scheduling."""
    state = {"input": input}
    return await get_staff_node()(state)

STAFF_TOOLS = [cosmo_command_tool]

async def staff_node(input: dict) -> dict:
    try:
        # Safely extract inputs with defaults
        question = input.get("input", "")
        user_id = input.get("user_id", 0)
        token = input.get("token", "")
        file_content = input.get("fileContent", "")  # Changed variable name for clarity
        logger.info(input)
        # Combine text input with file content if present
        if file_content:
            logger.info("yes file mila hai ")
            question = f"{question} {file_content}"

        logger.info(f"Processing staff request for user {user_id}: {question[:100]}...")

        # Initialize LLM and bind tools
        llm = ChatGroq(model="llama3-70b-8192", temperature=0)
        llm_with_tools = llm.bind_tools(STAFF_TOOLS)

        # Step 1: Let LLM decide if any tool is needed
        messages = [
            SystemMessage(content=system_message),
            HumanMessage(content=question)
        ]

        ai_msg = await llm_with_tools.ainvoke(messages)
        tool_calls = ai_msg.additional_kwargs.get("tool_calls", [])
        logger.info(f"Tool calls: {len(tool_calls)}")

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

            # Ensure user_id is included
            kwargs["user_id"] = user_id
            kwargs["token"] = token  # Pass token to tools if needed
            if file_content:
                kwargs["fileContent"] = file_content

            logger.info(f"Calling tool {func_name} with args: {kwargs.keys()}")

            for tool in STAFF_TOOLS:
                if tool.name == func_name:
                    try:
                        result = await tool.ainvoke(kwargs)
                        results[func_name] = result
                        logger.info(f"Tool {func_name} completed successfully")
                    except Exception as e:
                        logger.error(f"Error calling tool {func_name}: {str(e)}")
                        results[func_name] = f"Error retrieving data: {str(e)}"
                    break

        # Step 3: Generate final response
        if len(results) == 1 and "error" in str(results).lower():
            return {"output": list(results.values())[0]}

        summary_prompt = [
            SystemMessage(content="Summarize this information professionally for staff and reply with simple words like yes updated, completed, sorry it's failed. Only small response."),
            HumanMessage(content=question),
            HumanMessage(content=f"Tool results: {json.dumps(results, indent=2)}")
        ]

        response = await llm.ainvoke(summary_prompt)
        return {"output": response.content}

    except Exception as e:
        logger.error(f"Error in staff_node: {str(e)}", exc_info=True)
        return {
            "output": f"Sorry, I encountered an error processing your request: {str(e)}"
        }