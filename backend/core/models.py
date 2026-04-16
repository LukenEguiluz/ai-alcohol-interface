from datetime import date

from django.db import models
from django.conf import settings
from django.utils.text import get_valid_filename


class Hospital(models.Model):
    nombre = models.CharField(max_length=200)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Hospital'
        verbose_name_plural = 'Hospitales'

    def __str__(self):
        return self.nombre


class Especialidad(models.Model):
    nombre = models.CharField(max_length=200)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Especialidad'
        verbose_name_plural = 'Especialidades'

    def __str__(self):
        return self.nombre


class Proyecto(models.Model):
    """Estudio o cohorte vinculada a un hospital y una especialidad."""
    nombre = models.CharField(max_length=200)
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.PROTECT,
        related_name='proyectos',
    )
    especialidad = models.ForeignKey(
        Especialidad,
        on_delete=models.PROTECT,
        related_name='proyectos',
    )
    activo = models.BooleanField(default=True)
    usuarios = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='proyectos_asignados',
        blank=True,
        help_text='Usuarios que ven y cargan datos de este proyecto.',
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'

    def __str__(self):
        return f'{self.nombre} ({self.hospital})'


class Paciente(models.Model):
    """Datos del paciente: nombre, apellidos, edad, sexo, Child-Pugh, Tx, PHES, Flicker, etc."""
    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    CHILD_PUGH_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
    ]
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100, default='')
    apellido_materno = models.CharField(max_length=100, blank=True)
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES, default='M')
    edad = models.PositiveIntegerField()
    child_pugh = models.CharField(
        max_length=1,
        choices=CHILD_PUGH_CHOICES,
        blank=True,
        verbose_name='Child-Pugh (CP)',
    )
    tiene_tx = models.BooleanField(default=False, verbose_name='Tiene Tx')
    puntaje_phes = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Puntaje PHES',
    )
    puntaje_flicker = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Puntaje Flicker',
    )
    saludable = models.BooleanField(default=False, help_text='Paciente saludable')
    tiene_cirrosis = models.BooleanField(default=False, verbose_name='Tiene cirrosis')
    tiene_ehm = models.BooleanField(default=False, verbose_name='Tiene EHM (Encefalopatía Hepática Mínima)')
    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.PROTECT,
        related_name='pacientes',
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pacientes',
        null=True,
        blank=True,
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'

    def __str__(self):
        partes = [self.nombre, self.apellido_paterno]
        if self.apellido_materno:
            partes.append(self.apellido_materno)
        return ' '.join(partes)


def video_paciente_upload_to(instance, filename):
    """Ruta relativa a MEDIA_ROOT: un directorio por proyecto (proyectos/<id>/videos/AAAA/MM/DD/)."""
    fn = get_valid_filename(filename) or 'archivo.bin'
    proyecto_id = instance.paciente.proyecto_id
    sub = date.today().strftime('%Y/%m/%d')
    return f'proyectos/{proyecto_id}/videos/{sub}/{fn}'


class VideoPaciente(models.Model):
    """Video subido por paciente para procesamiento."""
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.CASCADE,
        related_name='videos',
    )
    archivo = models.FileField(upload_to=video_paciente_upload_to)
    estado = models.CharField(
        max_length=20,
        choices=[
            ('pendiente', 'Pendiente'),
            ('procesando', 'Procesando'),
            ('completado', 'Completado'),
            ('error', 'Error'),
        ],
        default='pendiente',
    )
    subido_en = models.DateTimeField(auto_now_add=True)
    notas = models.TextField(blank=True)

    class Meta:
        ordering = ['-subido_en']
        verbose_name = 'Video'
        verbose_name_plural = 'Videos'

    def __str__(self):
        return f'Video de {self.paciente} ({self.estado})'
