# api/serializers.py
from rest_framework import serializers
from .models import (
    User, Author, Book, Tag, Quote, QuoteTag,
    QuoteGroup, QuoteGroupMembership, QuoteGroupShare,
    QuoteList, QuoteListQuote, Document, ImportLog
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils.text import slugify


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(password)
        user.save()
        return user
    


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = '__all__'


class BookSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    class Meta:
        model = Book
        fields = '__all__'


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class QuoteUpdateSerializer(serializers.ModelSerializer):
    # Se espera un array de strings (ej. ["Amor"])
    tags = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    tags_data = TagSerializer(source='tags', read_only=True, many=True)

    class Meta:
        model = Quote
        fields = ['body', 'tags', 'tags_data']

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        instance.body = validated_data.get('body', instance.body)
        instance.save()
        print(validated_data)
        if tags_data is not None:
            # Limpiamos la relación actual
            instance.tags.clear()
            for tag_title in tags_data:
                # En este ejemplo usamos el título tal cual; 
                # si necesitas usar slugify, aplica la transformación
                tag_slug = tag_title
                tag_obj, created = Tag.objects.get_or_create(title=tag_slug)
                # Al agregar con add, Django crea la instancia de QuoteTag en el fondo
                instance.tags.add(tag_obj)
        return instance

    def to_representation(self, instance):
        # Devuelve la representación completa usando el serializer original
        return QuoteSerializer(instance).data

from django.contrib.auth import get_user_model
from .models import Quote, Tag, Book

class QuoteSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    # Permitir recibir el ID del libro y del autor en la creación/actualización
    book_id = serializers.IntegerField(write_only=True, required=True)
    owner_id = serializers.IntegerField(write_only=True, required=True)
    # Hacemos que 'tags' sea opcional y se espere una lista de strings
    tags = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    # Campo para la lectura: representación completa de cada Tag
    tags_data = TagSerializer(source='tags', read_only=True, many=True)
    
    class Meta:
        model = Quote
        fields = [
            'id', 'body', 'book', 'book_id',
            'tags', 'tags_data', 'title',
            'owner', 'owner_id', 'archive',
            'created', 'updated', 'hash', 
            'location', 'source_platform'
        ]
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        # Extraer book_id y owner_id y asignarlos a los campos correspondientes
        book_id = validated_data.pop('book_id', None)
        owner_id = validated_data.pop('owner_id', None)
        if book_id:
            validated_data['book'] = Book.objects.get(id=book_id)
        if owner_id:
            User = get_user_model()
            validated_data['owner'] = User.objects.get(id=owner_id)
        quote = Quote.objects.create(**validated_data)
        for tag_title in tags_data:
            tag_obj, created = Tag.objects.get_or_create(title=tag_title)
            quote.tags.add(tag_obj)
        return quote

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        # Permitir actualizar book y owner si se envían sus IDs
        if 'book_id' in validated_data:
            book_id = validated_data.pop('book_id')
            instance.book = Book.objects.get(id=book_id)
        if 'owner_id' in validated_data:
            User = get_user_model()
            owner_id = validated_data.pop('owner_id')
            instance.owner = User.objects.get(id=owner_id)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags_data is not None:
            instance.tags.clear()
            for tag_title in tags_data:
                tag_obj, created = Tag.objects.get_or_create(title=tag_title)
                instance.tags.add(tag_obj)
        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Reemplazar el campo 'tags' por la representación completa de cada Tag
        rep['tags'] = TagSerializer(instance.tags.all(), many=True).data
        return rep

class QuoteTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteTag
        fields = '__all__'


class QuoteGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteGroup
        fields = '__all__'


class QuoteGroupMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteGroupMembership
        fields = '__all__'


class QuoteGroupShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteGroupShare
        fields = '__all__'


class QuoteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteList
        fields = '__all__'


class QuoteListQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteListQuote
        fields = '__all__'


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'


class ImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportLog
        fields = '__all__'
