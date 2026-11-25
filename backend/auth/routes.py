import os
import uuid

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from starlette.concurrency import run_in_threadpool

from auth.google import oauth
from database import pool


router = APIRouter(prefix="/auth", tags=["Authentication"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# Google User Database Operations

def get_or_create_user(google_id, email, name, picture):

    with pool.connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT id, google_id, email, name, profile_picture
                FROM users
                WHERE google_id = %s
                """,
                (google_id,)
            )

            user = cursor.fetchone()

            if user:
                return user

            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (email,)
            )

            if cursor.fetchone():
                raise ValueError(
                    "This email is already associated with another account."
                )

            cursor.execute(
                """
                INSERT INTO users (
                    google_id, email, name, profile_picture
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id, google_id, email, name, profile_picture
                """,
                (google_id, email, name, picture)
            )

            user = cursor.fetchone()

        conn.commit()

    return user


def get_user_by_id(user_id):

    with pool.connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT id, name, email, profile_picture
                FROM users
                WHERE id = %s
                """,
                (user_id,)
            )

            return cursor.fetchone()


# Google Login

@router.get("/google")
async def google_login(request: Request):

    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri
    )


# Google Callback

@router.get("/google/callback")
async def google_callback(request: Request):

    try:

        token = await oauth.google.authorize_access_token(request)

        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(
                status_code=401,
                detail="Google authentication failed"
            )

        if user_info.get("email_verified") is not True:
            raise HTTPException(
                status_code=403,
                detail="Google email is not verified"
            )

        user = await run_in_threadpool(
            get_or_create_user,
            user_info["sub"],
            user_info["email"],
            user_info.get("name"),
            user_info.get("picture")
        )

        request.session.clear()

        request.session["user_id"] = str(user[0])
        request.session["auth_type"] = "google"

        return RedirectResponse(
            url=FRONTEND_URL,
            status_code=303
        )

    except ValueError as error:

        raise HTTPException(
            status_code=409,
            detail=str(error)
        )


# Guest Login

@router.post("/guest")
async def guest_login(request: Request):

    guest_id = str(uuid.uuid4())

    request.session.clear()

    request.session["guest_session_id"] = guest_id
    request.session["auth_type"] = "guest"

    return {
        "id": guest_id,
        "name": "Guest User",
        "email": None,
        "picture": None,
        "auth_type": "guest"
    }


# Current User

@router.get("/me")
async def get_current_user(request: Request):

    auth_type = request.session.get("auth_type")

    if auth_type == "google":

        user_id = request.session.get("user_id")

        if not user_id:
            request.session.clear()
            raise HTTPException(401, "Not authenticated")

        user = await run_in_threadpool(
            get_user_by_id,
            user_id
        )

        if not user:
            request.session.clear()
            raise HTTPException(401, "User not found")

        return {
            "id": str(user[0]),
            "name": user[1],
            "email": user[2],
            "picture": user[3],
            "auth_type": "google"
        }

    if auth_type == "guest":

        guest_id = request.session.get("guest_session_id")

        if not guest_id:
            request.session.clear()
            raise HTTPException(401, "Guest session not found")

        return {
            "id": guest_id,
            "name": "Guest User",
            "email": None,
            "picture": None,
            "auth_type": "guest"
        }

    raise HTTPException(401, "Not authenticated")


# Logout

@router.post("/logout")
def logout(request: Request):

    request.session.clear()

    return {"message": "Logged out successfully"}