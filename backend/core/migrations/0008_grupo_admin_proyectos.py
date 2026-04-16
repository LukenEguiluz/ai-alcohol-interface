from django.db import migrations


def crear_grupo(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.get_or_create(name='Administrador de proyectos')


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_proyecto_hospital_especialidad'),
    ]

    operations = [
        migrations.RunPython(crear_grupo, noop),
    ]
