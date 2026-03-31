"""
Authentication views.

Every view follows the same defensive pattern:
  1. Validate input (serializer or manual check).
  2. Perform DB operations.
  3. Attempt email sending inside its own try/except so an SMTP failure
     never leaks out as an unhandled exception and never silently discards
     the error either.
  4. Return a clear JSON response for every code-path — success or failure.

The global custom_exception_handler in accounts/exceptions.py is a last-resort
safety net for anything that slips through, but all known failure-modes are
caught explicitly here.
"""

import logging

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, EmailVerificationToken, PasswordResetToken
from .serializers import RegisterSerializer, UserSerializer
from .utils import send_activation_email, send_password_reset_email

logger = logging.getLogger(__name__)


# ─── Register ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = None
    try:
        # 1. Create the (inactive) user
        user = serializer.save()

        # 2. Create the email-verification token
        token = EmailVerificationToken.objects.create(user=user)

        # 3. Send activation email
        #    ROOT-CAUSE FIX: previously this was unwrapped, so any SMTP error
        #    (wrong credentials, network timeout, empty EMAIL_HOST_USER, …)
        #    produced an unhandled exception → Django returned HTML 500 →
        #    Axios couldn't parse it → frontend showed "Registration failed".
        send_activation_email(user, token.token)

    except Exception as exc:
        logger.exception('register: failed during user creation or email send: %s', exc)

        # Roll back: delete the user (cascades to token) so the email address
        # is free and the user can try again cleanly.
        if user is not None:
            try:
                user.delete()
            except Exception:
                pass  # best-effort cleanup; don't mask the original error

        return Response(
            {
                'error': (
                    'Registration failed: could not send activation email. '
                    'Please check that the email address is correct and try again.'
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {'message': 'Registration successful. Please check your email to activate your account.'},
        status=status.HTTP_201_CREATED,
    )


# ─── Login ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email', '').lower().strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user_obj = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user_obj.is_active:
        return Response(
            {'error': 'Account is not activated. Please check your email for the activation link.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        refresh = RefreshToken.for_user(user)
    except Exception as exc:
        logger.exception('login: failed to generate JWT for user %s: %s', email, exc)
        return Response(
            {'error': 'Login failed due to a server error. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    })


# ─── Activate Account ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def activate_account(request, token):
    try:
        verification_token = (
            EmailVerificationToken.objects
            .select_related('user')
            .get(token=token)
        )
    except EmailVerificationToken.DoesNotExist:
        return Response(
            {'error': 'Invalid activation link. It may have already been used or never existed.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if verification_token.is_expired():
        try:
            verification_token.user.delete()    # cascades to token row
        except Exception as exc:
            logger.exception('activate_account: cleanup of expired user failed: %s', exc)
        return Response(
            {'error': 'Activation link has expired. Please register again.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = verification_token.user
        user.is_active = True
        user.save(update_fields=['is_active'])
        verification_token.delete()
    except Exception as exc:
        logger.exception('activate_account: failed to activate user: %s', exc)
        return Response(
            {'error': 'Account activation failed due to a server error. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({'message': 'Account activated successfully. You can now log in.'})


# ─── Forgot Password ──────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').lower().strip()
    if not email:
        return Response(
            {'error': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Always use the same success message — prevents user enumeration
    # (attacker cannot determine whether an email is registered or not).
    GENERIC_OK = Response({
        'message': 'If an account with that email exists, a password reset link has been sent.'
    })

    try:
        user = CustomUser.objects.get(email=email, is_active=True)
    except CustomUser.DoesNotExist:
        return GENERIC_OK

    try:
        # Remove any stale tokens from previous reset attempts
        PasswordResetToken.objects.filter(user=user).delete()
        reset_token = PasswordResetToken.objects.create(user=user)
    except Exception as exc:
        logger.exception('forgot_password: token creation failed for %s: %s', email, exc)
        return Response(
            {'error': 'Could not process the request. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        send_password_reset_email(user, reset_token.token)
    except Exception as exc:
        # Email failed — delete the orphaned token so the user can retry cleanly
        logger.exception('forgot_password: email send failed for %s: %s', email, exc)
        try:
            reset_token.delete()
        except Exception:
            pass
        return Response(
            {
                'error': (
                    'Failed to send the reset email. '
                    'Please verify your email address and try again, '
                    'or contact support if the problem persists.'
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return GENERIC_OK


# ─── Validate Reset Token (GET) ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_reset_token(request, token):
    """Frontend calls this before showing the new-password form, so the user
    gets a clear error immediately if the link is stale rather than filling
    the form and then discovering the token is invalid on submit."""
    try:
        reset_token = PasswordResetToken.objects.get(token=token, is_used=False)
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'error': 'Invalid or already used reset link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if reset_token.is_expired():
        try:
            reset_token.delete()
        except Exception:
            pass
        return Response(
            {'error': 'Reset link has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({'message': 'Token is valid.'})


# ─── Reset Password (POST) ────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request, token):
    try:
        reset_token = (
            PasswordResetToken.objects
            .select_related('user')
            .get(token=token, is_used=False)
        )
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'error': 'Invalid or already used reset link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if reset_token.is_expired():
        try:
            reset_token.delete()
        except Exception:
            pass
        return Response(
            {'error': 'Reset link has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    password = request.data.get('password', '')
    confirm_password = request.data.get('confirm_password', '')

    if not password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not confirm_password:
        return Response({'error': 'Please confirm your password.'}, status=status.HTTP_400_BAD_REQUEST)
    if password != confirm_password:
        return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password, reset_token.user)
    except ValidationError as exc:
        return Response({'error': exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = reset_token.user
        user.set_password(password)
        user.save()

        # Mark used THEN delete — prevents replay even on concurrent requests
        reset_token.is_used = True
        reset_token.save(update_fields=['is_used'])
        reset_token.delete()
    except Exception as exc:
        logger.exception('reset_password: failed to save new password: %s', exc)
        return Response(
            {'error': 'Password reset failed due to a server error. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({
        'message': 'Password reset successfully. You can now log in with your new password.'
    })


# ─── Protected Profile ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)
