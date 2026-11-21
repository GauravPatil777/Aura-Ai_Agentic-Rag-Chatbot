import os
import uuid

from datetime import datetime, timedelta

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from starlette.concurrency import run_in_threadpool

from auth.google import oauth
from database import pool

router = APIRouter(prefix="/auth", tags=["Authentication"])

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

GUEST_SESSION_DAYS = 7


# ----------------------------------
# Find or Create Google User
# ----------------------------------

def get_or_create_user(
    google_id,
    email,
    name,
    picture
):

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
                """
                SELECT id
                FROM users
                WHERE email = %s
                """,
                (email,)
            )

            existing_email = cursor.fetchone()

            if existing_email:
                raise ValueError(
                    "This email is already associated with another account."
                )

            cursor.execute(
                """
                INSERT INTO users (
                    google_id,
                    email,
                    name,
                    profile_picture
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id, google_id, email, name, profile_picture
                """,
                (google_id, email, name, picture)
            )

            user = cursor.fetchone()

        conn.commit()

    return user


# ----------------------------------
# Create Guest Session
# ----------------------------------

def create_guest_session():

    guest_id = uuid.uuid4()

    expires_at = datetime.now() + timedelta(
        days=GUEST_SESSION_DAYS
    )

    with pool.connection() as conn:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO guest_sessions (
                    id,
                    expires_at
                )
                VALUES (%s, %s)
                RETURNING id
                """,
                (guest_id, expires_at)
            )

            guest = cursor.fetchone()

        conn.commit()

    return str(guest[0])


# ----------------------------------
# Validate Guest Session
# ----------------------------------

def get_valid_guest(guest_session_id):

    with pool.connection() as conn:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT id
                FROM guest_sessions
                WHERE id = %s
                AND expires_at > CURRENT_TIMESTAMP
                """,
                (guest_session_id,)
            )

            guest = cursor.fetchone()

    return guest


# ----------------------------------
# Google Login
# ----------------------------------

@router.get("/google")
async def google_login(request: Request):

    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri
    )


# ----------------------------------
# Google Callback
# ----------------------------------

@router.get("/google/callback")
async def google_callback(request: Request):

    try:

        token = await oauth.google.authorize_access_token(
            request
        )

        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(
                status_code=401,
                detail="Google authentication failed"
            )

        google_id = user_info["sub"]

        email = user_info["email"]

        if user_info.get("email_verified") is not True:
            raise HTTPException(
                status_code=403,
                detail="Google email is not verified"
            )

        name = user_info.get("name")

        picture = user_info.get("picture")

        user = await run_in_threadpool(
            get_or_create_user,
            google_id,
            email,
            name,
            picture
        )

        request.session.clear()

        request.session["user_id"] = str(user[0])

        request.session["auth_type"] = "google"

        return RedirectResponse(
            url=FRONTEND_URL,
            status_code=303
        )

    except ValueError as e:

        raise HTTPException(
            status_code=409,
            detail=str(e)
        )


# ----------------------------------
# Guest Login
# ----------------------------------

@router.post("/guest")
async def guest_login(request: Request):

    # If an active guest session already exists,
    # reuse it rather than creating another one.

    guest_session_id = request.session.get(
        "guest_session_id"
    )

    if guest_session_id:

        guest = await run_in_threadpool(
            get_valid_guest,
            guest_session_id
        )

        if guest:

            return {
                "id": str(guest[0]),
                "name": "Guest User",
                "email": None,
                "picture": None,
                "auth_type": "guest"
            }

    # Create a new guest session

    guest_session_id = await run_in_threadpool(
        create_guest_session
    )

    request.session.clear()

    request.session["guest_session_id"] = guest_session_id

    request.session["auth_type"] = "guest"

    return {
        "id": guest_session_id,
        "name": "Guest User",
        "email": None,
        "picture": None,
        "auth_type": "guest"
    }


# ----------------------------------
# Get Current User / Guest
# ----------------------------------

@router.get("/me")
async def get_current_user(request: Request):

    auth_type = request.session.get("auth_type")

    # Google user

    if auth_type == "google":

        user_id = request.session.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Not authenticated"
            )

        def fetch_user():

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

        user = await run_in_threadpool(fetch_user)

        if not user:

            request.session.clear()

            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return {
            "id": str(user[0]),
            "name": user[1],
            "email": user[2],
            "picture": user[3],
            "auth_type": "google"
        }

    # Guest user

    if auth_type == "guest":

        guest_session_id = request.session.get(
            "guest_session_id"
        )

        if not guest_session_id:
            request.session.clear()

            raise HTTPException(
                status_code=401,
                detail="Guest session not found"
            )

        guest = await run_in_threadpool(
            get_valid_guest,
            guest_session_id
        )

        if not guest:

            request.session.clear()

            raise HTTPException(
                status_code=401,
                detail="Guest session expired"
            )

        return {
            "id": str(guest[0]),
            "name": "Guest User",
            "email": None,
            "picture": None,
            "auth_type": "guest"
        }

    raise HTTPException(
        status_code=401,
        detail="Not authenticated"
    )


# ----------------------------------
# Logout
# ----------------------------------

@router.post("/logout")
def logout(request: Request):

    request.session.clear()

    return {
        "message": "Logged out successfully"
    }