from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    RolesView,
    PacienteViewSet,
    VideoPacienteViewSet,
)

router = DefaultRouter()
router.register('pacientes', PacienteViewSet, basename='paciente')
router.register('videos', VideoPacienteViewSet, basename='video')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/roles/', RolesView.as_view(), name='roles'),
    path('', include(router.urls)),
]
