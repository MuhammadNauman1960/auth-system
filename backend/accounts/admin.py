from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, EmailVerificationToken, PasswordResetToken


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'name', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'name']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'username')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'is_active'),
        }),
    )


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at']
    readonly_fields = ['token', 'created_at']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at', 'is_used']
    readonly_fields = ['token', 'created_at']
    list_filter = ['is_used']
