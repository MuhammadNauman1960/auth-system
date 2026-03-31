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


# ─── Register ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    token = EmailVerificationToken.objects.create(user=user)
    send_activation_email(user, token.token)

    return Response(
        {"message": "Registration successful. Please check your email to activate your account."},
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
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user_obj = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user_obj.is_active:
        return Response(
            {"error": "Account is not activated. Please check your email for the activation link."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    })


# ─── Activate Account ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def activate_account(request, token):
    try:
        verification_token = EmailVerificationToken.objects.select_related('user').get(token=token)
    except EmailVerificationToken.DoesNotExist:
        return Response(
            {"error": "Invalid activation link. It may have already been used or never existed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if verification_token.is_expired():
        verification_token.user.delete()   # cascades to token
        return Response(
            {"error": "Activation link has expired. Please register again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = verification_token.user
    user.is_active = True
    user.save(update_fields=['is_active'])
    verification_token.delete()

    return Response({"message": "Account activated successfully. You can now log in."})


# ─── Forgot Password ──────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').lower().strip()
    if not email:
        return Response(
            {"error": "Email is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Always respond with the same message to prevent user enumeration
    generic_response = Response({
        "message": "If an account with that email exists, a password reset link has been sent."
    })

    try:
        user = CustomUser.objects.get(email=email, is_active=True)
    except CustomUser.DoesNotExist:
        return generic_response

    # Remove any previous (possibly stale) reset tokens for this user
    PasswordResetToken.objects.filter(user=user).delete()

    reset_token = PasswordResetToken.objects.create(user=user)
    try:
        send_password_reset_email(user, reset_token.token)
    except Exception:
        # If email sending fails, remove the orphaned token and surface an error
        reset_token.delete()
        return Response(
            {"error": "Failed to send reset email. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return generic_response


# ─── Validate Reset Token (GET) ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_reset_token(request, token):
    """Used by the frontend to check whether a reset link is still valid before
    showing the new-password form."""
    try:
        reset_token = PasswordResetToken.objects.get(token=token, is_used=False)
    except PasswordResetToken.DoesNotExist:
        return Response(
            {"error": "Invalid or already used reset link."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if reset_token.is_expired():
        reset_token.delete()
        return Response(
            {"error": "Reset link has expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": "Token is valid."})


# ─── Reset Password (POST) ────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request, token):
    try:
        reset_token = PasswordResetToken.objects.select_related('user').get(
            token=token, is_used=False
        )
    except PasswordResetToken.DoesNotExist:
        return Response(
            {"error": "Invalid or already used reset link."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if reset_token.is_expired():
        reset_token.delete()
        return Response(
            {"error": "Reset link has expired. Please request a new one."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    password = request.data.get('password', '')
    confirm_password = request.data.get('confirm_password', '')

    # Basic field validation
    if not password:
        return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not confirm_password:
        return Response({"error": "Please confirm your password."}, status=status.HTTP_400_BAD_REQUEST)
    if password != confirm_password:
        return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

    # Django's full password validator suite
    try:
        validate_password(password, reset_token.user)
    except ValidationError as exc:
        return Response({"error": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

    user = reset_token.user
    user.set_password(password)
    user.save()

    # Mark used then delete — prevents replay attacks
    reset_token.is_used = True
    reset_token.save(update_fields=['is_used'])
    reset_token.delete()

    return Response({"message": "Password reset successfully. You can now log in with your new password."})


# ─── Protected Profile ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)
