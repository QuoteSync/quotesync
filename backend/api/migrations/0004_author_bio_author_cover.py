# Generated by Django 5.1.6 on 2025-02-15 13:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_user_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='author',
            name='bio',
            field=models.TextField(blank=True, help_text='Biografía del autor', null=True),
        ),
        migrations.AddField(
            model_name='author',
            name='cover',
            field=models.URLField(blank=True, help_text='URL de la foto del autor', null=True),
        ),
    ]
