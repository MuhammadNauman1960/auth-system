from django.urls import path

from . import views

urlpatterns = [
    # Auth
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),

    # Email activation
    path('activate/<uuid:token>/', views.activate_account, name='activate'),

    # Password reset flow
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/<uuid:token>/', views.reset_password, name='reset-password'),
    path('validate-reset-token/<uuid:token>/', views.validate_reset_token, name='validate-reset-token'),

    # Protected
    path('profile/', views.profile, name='profile'),
]
