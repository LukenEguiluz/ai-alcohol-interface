from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User, Group

from .models import Paciente, VideoPaciente
from .serializers import (
    UserSerializer,
    PacienteSerializer,
    PacienteCreateUpdateSerializer,
    VideoPacienteSerializer,
    VideoPacienteUploadSerializer,
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


ROLES_VALIDOS = ['Administrador', 'Doctor', 'Residente', 'Psicologo', 'Otro']


class RolesView(APIView):
    """Lista de roles disponibles (para formulario de crear usuario)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'roles': ROLES_VALIDOS})


def es_administrador(user):
    return user.is_superuser or user.groups.filter(name='Administrador').exists()


class RegisterView(APIView):
    """Solo administradores pueden crear nuevas cuentas con un rol."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        role = request.data.get('role', 'Otro')
        if not username or not password:
            return Response(
                {'error': 'username y password son obligatorios'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if role not in ROLES_VALIDOS:
            return Response(
                {'error': f'role debe ser uno de: {", ".join(ROLES_VALIDOS)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Ese nombre de usuario ya existe'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.create_user(username=username, password=password, email=email)
        if role == 'Administrador':
            user.is_staff = True
            user.save()
        group = Group.objects.get(name=role)
        user.groups.add(group)
        return Response(
            {'user': UserSerializer(user).data, 'message': 'Usuario creado'},
            status=status.HTTP_201_CREATED,
        )


class PacienteViewSet(viewsets.ModelViewSet):
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Paciente.objects.filter(creado_por=self.request.user)

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return PacienteCreateUpdateSerializer
        return PacienteSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            PacienteSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        if not es_administrador(request.user):
            return Response(
                {'error': 'Solo los administradores pueden eliminar pacientes.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class VideoPacienteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VideoPaciente.objects.filter(paciente__creado_por=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return VideoPacienteUploadSerializer
        return VideoPacienteSerializer

    def create(self, request, *args, **kwargs):
        serializer = VideoPacienteUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paciente_id = serializer.validated_data['paciente'].id
        if not Paciente.objects.filter(id=paciente_id, creado_por=request.user).exists():
            return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        video = serializer.save()
        return Response(
            VideoPacienteSerializer(video).data,
            status=status.HTTP_201_CREATED,
        )
