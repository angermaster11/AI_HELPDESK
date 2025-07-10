from fastapi import APIRouter, HTTPException, Query
from supabase_client import supabase
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
import asyncio

async def get_profile(user_id: int) -> dict:
    """
    Fetches user profile data from Supabase and returns it as a structured JSON response.
    
    Args:
        user_id: The ID of the user whose profile to fetch
        
    Returns:
        dict: Structured profile data in JSON format
    """
    try:
        # Fetch user data from Supabase
        response = await asyncio.to_thread(
            lambda: supabase.table("users")
                .select("name", "email", "phone", "semester", "year", "branch", "section", "username")
                .eq("user_id", user_id)
                .single()
                .execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        profile_data = response.data
        
        # Structure the response
        return {
            "status": "success",
            "data": {
                "personal_info": {
                    "name": profile_data.get("name"),
                    "email": profile_data.get("email"),
                    "phone": profile_data.get("phone"),
                    "username": profile_data.get("username")
                },
                "academic_info": {
                    "branch": profile_data.get("branch"),
                    "section": profile_data.get("section"),
                    "year": profile_data.get("year"),
                    "semester": profile_data.get("semester")
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching profile: {str(e)}"
        )

async def get_subject_ids():
    res = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select("subject_id, subject_name")
        .execute()
    )
    return res.data if res.data else []


async def get_attendance(user_id: int):
    subjects = await get_subject_ids()
    if not subjects:
        raise HTTPException(status_code=404, detail="No subjects found.")

    all_attendance = []

    for item in subjects:
        subject_id = item["subject_id"]
        subject_name = item.get("subject_name", "Unknown")

        result = await asyncio.to_thread(
            lambda: supabase.table("attendance")
            .select("*")
            .eq("student_id", user_id)
            .eq("subject_id", subject_id)
            .execute()
        )

        records = result.data
        if not records:
            continue

        total = len(records)
        present = sum(1 for r in records if r["status"].lower() == "present")
        percentage = (present / total) * 100 if total > 0 else 0

        all_attendance.append({
            "subject": subject_name,
            "present": present,
            "total": total,
            "absent": total - present,
            "percentage": f"{percentage:.2f}%"
        })

    if not all_attendance:
        raise HTTPException(status_code=404, detail="No attendance records found for this student.")

    return all_attendance


async def get_today_classes(user_id: int):
    # Get user details
    user = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select("branch, section, year")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    user_data = user.data

    today = datetime.today().strftime("%Y-%m-%d")

    # Get student subjects
    subject_result = await asyncio.to_thread(
        lambda: supabase.table("staff_subjects")
        .select("subject_id")
        .execute()
    )
    subject_ids = [s["subject_id"] for s in subject_result.data]

    # Get today's classes
    classes_result = await asyncio.to_thread(
        lambda: supabase.table("classes_schedule")
        .select("*")
        .eq("date", today)
        .execute()
    )
    classes = [c for c in classes_result.data if c["subject_id"] in subject_ids]

    # Add subject names
    for c in classes:
        sub = await asyncio.to_thread(
            lambda: supabase.table("subjects")
            .select("subject_name")
            .eq("subject_id", c["subject_id"])
            .single()
            .execute()
        )
        c["subject_name"] = sub.data["subject_name"]

    return classes


async def get_notices():
    data = await asyncio.to_thread(
        lambda: supabase.table("notice").select("*").order("date", desc=True).execute()
    )
    return data.data


async def get_results(user_id: int):
    # Fetch results
    result_response = await asyncio.to_thread(
        lambda: supabase.table("results")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    results = result_response.data

    if not results:
        raise HTTPException(status_code=404, detail="No results found.")

    # Enrich with subject names
    final = []
    for r in results:
        sub_response = await asyncio.to_thread(
            lambda: supabase.table("subjects")
            .select("subject_name")
            .eq("subject_id", r["subject_id"])
            .single()
            .execute()
        )

        final.append({
            "subject": sub_response.data["subject_name"],
            "mid_term": r["mid_term_score"],
            "end_term": r["end_term_score"],
            "total": r["mid_term_score"] + r["end_term_score"]
        })

    # Sort by subject name (optional)
    final.sort(key=lambda x: x["subject"])

    return final