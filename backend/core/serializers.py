from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Paciente, VideoPaciente


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_staff', 'role')

    def get_role(self, obj):
        if obj.is_superuser:
            return 'Administrador'
        group = obj.groups.first()
        return group.name if group else None


class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = (
            'id', 'nombre', 'apellido_paterno', 'apellido_materno', 'sexo', 'edad',
            'child_pugh', 'tiene_tx', 'puntaje_phes', 'puntaje_flicker',
            'saludable', 'tiene_cirrosis', 'tiene_ehm',
            'creado_en', 'actualizado_en',
        )
        read_only_fields = ('creado_en', 'actualizado_en')


class PacienteCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = (
            'nombre', 'apellido_paterno', 'apellido_materno', 'sexo', 'edad',
            'child_pugh', 'tiene_tx', 'puntaje_phes', 'puntaje_flicker',
            'saludable', 'tiene_cirrosis', 'tiene_ehm',
        )


class VideoPacienteSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()

    def get_paciente_nombre(self, obj):
        return str(obj.paciente)

    class Meta:
        model = VideoPaciente
        fields = (
            'id', 'paciente', 'paciente_nombre', 'archivo', 'estado',
            'subido_en', 'notas',
        )
        read_only_fields = ('estado', 'subido_en')


class VideoPacienteUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoPaciente
        fields = ('paciente', 'archivo', 'notas')
