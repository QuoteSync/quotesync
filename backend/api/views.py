from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models

from .models import (
    Author, Book, Tag, Quote, QuoteTag,
    QuoteGroup, QuoteGroupMembership, QuoteGroupShare,
    QuoteList, QuoteListQuote, Document, ImportLog
)
from .serializers import (
    UserSerializer, AuthorSerializer, BookSerializer, TagSerializer,
    QuoteSerializer, QuoteTagSerializer, QuoteGroupSerializer,
    QuoteGroupMembershipSerializer, QuoteGroupShareSerializer,
    QuoteListSerializer, QuoteListQuoteSerializer, DocumentSerializer,
    ImportLogSerializer, QuoteUpdateSerializer
)
import logging
import os
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

# quotesync/apps/quotes/views.py

import re
from datetime import datetime
import locale
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import get_user_model

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    



class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name']

    def get_queryset(self):
        return Author.objects.all().prefetch_related('books', 'books__quotes')

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        author = self.get_object()
        author.is_favorite = not author.is_favorite
        author.save()
        return Response({'is_favorite': author.is_favorite})

    @action(detail=True, methods=['get'])
    def books(self, request, pk=None):
        author = self.get_object()
        books = author.books.all()
        serializer = BookSerializer(books, many=True)
        return Response(serializer.data)


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['title', 'author']

    def get_queryset(self):
        return Book.objects.all().select_related('author').prefetch_related('quotes')

    def update(self, request, *args, **kwargs):
        logger.info("BookViewSet update - Received data: %s", request.data)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            logger.info("BookViewSet update - Successful, response data: %s", serializer.data)
            return Response(serializer.data)
        else:
            logger.error("BookViewSet update - Validation error: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        book = self.get_object()
        book.is_favorite = not book.is_favorite
        book.save()
        return Response({'is_favorite': book.is_favorite})


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['title']

    def get_queryset(self):
        return Tag.objects.all().prefetch_related('quotes')

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        tag = self.get_object()
        tag.is_favorite = not tag.is_favorite
        tag.save()
        return Response({'is_favorite': tag.is_favorite})



class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            print(self.request.data)
            return QuoteUpdateSerializer  # Serializer específico para actualizaciones
        return QuoteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        book_id = self.request.query_params.get('book')
        author_id = self.request.query_params.get('author')
        tag = self.request.query_params.get('tag')

        if book_id:
            queryset = queryset.filter(book__id=book_id)
        if author_id:
            queryset = queryset.filter(book__author__id=author_id)
        if tag:
            queryset = queryset.filter(tags__title__icontains=tag)
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        quote = self.get_object()
        quote.is_favorite = not quote.is_favorite
        quote.save()
        return Response({'is_favorite': quote.is_favorite})

    def update(self, request, *args, **kwargs):
        logger.info("Received PUT data: %s", request.data)
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            logger.info("PUT successful, response data: %s", serializer.data)
            return Response(serializer.data)
        else:
            logger.error("PUT validation error: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuoteTagViewSet(viewsets.ModelViewSet):
    queryset = QuoteTag.objects.all()
    serializer_class = QuoteTagSerializer


class QuoteGroupViewSet(viewsets.ModelViewSet):
    queryset = QuoteGroup.objects.all()
    serializer_class = QuoteGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuoteGroup.objects.filter(
            models.Q(created_by=self.request.user) | 
            models.Q(members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        # Add creator as admin member
        QuoteGroupMembership.objects.create(
            group=group,
            user=self.request.user,
            role='admin'
        )
        # Add other members if provided
        member_emails = self.request.data.get('members', [])
        for email in member_emails:
            try:
                user = User.objects.get(email=email)
                QuoteGroupMembership.objects.create(
                    group=group,
                    user=user,
                    role='reader'
                )
            except User.DoesNotExist:
                # Skip if user not found
                continue

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        group = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', 'reader')
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(email=email)
            # Check if user is already a member
            if QuoteGroupMembership.objects.filter(group=group, user=user).exists():
                return Response(
                    {'error': 'User is already a member of this group'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            membership = QuoteGroupMembership.objects.create(
                group=group,
                user=user,
                role=role
            )
            return Response(QuoteGroupMembershipSerializer(membership).data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(email=email)
            membership = QuoteGroupMembership.objects.get(group=group, user=user)
            membership.delete()
            return Response({'status': 'member removed'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except QuoteGroupMembership.DoesNotExist:
            return Response(
                {'error': 'User is not a member of this group'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class QuoteGroupMembershipViewSet(viewsets.ModelViewSet):
    queryset = QuoteGroupMembership.objects.all()
    serializer_class = QuoteGroupMembershipSerializer


class QuoteGroupShareViewSet(viewsets.ModelViewSet):
    queryset = QuoteGroupShare.objects.all()
    serializer_class = QuoteGroupShareSerializer


class QuoteListViewSet(viewsets.ModelViewSet):
    queryset = QuoteList.objects.all()
    serializer_class = QuoteListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuoteList.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def add_quote(self, request, pk=None):
        quote_list = self.get_object()
        quote_id = request.data.get('quote_id')
        
        try:
            quote = Quote.objects.get(id=quote_id, owner=request.user)
            quote_list.quotes.add(quote)
            return Response({'status': 'quote added'})
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or not owned by user'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_quote(self, request, pk=None):
        quote_list = self.get_object()
        quote_id = request.data.get('quote_id')
        
        try:
            quote = Quote.objects.get(id=quote_id, owner=request.user)
            quote_list.quotes.remove(quote)
            return Response({'status': 'quote removed'})
        except Quote.DoesNotExist:
            return Response(
                {'error': 'Quote not found or not owned by user'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class QuoteListQuoteViewSet(viewsets.ModelViewSet):
    queryset = QuoteListQuote.objects.all()
    serializer_class = QuoteListQuoteSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer


class ImportLogViewSet(viewsets.ModelViewSet):
    queryset = ImportLog.objects.all()
    serializer_class = ImportLogSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    return Response({
        'username': user.username,
        'email': getattr(user, 'email', ''),
        'first_name': getattr(user, 'first_name', ''),
        'last_name': getattr(user, 'last_name', ''),
        # Puedes agregar otros campos si es necesario
    })




def save_quotes_from_file(file_content, owner):
    """
    Process the file content and create Quote instances.
    The owner parameter is used to set the owner of each quote.
    """
    # Split the file into blocks using the delimiter (==========)
    quote_blocks = re.split(r'(\n?==========\n?)', file_content)

    for block in quote_blocks:
        block = block.strip()
        if block:
            # Split the block into lines
            lines = block.split("\n")
            if len(lines) < 4:
                continue  # Skip if the block does not have the expected format

            # Extract book title and author from the first line
            title_and_author = lines[0].split('(')
            book_title = title_and_author[0].strip()
            author_name = title_and_author[1].replace(')', '').strip() if len(title_and_author) > 1 else "No author"

            # Extract the quote body from line 4 onward
            quote_body = "\n".join(lines[3:]).strip()

            # Extract date information from line 2 (if available)
            quote_info = lines[1]
            date_match = re.search(r'Añadido el (.+)', quote_info)
            quote_date = date_match.group(1).strip() if date_match else None

            if quote_date:
                try:
                    # If you have a specific format, adjust the strptime format string accordingly.
                    # For example:
                    # created_at = datetime.strptime(quote_date, "%A, %d de %B de %Y %H:%M:%S")
                    created_at = datetime.now()  # Here, we use the current datetime as a fallback.
                except ValueError:
                    print(f"Error parsing date: {quote_date}")
                    created_at = None
            else:
                created_at = None

            # Get or create the author and book instances
            author, _ = Author.objects.get_or_create(name=author_name)
            book, _ = Book.objects.get_or_create(title=book_title, author=author)

            # Create the quote, setting the owner
            quote = Quote.objects.create(
                owner=owner,
                title=book_title,
                body=quote_body,
                created=created_at,
                book=book
            )
            quote.save()

            print(f"Quote saved: {quote.title} from {book.title} by {author.name}.")

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_quotes(request):
    """
    API view to upload a .txt file and process quotes.
    The file must be sent with the key 'file' in request.FILES.
    """
    file_obj = request.FILES.get('file', None)
    if not file_obj:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not file_obj.name.endswith('.txt'):
        return Response({"error": "Invalid file type. Only .txt files are allowed."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Read the file content (assuming UTF-8 encoding)
        file_content = file_obj.read().decode('utf-8')
    except Exception as e:
        return Response({"error": f"Error reading file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Process the file content and save quotes with the current user as owner
        save_quotes_from_file(file_content, request.user)
    except Exception as e:
        return Response({"error": f"Error processing file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({"message": "Quotes uploaded successfully."}, status=status.HTTP_201_CREATED)
