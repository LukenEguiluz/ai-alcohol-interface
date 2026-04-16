from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import serializers

from .access import (
    GRUPO_ADMIN_PROYECTOS,
    es_administrador,
    es_admin_proyectos_globales,
    puede_usar_proyecto,
    simulated_role,
)
from .models import (
    Hospital,
    Especialidad,
    Proyecto,
    Paciente,
    VideoPaciente,
)


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ('id', 'nombre', 'creado_en')


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ('id', 'nombre', 'creado_en')


class ProyectoMiniSerializer(serializers.ModelSerializer):
    hospital_nombre = serializers.CharField(source='hospital.nombre', read_only=True)
    especialidad_nombre = serializers.CharField(source='especialidad.nombre', read_only=True)

    class Meta:
        model = Proyecto
        fields = ('id', 'nombre', 'activo', 'hospital_nombre', 'especialidad_nombre')


class ProyectoSerializer(serializers.ModelSerializer):
    hospital_nombre = serializers.CharField(source='hospital.nombre', read_only=True)
    especialidad_nombre = serializers.CharField(source='especialidad.nombre', read_only=True)

    class Meta:
        model = Proyecto
        fields = (
            'id',
            'nombre',
            'activo',
            'hospital_nombre',
            'especialidad_nombre',
            'creado_en',
            'actualizado_en',
        )
        read_only_fields = ('creado_en', 'actualizado_en')


class ProyectoCreateSerializer(serializers.ModelSerializer):
    hospital_nombre = serializers.CharField(write_only=True, max_length=200)
    especialidad_nombre = serializers.CharField(write_only=True, max_length=200)

    class Meta:
        model = Proyecto
        fields = ('nombre', 'hospital_nombre', 'especialidad_nombre', 'activo')

    def create(self, validated_data):
        hn = (validated_data.pop('hospital_nombre') or '').strip() or '—'
        en = (validated_data.pop('especialidad_nombre') or '').strip() or '—'
        hospital, _ = Hospital.objects.get_or_create(nombre=hn)
        especialidad, _ = Especialidad.objects.get_or_create(nombre=en)
        return Proyecto.objects.create(
            hospital=hospital,
            especialidad=especialidad,
            nombre=(validated_data.get('nombre') or '').strip() or 'Proyecto',
            activo=validated_data.get('activo', True),
        )


class ProyectoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proyecto
        fields = ('nombre', 'activo')


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    proyectos = serializers.SerializerMethodField()
    todos_los_proyectos = serializers.SerializerMethodField()
    puede_administrar_plataforma = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField(read_only=True)
    view_as = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'is_staff',
            'is_superuser',
            'role',
            'proyectos',
            'todos_los_proyectos',
            'puede_administrar_plataforma',
            'view_as',
        )

    def get_view_as(self, obj):
        request = self.context.get('request')
        if not request or not obj.is_superuser:
            return ''
        r = simulated_role(request)
        return r or ''

    def get_role(self, obj):
        request = self.context.get('request')
        sim = simulated_role(request) if request else None
        if sim is not None:
            return sim
        if obj.is_superuser:
            return 'Superusuario'
        names = list(obj.groups.values_list('name', flat=True))
        if 'Administrador' in names:
            return 'Administrador'
        if 'Administrador de proyectos' in names:
            return 'Administrador de proyectos'
        return names[0] if names else None

    def get_todos_los_proyectos(self, obj):
        request = self.context.get('request')
        if request:
            return bool(es_admin_proyectos_globales(request))
        return bool(obj.is_superuser or obj.groups.filter(name=GRUPO_ADMIN_PROYECTOS).exists())

    def get_puede_administrar_plataforma(self, obj):
        request = self.context.get('request')
        if request:
            return bool(es_administrador(request))
        if not obj.is_authenticated:
            return False
        if obj.is_superuser:
            return True
        return obj.groups.filter(name='Administrador').exists()

    def get_proyectos(self, obj):
        if self.get_todos_los_proyectos(obj):
            return []
        qs = obj.proyectos_asignados.filter(activo=True).select_related('hospital', 'especialidad')
        return ProyectoMiniSerializer(qs, many=True).data


class PacienteSerializer(serializers.ModelSerializer):
    proyecto_label = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = (
            'id',
            'proyecto',
            'proyecto_label',
            'nombre',
            'apellido_paterno',
            'apellido_materno',
            'sexo',
            'edad',
            'child_pugh',
            'tiene_tx',
            'puntaje_phes',
            'puntaje_flicker',
            'saludable',
            'tiene_cirrosis',
            'tiene_ehm',
            'creado_en',
            'actualizado_en',
        )
        read_only_fields = ('creado_en', 'actualizado_en', 'proyecto_label')

    def get_proyecto_label(self, obj):
        if not obj.proyecto_id:
            return ''
        p = obj.proyecto
        return f'{p.nombre} · {p.hospital.nombre} · {p.especialidad.nombre}'


class PacienteCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = (
            'proyecto',
            'nombre',
            'apellido_paterno',
            'apellido_materno',
            'sexo',
            'edad',
            'child_pugh',
            'tiene_tx',
            'puntaje_phes',
            'puntaje_flicker',
            'saludable',
            'tiene_cirrosis',
            'tiene_ehm',
        )

    def validate_proyecto(self, value):
        request = self.context.get('request')
        if request and not puede_usar_proyecto(request, value.id):
            raise serializers.ValidationError('No tiene acceso a este proyecto.')
        return value


class VideoPacienteSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    proyecto_id = serializers.IntegerField(source='paciente.proyecto_id', read_only=True)

    def get_paciente_nombre(self, obj):
        return str(obj.paciente)

    class Meta:
        model = VideoPaciente
        fields = (
            'id',
            'paciente',
            'paciente_nombre',
            'proyecto_id',
            'archivo',
            'estado',
            'subido_en',
            'notas',
        )
        read_only_fields = ('estado', 'subido_en', 'proyecto_id')


class VideoPacienteUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoPaciente
        fields = ('paciente', 'archivo', 'notas')

    def validate_archivo(self, value):
        limit = getattr(settings, 'MAX_VIDEO_UPLOAD_BYTES', 850 * 1024 * 1024)
        size = getattr(value, 'size', None)
        if size is not None and size > limit:
            mb = limit // (1024 * 1024)
            raise serializers.ValidationError(
                f'El archivo supera el máximo permitido ({mb} MB). '
                'Para Full HD ~2 min a 60 Hz, reduce bitrate o recorta el vídeo.'
            )
        return value
