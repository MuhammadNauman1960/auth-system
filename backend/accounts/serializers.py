from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import CustomUser, EmailVerificationToken


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['name', 'email', 'password', 'confirm_password']

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be blank.")
        return value.strip()

    def validate_email(self, value):
        value = value.lower()
        try:
            existing = CustomUser.objects.get(email=value)
        except CustomUser.DoesNotExist:
            return value

        if existing.is_active:
            raise serializers.ValidationError("An account with this email already exists.")

        # Inactive account — check token expiry
        try:
            token = existing.verification_token
            if token.is_expired():
                # Expired: remove old record so the user can register fresh
                existing.delete()
                return value
            else:
                raise serializers.ValidationError(
                    "This email is pending activation. Please check your inbox."
                )
        except EmailVerificationToken.DoesNotExist:
            # No token exists for this inactive user — clean up and allow re-registration
            existing.delete()
            return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            is_active=False,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email']
