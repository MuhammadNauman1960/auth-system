import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    """Extended user model using email as the login identifier."""

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True, default='')

    USERNAME_FIELD = 'email'
    # 'name' is prompted by createsuperuser; 'username' is auto-set in save()
    REQUIRED_FIELDS = ['name']

    def save(self, *args, **kwargs):
        # Keep username in sync with email so Django internals stay happy
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class EmailVerificationToken(models.Model):
    """One-time token sent by email to verify a newly registered account."""

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='verification_token'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(hours=24)

    def __str__(self):
        return f"Verification token for {self.user.email}"


class PasswordResetToken(models.Model):
    """Short-lived token sent by email to allow a password reset.
    Expires after 1 hour; deleted after successful use.
    """

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='reset_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(hours=1)

    def __str__(self):
        return f"Reset token for {self.user.email}"
