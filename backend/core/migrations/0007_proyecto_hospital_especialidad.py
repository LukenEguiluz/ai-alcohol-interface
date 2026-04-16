# Generated manually for proyecto / hospital / especialidad

from django.conf import settings
import django.db.models.deletion
from django.db import migrations, models


def forwards(apps, schema_editor):
    Hospital = apps.get_model('core', 'Hospital')
    Especialidad = apps.get_model('core', 'Especialidad')
    Proyecto = apps.get_model('core', 'Proyecto')
    Paciente = apps.get_model('core', 'Paciente')
    User = apps.get_model('auth', 'User')
    h, _ = Hospital.objects.get_or_create(nombre='Hospital (defecto)')
    e, _ = Especialidad.objects.get_or_create(nombre='General')
    proj = Proyecto.objects.create(nombre='Proyecto inicial', hospital=h, especialidad=e, activo=True)
    for p in Paciente.objects.all():
        p.proyecto_id = proj.id
        p.save(update_fields=['proyecto_id'])
    for u in User.objects.all():
        if not u.is_superuser:
            proj.usuarios.add(u)


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0006_paciente_child_pugh_tx_phes_flicker'),
    ]

    operations = [
        migrations.CreateModel(
            name='Hospital',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Hospital',
                'verbose_name_plural': 'Hospitales',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='Especialidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Especialidad',
                'verbose_name_plural': 'Especialidades',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='Proyecto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200)),
                ('activo', models.BooleanField(default=True)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('actualizado_en', models.DateTimeField(auto_now=True)),
                ('especialidad', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='proyectos', to='core.especialidad')),
                ('hospital', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='proyectos', to='core.hospital')),
                ('usuarios', models.ManyToManyField(blank=True, help_text='Usuarios que ven y cargan datos de este proyecto.', related_name='proyectos_asignados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Proyecto',
                'verbose_name_plural': 'Proyectos',
                'ordering': ['-creado_en'],
            },
        ),
        migrations.AddField(
            model_name='paciente',
            name='proyecto',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='pacientes',
                to='core.proyecto',
            ),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name='paciente',
            name='proyecto',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='pacientes',
                to='core.proyecto',
            ),
        ),
    ]
