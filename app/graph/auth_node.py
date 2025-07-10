import jwt
from typing import Dict, Any
import os

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret")

async def auth_node(input: Dict[str, Any]) -> Dict[str, Any]:
    token = input.get("token")
    state = input.copy()

    if not token:
        state["auth"] = False
        return state
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        state.update({
            "auth": True,
            "user_id": payload["user_id"],
            "role": payload["role"]
        })
    except jwt.PyJWTError:
        state["auth"] = False

    return state

