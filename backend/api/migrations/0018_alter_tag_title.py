# Generated by Django 5.1.6 on 2025-04-12 11:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_author_gradient_primary_color_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tag',
            name='title',
            field=models.SlugField(help_text='Título de la etiqueta', max_length=100, unique=True),
        ),
    ]
