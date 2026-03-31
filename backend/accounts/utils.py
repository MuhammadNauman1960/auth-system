from django.conf import settings
from django.core.mail import send_mail


def send_activation_email(user, token):
    """Send account activation link to a newly registered (inactive) user."""
    activation_url = f"{settings.FRONTEND_URL}/activate/{token}"
    subject = "Activate Your Account"
    body = (
        f"Hi {user.name},\n\n"
        f"Thanks for registering! Please activate your account by clicking the link below:\n\n"
        f"  {activation_url}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you did not create this account, please ignore this email.\n\n"
        f"Best regards,\nThe Auth App Team"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def send_password_reset_email(user, token):
    """Send a password-reset link to an existing active user."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"
    subject = "Reset Your Password"
    body = (
        f"Hi {user.name},\n\n"
        f"We received a request to reset the password for your account.\n\n"
        f"Click the link below to set a new password:\n\n"
        f"  {reset_url}\n\n"
        f"This link will expire in 1 hour.\n\n"
        f"If you did not request a password reset, you can safely ignore this email — "
        f"your password will not be changed.\n\n"
        f"Best regards,\nThe Auth App Team"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
