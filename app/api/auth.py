from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import supabase
import jwt
import os
from datetime import datetime, timedelta
from typing import Any
import asyncio

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret")

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/auth/login")
async def login(request: LoginRequest):
    try:
        # Run blocking auth login in a thread
        auth_response = await asyncio.to_thread(
            supabase.auth.sign_in_with_password,
            {"email": request.email, "password": request.password}
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid credentials or Supabase error: {str(e)}")

    # Run the DB query in a thread since it's blocking
    user_result = await asyncio.to_thread(
        lambda: supabase.table("users").select("*").eq("email", request.email).execute()
    )

    if not user_result.data or len(user_result.data) == 0:
        raise HTTPException(status_code=404, detail="User not found in users table")

    user = user_result.data[0]

    # Create JWT token in a thread (optional)
    token = await asyncio.to_thread(jwt.encode, {
        "user_id": user["user_id"],
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }, SECRET_KEY, algorithm="HS256")

    return {
        "token": token,
        "user": {
            "id": user["user_id"],
            "name": user["name"],
            "role": user["role"],
            "email": user["email"]
        }
    }
