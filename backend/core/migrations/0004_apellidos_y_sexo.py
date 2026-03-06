from django.db import migrations, models


def copiar_apellidos_a_paterno(apps, schema_editor):
    Paciente = apps.get_model('core', 'Paciente')
    for p in Paciente.objects.all():
        if hasattr(p, 'apellidos') and p.apellidos:
            p.apellido_paterno = p.apellidos
            p.save(update_fields=['apellido_paterno'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_roles_groups'),
    ]

    operations = [
        migrations.AddField(
            model_name='paciente',
            name='apellido_paterno',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AddField(
            model_name='paciente',
            name='apellido_materno',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='paciente',
            name='sexo',
            field=models.CharField(
                choices=[('M', 'Masculino'), ('F', 'Femenino'), ('O', 'Otro')],
                default='M',
                max_length=1,
            ),
        ),
        migrations.RunPython(copiar_apellidos_a_paterno, noop),
        migrations.RemoveField(
            model_name='paciente',
            name='apellidos',
        ),
    ]
