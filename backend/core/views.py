import json
import os
import subprocess
import tempfile
import zipfile
import shutil
from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import User, Group
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .access import es_administrador, es_admin_proyectos_globales, ids_proyectos_usuario
from .models import Hospital, Especialidad, Proyecto, Paciente, VideoPaciente
from .serializers import (
    UserSerializer,
    HospitalSerializer,
    EspecialidadSerializer,
    ProyectoSerializer,
    ProyectoCreateSerializer,
    ProyectoUpdateSerializer,
    PacienteSerializer,
    PacienteCreateUpdateSerializer,
    VideoPacienteSerializer,
    VideoPacienteUploadSerializer,
)


class CompactPagination(PageNumberPagination):
    page_size = 40
    page_size_query_param = 'page_size'
    max_page_size = 200


class IsAdminProyectosGlobales(BasePermission):
    """Crear/editar/borrar proyectos y catálogo hospital/especialidad (superuser o Administrador de proyectos)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and es_admin_proyectos_globales(request),
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        request = self.context.get('request')
        user = User.objects.prefetch_related(
            'groups',
            'proyectos_asignados__hospital',
            'proyectos_asignados__especialidad',
        ).get(pk=self.user.pk)
        data['user'] = UserSerializer(user, context={'request': request}).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


ROLES_VALIDOS = [
    'Administrador',
    'Administrador de proyectos',
    'Doctor',
    'Residente',
    'Psicologo',
    'Otro',
]


class RolesView(APIView):
    """Lista de roles disponibles (para formulario de crear usuario)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'roles': ROLES_VALIDOS})


class MeView(APIView):
    """Perfil efectivo (respeta X-View-As-Role para superusuarios)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = User.objects.prefetch_related(
            'groups',
            'proyectos_asignados__hospital',
            'proyectos_asignados__especialidad',
        ).get(pk=request.user.pk)
        return Response(UserSerializer(u, context={'request': request}).data)


class RegisterView(APIView):
    """Solo administradores (rol o staff) crean cuentas y asignan proyectos."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not es_administrador(request) and not request.user.is_staff:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        role = request.data.get('role', 'Otro')
        proyecto_ids = request.data.get('proyecto_ids') or request.data.get('proyectos') or []
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
        elif role == 'Administrador de proyectos':
            user.is_staff = False
            user.save()
        group = Group.objects.get(name=role)
        user.groups.add(group)
        if isinstance(proyecto_ids, str):
            proyecto_ids = [x.strip() for x in proyecto_ids.split(',') if x.strip()]
        if proyecto_ids:
            proyectos = Proyecto.objects.filter(id__in=proyecto_ids, activo=True)
            user.proyectos_asignados.set(proyectos)
        user = User.objects.prefetch_related(
            'groups',
            'proyectos_asignados__hospital',
            'proyectos_asignados__especialidad',
        ).get(pk=user.pk)
        return Response(
            {'user': UserSerializer(user, context={'request': request}).data, 'message': 'Usuario creado'},
            status=status.HTTP_201_CREATED,
        )


def _paciente_base_queryset(request):
    ids = ids_proyectos_usuario(request)
    qs = Paciente.objects.select_related('proyecto', 'proyecto__hospital', 'proyecto__especialidad', 'creado_por')
    if ids is not None:
        if not ids:
            return Paciente.objects.none()
        qs = qs.filter(proyecto_id__in=ids)
    return qs


def _filter_by_proyecto_param(qs, request):
    raw = request.query_params.get('proyecto')
    if not raw:
        return qs
    try:
        pid = int(raw)
    except (TypeError, ValueError):
        return Paciente.objects.none()
    ids = ids_proyectos_usuario(request)
    if ids is not None and pid not in ids:
        return Paciente.objects.none()
    return qs.filter(proyecto_id=pid)


