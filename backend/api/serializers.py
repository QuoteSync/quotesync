# api/serializers.py
from rest_framework import serializers
from .models import (
    User, Author, Book, Tag, Quote, QuoteTag,
    QuoteGroup, QuoteGroupMembership, QuoteGroupShare,
    QuoteList, QuoteListQuote, Document, ImportLog
)


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


class QuoteSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    class Meta:
        model = Quote
        fields = '__all__'


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
