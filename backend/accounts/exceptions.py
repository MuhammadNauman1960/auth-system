"""
Global DRF exception handler.

WHY THIS EXISTS
───────────────
DRF's built-in exception_handler only catches DRF-specific exceptions
(APIException subclasses).  Any other exception — e.g. SMTPAuthenticationError,
DatabaseError, AttributeError — bubbles up to Django, which returns:
  • DEBUG=True  → an HTML traceback page
  • DEBUG=False → a plain "Server Error (500)" HTML page

Both are impossible for the frontend (Axios) to parse as JSON, so the user
sees "Registration failed" / "Login failed" with no helpful message.

This handler intercepts ALL unhandled exceptions, logs the full traceback for
debugging, and returns a consistent JSON response that the frontend can display.
"""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    1. Let DRF handle its own exceptions first (ValidationError, AuthError, etc.)
    2. For anything DRF doesn't handle, log the full traceback and return a
       clean JSON 500 so the frontend always gets a parseable response.
    """
    # Step 1: try DRF's default handler
    response = exception_handler(exc, context)

    if response is not None:
        # DRF handled it — optionally normalise the shape here if needed
        return response

    # Step 2: DRF didn't handle it → log and return JSON 500
    view = context.get('view', None)
    view_name = view.__class__.__name__ if view else 'unknown view'

    logger.exception(
        'Unhandled exception in %s: %s',
        view_name,
        exc,
        exc_info=exc,
    )

    return Response(
        {'error': 'An unexpected server error occurred. Please try again later.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
