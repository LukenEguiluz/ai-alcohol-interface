from django.contrib import admin
from .models import Paciente, VideoPaciente


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido_paterno', 'apellido_materno', 'sexo', 'edad', 'child_pugh', 'tiene_tx', 'puntaje_phes', 'puntaje_flicker', 'saludable', 'tiene_cirrosis', 'tiene_ehm', 'creado_en')
    list_filter = ('sexo', 'child_pugh', 'tiene_tx', 'saludable', 'tiene_cirrosis', 'tiene_ehm')
    search_fields = ('nombre', 'apellido_paterno', 'apellido_materno')


@admin.register(VideoPaciente)
class VideoPacienteAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'estado', 'subido_en')
    list_filter = ('estado',)