class PacienteViewSet(viewsets.ModelViewSet):
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CompactPagination

    def get_queryset(self):
        qs = _paciente_base_queryset(self.request)
        return _filter_by_proyecto_param(qs, self.request).order_by('-creado_en')

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
            PacienteSerializer(serializer.instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance.refresh_from_db()
        return Response(PacienteSerializer(instance, context={'request': request}).data)

    def destroy(self, request, *args, **kwargs):
        if not es_administrador(request):
            return Response(
                {'error': 'Solo los administradores pueden eliminar pacientes.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class VideoPacienteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = CompactPagination

    def get_queryset(self):
        ids = ids_proyectos_usuario(self.request)
        qs = VideoPaciente.objects.select_related('paciente', 'paciente__proyecto')
        if ids is not None:
            if not ids:
                return VideoPaciente.objects.none()
            qs = qs.filter(paciente__proyecto_id__in=ids)
        raw = self.request.query_params.get('proyecto')
        if raw:
            try:
                pid = int(raw)
            except (TypeError, ValueError):
                return VideoPaciente.objects.none()
            if ids is not None and pid not in ids:
                return VideoPaciente.objects.none()
            qs = qs.filter(paciente__proyecto_id=pid)
        return qs.order_by('-subido_en')

    def get_serializer_class(self):
        if self.action == 'create':
            return VideoPacienteUploadSerializer
        return VideoPacienteSerializer

    def create(self, request, *args, **kwargs):
        serializer = VideoPacienteUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paciente_id = serializer.validated_data['paciente'].id
        if not _paciente_base_queryset(request).filter(id=paciente_id).exists():
            return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        video = serializer.save()
        video = VideoPaciente.objects.select_related('paciente').get(pk=video.pk)
        return Response(
            VideoPacienteSerializer(video, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all().order_by('nombre')
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated, IsAdminProyectosGlobales]


class EspecialidadViewSet(viewsets.ModelViewSet):
    queryset = Especialidad.objects.all().order_by('nombre')
    serializer_class = EspecialidadSerializer
    permission_classes = [IsAuthenticated, IsAdminProyectosGlobales]


class ProyectoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminProyectosGlobales()]

    def get_queryset(self):
        qs = Proyecto.objects.select_related('hospital', 'especialidad')
        if es_admin_proyectos_globales(self.request):
            return qs.order_by('-activo', 'nombre')
        return qs.filter(activo=True, usuarios=self.request.user).order_by('nombre').distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return ProyectoCreateSerializer
        if self.action in ('update', 'partial_update'):
            return ProyectoUpdateSerializer
        return ProyectoSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = Proyecto.objects.select_related('hospital', 'especialidad').get(pk=serializer.instance.pk)
        return Response(ProyectoSerializer(instance).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        instance.refresh_from_db()
        instance = Proyecto.objects.select_related('hospital', 'especialidad').get(pk=instance.pk)
        return Response(ProyectoSerializer(instance).data)


def _build_backup_manifest():
    """Export legible de hospitales, especialidades, proyectos, pacientes y vídeos (rutas + relaciones)."""
    hospitales = list(Hospital.objects.order_by('id').values('id', 'nombre', 'creado_en'))
    especialidades = list(Especialidad.objects.order_by('id').values('id', 'nombre', 'creado_en'))
    proyectos = []
    for p in Proyecto.objects.select_related('hospital', 'especialidad').order_by('id'):
        proyectos.append({
            'id': p.id,
            'nombre': p.nombre,
            'activo': p.activo,
            'hospital_id': p.hospital_id,
            'hospital_nombre': p.hospital.nombre,
            'especialidad_id': p.especialidad_id,
            'especialidad_nombre': p.especialidad.nombre,
            'creado_en': p.creado_en,
        })
    pacientes = []
    for pa in Paciente.objects.select_related('proyecto').order_by('id'):
        pacientes.append({
            'id': pa.id,
            'proyecto_id': pa.proyecto_id,
            'proyecto_nombre': pa.proyecto.nombre,
            'nombre': pa.nombre,
            'apellido_paterno': pa.apellido_paterno,
            'apellido_materno': pa.apellido_materno,
            'creado_por_id': pa.creado_por_id,
            'creado_en': pa.creado_en,
        })
    videos = []
    for v in VideoPaciente.objects.select_related('paciente', 'paciente__proyecto').order_by('id'):
        videos.append({
            'id': v.id,
            'paciente_id': v.paciente_id,
            'proyecto_id': v.paciente.proyecto_id,
            'proyecto_nombre': v.paciente.proyecto.nombre,
            'ruta_en_media': v.archivo.name if v.archivo else '',
            'estado': v.estado,
            'subido_en': v.subido_en,
            'notas': v.notas or '',
        })
    return {
        'generado_en': datetime.now().isoformat(),
        'hospitales': hospitales,
        'especialidades': especialidades,
        'proyectos': proyectos,
        'pacientes': pacientes,
        'videos': videos,
    }


class BackupView(APIView):
    """Descarga un .zip con BD, carpeta media y manifest.json (solo administradores)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not es_administrador(request) and not request.user.is_staff:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        tmp = tempfile.mkdtemp()
        zip_path = None
        try:
            db = settings.DATABASES['default']
            is_pg = db['ENGINE'] == 'django.db.backends.postgresql'

            if is_pg:
                sql_path = os.path.join(tmp, 'backup.sql')
                env = os.environ.copy()
                env['PGPASSWORD'] = db.get('PASSWORD', '')
                subprocess.run(
                    [
                        'pg_dump', '-h', db.get('HOST', 'localhost'),
                        '-U', db.get('USER', 'postgres'),
                        '-d', db.get('NAME'),
                        '-f', sql_path,
                        '--no-owner', '--no-acl',
                    ],
                    env=env,
                    check=True,
                    capture_output=True,
                )
            else:
                src = db.get('NAME')
                if isinstance(src, str) and not os.path.isabs(src):
                    src = os.path.join(settings.BASE_DIR, src)
                dest = os.path.join(tmp, 'db.sqlite3')
                shutil.copy2(src, dest)

            media_root = settings.MEDIA_ROOT
            if os.path.isdir(media_root):
                media_dest = os.path.join(tmp, 'media')
                shutil.copytree(media_root, media_dest, dirs_exist_ok=True)

            manifest_path = os.path.join(tmp, 'manifest.json')
            with open(manifest_path, 'w', encoding='utf-8') as mf:
                json.dump(_build_backup_manifest(), mf, ensure_ascii=False, indent=2, default=str)

            zip_path = os.path.join(
                tempfile.gettempdir(),
                f'ai-alcohol-backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}.zip',
            )
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, _, files in os.walk(tmp):
                    for f in files:
                        full = os.path.join(root, f)
                        arcname = os.path.relpath(full, tmp)
                        zf.write(full, arcname)

            with open(zip_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/zip')
                response['Content-Disposition'] = f'attachment; filename="{os.path.basename(zip_path)}"'
                return response
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
            if zip_path and os.path.exists(zip_path):
                try:
                    os.remove(zip_path)
                except OSError:
                    pass
