from django.contrib import admin
from .models import Hospital, Especialidad, Proyecto, Paciente, VideoPaciente


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'creado_en')
    search_fields = ('nombre',)


@admin.register(Especialidad)
class EspecialidadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'creado_en')
    search_fields = ('nombre',)


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'hospital', 'especialidad', 'activo', 'creado_en')
    list_filter = ('activo', 'hospital', 'especialidad')
    search_fields = ('nombre',)
    filter_horizontal = ('usuarios',)


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = (
        'nombre', 'apellido_paterno', 'apellido_materno', 'proyecto', 'sexo', 'edad',
        'child_pugh', 'tiene_tx', 'puntaje_phes', 'puntaje_flicker',
        'saludable', 'tiene_cirrosis', 'tiene_ehm', 'creado_en',
    )
    list_filter = ('proyecto', 'sexo', 'child_pugh', 'tiene_tx', 'saludable', 'tiene_cirrosis', 'tiene_ehm')
    search_fields = ('nombre', 'apellido_paterno', 'apellido_materno')


@admin.register(VideoPaciente)
class VideoPacienteAdmin(admin.ModelAdmin):
    list_display = ('paciente', 'estado', 'subido_en')
    list_filter = ('estado',)
