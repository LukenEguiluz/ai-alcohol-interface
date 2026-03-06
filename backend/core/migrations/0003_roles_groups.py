from django.db import migrations

ROLES = ['Administrador', 'Doctor', 'Residente', 'Psicologo', 'Otro']


def create_roles_and_assign_admin(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    User = apps.get_model('auth', 'User')
    for name in ROLES:
        Group.objects.get_or_create(name=name)
    admin_group = Group.objects.get(name='Administrador')
    user = User.objects.filter(username='luken.eguiluz').first()
    if user and admin_group not in user.groups.all():
        user.groups.add(admin_group)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_default_admin_user'),
    ]

    operations = [
        migrations.RunPython(create_roles_and_assign_admin, reverse_noop),
    ]
