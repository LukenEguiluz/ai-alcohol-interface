from django.db import migrations


def create_default_user(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    if not User.objects.filter(username='luken.eguiluz').exists():
        user = User.objects.create_user(
            username='luken.eguiluz',
            email='',
            password='RebeyLuken8.!',
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()


def remove_default_user(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    User.objects.filter(username='luken.eguiluz').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_user, remove_default_user),
    ]
