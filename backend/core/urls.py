from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    RolesView,
    MeView,
    UserAdminViewSet,
    HospitalViewSet,
    EspecialidadViewSet,
    ProyectoViewSet,
    PacienteViewSet,
    VideoPacienteViewSet,
    BackupView,
)

router = DefaultRouter()
router.register('auth/users', UserAdminViewSet, basename='adminuser')
router.register('hospitales', HospitalViewSet, basename='hospital')
router.register('especialidades', EspecialidadViewSet, basename='especialidad')
router.register('proyectos', ProyectoViewSet, basename='proyecto')
router.register('pacientes', PacienteViewSet, basename='paciente')
router.register('videos', VideoPacienteViewSet, basename='video')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/roles/', RolesView.as_view(), name='roles'),
    path('backup/', BackupView.as_view(), name='backup'),
    path('', include(router.urls)),
]
