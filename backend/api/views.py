from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.db.models import Count, Q

from .models import (
    Author, Book, Tag, Quote, QuoteTag,
    QuoteGroup, QuoteGroupMembership, QuoteGroupShare,
    QuoteList, QuoteListQuote, Document, ImportLog, QuoteNote, UserGoals
)
from .serializers import (
    UserSerializer, AuthorSerializer, BookSerializer, TagSerializer,
    QuoteSerializer, QuoteTagSerializer, QuoteGroupSerializer,
    QuoteGroupMembershipSerializer, QuoteGroupShareSerializer,
    QuoteListSerializer, QuoteListQuoteSerializer, DocumentSerializer,
    ImportLogSerializer, QuoteUpdateSerializer, QuoteNoteSerializer
)
import logging
import os
import json
import zipfile
import xml.etree.ElementTree as ET
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
    from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get the current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch', 'put'])
    def profile_update(self, request):
        """Update the current user's profile"""
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change the current user's password"""
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect'}, status=400)
        
        user.set_password(new_password)
        user.save()
        return Response({'success': True, 'message': 'Password changed successfully'})
    
    @action(detail=False, methods=['post'])
    def upload_avatar(self, request):
        """Upload a new avatar for the current user"""
        from rest_framework.parsers import MultiPartParser, FormParser
        import logging
        
        logger = logging.getLogger(__name__)
        logger.info(f"Upload avatar request received. Method: {request.method}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"FILES: {request.FILES}")
        logger.info(f"DATA: {request.data}")
        
        # Force proper parser usage for file uploads
        self.parser_classes = (MultiPartParser, FormParser)
        
        user = request.user
        avatar_file = request.FILES.get('avatar')
        
        if not avatar_file:
            logger.error("No avatar file found in request")
            return Response({'error': 'No avatar file provided'}, status=400)
        
        # Set a logical filename based on the user
        filename = f"avatar_{user.id}_{avatar_file.name}"
        
        # Save the file to media/avatars/
        avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        os.makedirs(avatar_dir, exist_ok=True)
        
        filepath = os.path.join(avatar_dir, filename)
        with open(filepath, 'wb+') as destination:
            for chunk in avatar_file.chunks():
                destination.write(chunk)
        
        # Update the user's avatar field with the URL
        user.avatar = f"{settings.MEDIA_URL}avatars/{filename}"
        user.save()
        
        logger.info(f"Avatar uploaded successfully: {user.avatar}")
        
        return Response({
            'success': True,
            'avatar_url': user.avatar,
            'message': 'Avatar uploaded successfully'
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics for the current user"""
        user = request.user
        
        # Count various entities belonging to this user
        total_quotes = Quote.objects.filter(owner=user).count()
        total_books = Book.objects.filter(quotes__owner=user).distinct().count()
        total_authors = Author.objects.filter(books__quotes__owner=user).distinct().count()
        total_tags = Tag.objects.filter(quotes__owner=user).distinct().count()
        
        return Response({
            'totalQuotes': total_quotes,
            'totalBooks': total_books,
            'totalAuthors': total_authors,
            'totalTags': total_tags
        })
    
    @action(detail=False, methods=['get'])
    def activity(self, request):
        """Get recent activity for the current user"""
        user = request.user
        
        # Get quotes created/updated in the last 7 days, grouped by date
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models.functions import TruncDate
        
        # Get the start date (7 days ago)
        start_date = timezone.now().date() - timedelta(days=6)
        
        # For each of the last 7 days, count the quotes created or updated
        activity_data = []
        
        for day_offset in range(7):
            current_date = start_date + timedelta(days=day_offset)
            next_date = current_date + timedelta(days=1)
            
            # Count quotes created or updated on this day
            quotes_count = Quote.objects.filter(
                owner=user,
                created__gte=current_date,
                created__lt=next_date
            ).count()
            
            # Count imports completed on this day
            imports_count = ImportLog.objects.filter(
                owner=user,
                created_at__date=current_date,
                status='completed'
            ).count()
            
            activity_data.append({
                'date': current_date.isoformat(),
                'quotes_count': quotes_count,
                'imports_count': imports_count,
                'total_count': quotes_count + imports_count
            })
        
        return Response(activity_data)


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

    @action(detail=False, methods=['get'])
    def random_favorites(self, request):
        """
        Return 5 random quotes, prioritizing favorites.
        - Takes up to 5 random favorite quotes
        - Fills remaining slots with random non-favorite quotes
        - Shuffling is done on the backend
        """
        import random
        
        # Get quotes for the current user
        user_quotes = Quote.objects.filter(owner=request.user)
        
        # Get and shuffle favorite quotes
        favorite_quotes = list(user_quotes.filter(is_favorite=True))
        random.shuffle(favorite_quotes)
        
        # Take up to 5 favorite quotes
        selected_favorites = favorite_quotes[:5]
        
        # Calculate how many more quotes we need to reach 5 total
        remaining_slots = max(0, 5 - len(selected_favorites))
        
        # If we need more quotes, get random non-favorites
        selected_random_quotes = []
        if remaining_slots > 0:
            non_favorite_quotes = list(user_quotes.filter(is_favorite=False))
            random.shuffle(non_favorite_quotes)
            selected_random_quotes = non_favorite_quotes[:remaining_slots]
        
        # Combine the lists and serialize
        selected_quotes = selected_favorites + selected_random_quotes
        serializer = self.get_serializer(selected_quotes, many=True)
        
        return Response(serializer.data)

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
        # Include both owned lists and lists shared through groups
        return QuoteList.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(visibility='group') & models.Q(group__members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def shared(self, request):
        # Get lists shared through groups the user is a member of
        shared_lists = QuoteList.objects.filter(
            models.Q(visibility='group') &
            models.Q(group__members=request.user)
        ).distinct()
        
        serializer = self.get_serializer(shared_lists, many=True)
        return Response(serializer.data)

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

    @action(detail=True, methods=['post'])
    def update_visibility(self, request, pk=None):
        quote_list = self.get_object()
        visibility = request.data.get('visibility')
        group_id = request.data.get('group_id')

        if visibility not in ['private', 'group']:
            return Response(
                {'error': 'Invalid visibility value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if visibility == 'group' and not group_id:
            return Response(
                {'error': 'Group ID is required for group visibility'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if visibility == 'group':
                group = QuoteGroup.objects.get(id=group_id)
                quote_list.group = group
            else:
                quote_list.group = None

            quote_list.visibility = visibility
            quote_list.save()

            serializer = self.get_serializer(quote_list)
            return Response(serializer.data)
        except QuoteGroup.DoesNotExist:
            return Response(
                {'error': 'Group not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
    @action(detail=True, methods=['post'])
    def update_order(self, request, pk=None):
        """
        Update the order of quotes in a list
        Expects a list of quote_ids in the order they should appear
        """
        quote_list = self.get_object()
        quote_ids = request.data.get('quote_ids', [])
        
        if not quote_ids:
            return Response(
                {'error': 'quote_ids parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # First clear the existing relationships
            QuoteListQuote.objects.filter(quote_list=quote_list).delete()
            
            # Then create new ones with proper order
            for index, quote_id in enumerate(quote_ids):
                try:
                    quote = Quote.objects.get(id=quote_id)
                    QuoteListQuote.objects.create(
                        quote_list=quote_list,
                        quote=quote,
                        order=index
                    )
                except Quote.DoesNotExist:
                    # Skip quotes that don't exist
                    continue
                    
            return Response({'status': 'order updated'})
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuoteListQuoteViewSet(viewsets.ModelViewSet):
    queryset = QuoteListQuote.objects.all()
    serializer_class = QuoteListQuoteSerializer


class QuoteNoteViewSet(viewsets.ModelViewSet):
    queryset = QuoteNote.objects.all()
    serializer_class = QuoteNoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return notes based on permissions:
        - User's own notes (private or public)
        - Public notes from other users
        """
        user = self.request.user
        return QuoteNote.objects.filter(
            Q(user=user) | 
            Q(is_private=False)
        ).order_by('created')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def for_quote(self, request):
        """
        Return all notes for a specific quote that the user has permission to see
        """
        quote_id = request.query_params.get('quote_id')
        if not quote_id:
            return Response(
                {'error': 'quote_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Get notes for this quote that the user can see
            user = request.user
            notes = self.get_queryset().filter(quote_id=quote_id)
            
            serializer = self.get_serializer(notes, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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

    quotes_created = 0
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

            # Get or create the author and book instances with no cover
            author, _ = Author.objects.get_or_create(
                name=author_name,
                defaults={'cover': None}  # Explicitly set cover to None for new authors
            )
            book, _ = Book.objects.get_or_create(
                title=book_title, 
                defaults={
                    'author': author,
                    'cover': None  # Explicitly set cover to None for new books
                }
            )

            # Create the quote, setting the owner
            quote = Quote.objects.create(
                owner=owner,
                title=book_title,
                body=quote_body,
                created=created_at,
                book=book,
                source_platform="Kindle"
            )
            quote.save()
            quotes_created += 1
            
            # Add source platform tag
            source_tag, _ = Tag.objects.get_or_create(title="kindle")
            QuoteTag.objects.get_or_create(quote=quote, tag=source_tag)

            print(f"Quote saved: {quote.title} from {book.title} by {author.name}.")
            
    return {
        "quotes_created": quotes_created
    }

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
        result = save_quotes_from_file(file_content, request.user)
        
        # Create import log
        import_log = ImportLog.objects.create(
            owner=request.user,
            platform='kindle',
            file=file_obj,
            status='completed'
        )
    except Exception as e:
        return Response({"error": f"Error processing file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        "message": f"Quotes uploaded successfully. Created {result['quotes_created']} quotes.",
        "quotes_count": result['quotes_created']
    }, status=status.HTTP_201_CREATED)

# Add the new function for DOCX processing
def extract_urls_from_docx(docx_path):
    """
    Extract all URLs/hyperlinks from a DOCX file using direct XML parsing
    """
    urls = []
    
    # List of URL prefixes to exclude (schema definitions and other non-content URLs)
    exclude_prefixes = [
        "http://schemas.",
        "https://schemas.",
        "http://www.w3.org/"
    ]
    
    try:
        # DOCX files are ZIP archives with XML content
        with zipfile.ZipFile(docx_path) as zf:
            # Check for document.xml which contains the main content
            if 'word/document.xml' in zf.namelist():
                with zf.open('word/document.xml') as content:
                    tree = ET.parse(content)
                    root = tree.getroot()
                    
                    # Define namespace for DOCX XML
                    ns = {
                        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
                    }
                    
                    # Find all hyperlink elements
                    for hyperlink in root.findall('.//w:hyperlink', ns):
                        # Get relationship ID
                        rel_id = hyperlink.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                        
                        if rel_id:
                            # Need to check relationships file to get the actual URL
                            if 'word/_rels/document.xml.rels' in zf.namelist():
                                with zf.open('word/_rels/document.xml.rels') as rels_content:
                                    rels_tree = ET.parse(rels_content)
                                    rels_root = rels_tree.getroot()
                                    
                                    # Find the relationship with matching ID
                                    for rel in rels_root.findall('.//*[@Id="' + rel_id + '"]'):
                                        target = rel.get('Target')
                                        if target and (target.startswith('http') or target.startswith('www')):
                                            # Skip schema URLs and other non-content URLs
                                            if not any(target.startswith(prefix) for prefix in exclude_prefixes):
                                                urls.append(target)
            
            # Also check for any URLs in the document content directly
            if 'word/document.xml' in zf.namelist():
                with zf.open('word/document.xml') as content:
                    content_str = content.read().decode('utf-8')
                    # Find URLs using regex - only looking for content URLs, not schema references
                    url_pattern = re.compile(r'https?://(?!schemas\.)(?:[-\w.]|(?:%[\da-fA-F]{2}))+(?:/[-\w%!./?=&+#]*)?')
                    found_urls = url_pattern.findall(content_str)
                    for url in found_urls:
                        if url not in urls and not any(url.startswith(prefix) for prefix in exclude_prefixes):
                            urls.append(url)
    except Exception as e:
        logger.error(f"Error extracting URLs: {e}")
    
    # Return only unique URLs
    return sorted(list(set(urls)))

def associate_urls_with_quotes(quotes, urls):
    """
    Associate URLs with specific quotes based on page numbers and other criteria
    """
    # Group URLs by page number
    url_by_page = {}
    
    # Extract page numbers from URLs (specific to Google Play Books format)
    for url in urls:
        page_match = re.search(r'GBS\.PA(\d+)', url)
        if page_match:
            page_num = page_match.group(1)
            if page_num not in url_by_page:
                url_by_page[page_num] = []
            url_by_page[page_num].append(url)
    
    # First pass: assign URLs to quotes based on page numbers
    for quote in quotes:
        if "page" in quote and quote["page"] in url_by_page:
            quote["urls"] = url_by_page[quote["page"]]
    
    # Find quotes that don't have URLs yet
    for quote in quotes:
        if "urls" not in quote:
            # Try to match based on content or context
            for page_num, page_urls in url_by_page.items():
                # Check if the quote might belong to this page based on context
                if "text" in quote and page_num in quote["text"]:
                    quote["urls"] = page_urls
                    break
    
    # Ensure each quote has at least one URL (use the book URL if nothing else available)
    book_urls = []
    for url in urls:
        if "GBS.PA" not in url or "w.0.0.0" not in url:  # Main book URL without specific location
            book_urls.append(url)
    
    # If no general book URL found, use the first URL
    if not book_urls and urls:
        book_urls = [urls[0]]
    
    # Assign at least one URL to each quote
    for quote in quotes:
        if "urls" not in quote or not quote["urls"]:
            if book_urls:
                quote["urls"] = book_urls
    
    return quotes

def convert_docx_to_json(docx_path):
    """
    Convert a DOCX file to JSON, extracting book info and quotes
    """
    import docx2txt
    
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"File {docx_path} does not exist.")
    
    # Extract text from docx
    text = docx2txt.process(docx_path)
    
    # Extract URLs using direct XML parsing
    urls = extract_urls_from_docx(docx_path)
    
    # Parse the text to extract metadata and quotes
    lines = text.strip().split('\n')
    book_data = {
        "title": "",
        "author": "",
        "publisher": "",
        "quotes": []
    }
    
    # URL regex pattern (matches most common URL formats) - as backup
    url_pattern = re.compile(r'https?://(?!schemas\.)(?:[-\w.]|(?:%[\da-fA-F]{2}))+(?:/[-\w%!./?=&+#]*)?')
    
    # Extract book info (title, author, publisher) from the beginning
    i = 0
    while i < min(10, len(lines)) and (not book_data["title"] or not book_data["author"] or not book_data["publisher"]):
        line = lines[i].strip()
        if line and not book_data["title"] and not line.startswith("Este documento"):
            book_data["title"] = line[:255]  # Limit title length
        elif line and book_data["title"] and not book_data["author"] and not line.startswith("Este documento"):
            book_data["author"] = line[:255]  # Limit author length
        elif line and book_data["title"] and book_data["author"] and not book_data["publisher"] and not line.startswith("Este documento"):
            book_data["publisher"] = line[:255]  # Limit publisher length
        
        i += 1
    
    # Skip metadata lines
    meta_end_idx = 0
    for i, line in enumerate(lines):
        if "notas/fragmentos resaltados" in line:
            meta_end_idx = i + 2  # Skip this line and the next
            break
    
    # Extract quotes
    current_chapter = None
    quote_text = None
    quote_date = None
    page_number = None
    
    i = meta_end_idx
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines
        if not line:
            i += 1
            continue
        
        # Detect chapter headings
        chapter_match = re.match(r'^(\d+)\.\s+(.*)', line)
        if chapter_match:
            # Limit chapter name length
            current_chapter = line[:100] if len(line) <= 100 else line[:97] + "..."
            i += 1
            continue
            
        # Detect dates (indicating the end of a quote)
        date_match = re.search(r'(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})', line)
        if date_match:
            quote_date = line.strip()
            
            # If we have a complete quote, add it
            if quote_text:
                # Clean up the quote (remove page numbers at the beginning)
                cleaned_quote = re.sub(r'^\s*\d+\s+', '', quote_text).strip()
                
                # Only add if it's a substantive quote
                if cleaned_quote and len(cleaned_quote) > 3:
                    quote_dict = {
                        "chapter": current_chapter,
                        "text": cleaned_quote,
                        "date": quote_date
                    }
                    
                    # Add page number if available
                    if page_number:
                        quote_dict["page"] = page_number
                    
                    book_data["quotes"].append(quote_dict)
                
                # Reset for next quote
                quote_text = None
                page_number = None
            
            i += 1
            continue
        
        # Detect page numbers (often at the beginning of quotes)
        page_match = re.match(r'^(\d+)$', line)
        if page_match and not quote_text:
            page_number = line.strip()
            i += 1
            continue
        
        # If we get here, this line is part of a quote
        if not quote_text:
            quote_text = line
        else:
            quote_text += " " + line
        
        i += 1
    
    # Add the last quote if needed
    if quote_text and quote_date:
        cleaned_quote = re.sub(r'^\s*\d+\s+', '', quote_text).strip()
        if cleaned_quote and len(cleaned_quote) > 3:
            quote_dict = {
                "chapter": current_chapter,
                "text": cleaned_quote,
                "date": quote_date
            }
            
            # Add page number if available
            if page_number:
                quote_dict["page"] = page_number
            
            book_data["quotes"].append(quote_dict)
    
    # Clean up any chapters that might have been incorrectly detected in quotes
    for quote in book_data["quotes"]:
        # Fix chapter assignment based on content order
        if quote["chapter"] and "Epílogo" in quote["text"]:
            quote["chapter"] = "Epílogo"
            # Remove "Epílogo" from the quote text
            quote["text"] = quote["text"].replace("Epílogo", "").strip()
    
    # Associate URLs with quotes - ensure every quote gets matched up
    if urls:
        book_data["quotes"] = associate_urls_with_quotes(book_data["quotes"], urls)
    
    # Ensure all quotes have a "urls" key, even if empty
    for quote in book_data["quotes"]:
        if "urls" not in quote:
            quote["urls"] = []
    
    # Add a root URL for the book if needed
    book_url = None
    for url in urls:
        if "id=" in url and "GBS.PA" in url:
            # Extract the base URL without page info
            match = re.search(r'(http://play\.google\.com/books/reader\?printsec=frontcover&output=reader&id=[^&]+)', url)
            if match:
                book_url = match.group(1)
                break
    
    if book_url:
        book_data["book_url"] = book_url
    
    return book_data


def save_quotes_from_docx(book_data, owner):
    """
    Save quotes from the parsed DOCX data
    """
    # Create or get the author
    author_name = book_data.get("author", "Unknown Author")
    author, author_created = Author.objects.get_or_create(
        name=author_name,
        defaults={'cover': None}  # Explicitly set cover to None for new authors
    )
    
    # Create or get the book
    book_title = book_data.get("title", "Unknown Book")
    book, book_created = Book.objects.get_or_create(
        title=book_title,
        defaults={
            "author": author,
            "publisher": book_data.get("publisher", ""),
            "cover": None  # Explicitly set cover to None for new books
        }
    )
    
    # Get or create source platform tag
    source_tag, _ = Tag.objects.get_or_create(title="google_books")
    
    # Default book URL if available
    book_url = book_data.get("book_url", "")
    
    # Create quotes
    quotes_created = 0
    for quote_data in book_data.get("quotes", []):
        # Skip empty quotes
        if not quote_data.get("text"):
            continue

        quote_text = quote_data.get("text")
        
        # Create a title from the first words of the quote (max 50 chars)
        title = quote_text[:50] + ("..." if len(quote_text) > 50 else "")
        
        # Set source platform (ensure it doesn't exceed 50 chars)
        source_platform = "Google Books"
        
        # Get quote URL - use the first URL if multiple available or the book URL as fallback
        quote_url = None
        if "urls" in quote_data and quote_data["urls"]:
            quote_url = quote_data["urls"][0]
        elif book_url:
            quote_url = book_url
        
        # Create the quote
        quote = Quote(
            owner=owner,
            title=title,
            body=quote_text,
            book=book,
            location=quote_data.get("page", ""),
            source_platform=source_platform,
            chapter=quote_data.get("chapter", ""),  # Save chapter directly in quote
            book_url=quote_url  # Save the quote-specific URL
        )
        quote.save()
        quotes_created += 1
        
        # Add source platform tag
        QuoteTag.objects.get_or_create(quote=quote, tag=source_tag)
    
    return {
        "author_created": author_created,
        "book_created": book_created,
        "quotes_created": quotes_created,
        "author": author,
        "book": book
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_docx(request):
    """
    API view to upload a .docx file, convert it to JSON, and process quotes.
    The file must be sent with the key 'file' in request.FILES.
    """
    file_obj = request.FILES.get('file', None)
    if not file_obj:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if file is a docx
    if not file_obj.name.endswith('.docx'):
        return Response({"error": "Invalid file type. Only .docx files are allowed."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create a temporary path to save the file
    temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', file_obj.name)
    os.makedirs(os.path.dirname(temp_path), exist_ok=True)
    
    try:
        # Save the file temporarily
        with open(temp_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        
        # Convert DOCX to JSON
        book_data = convert_docx_to_json(temp_path)
        
        # Also save JSON file for reference
        json_path = os.path.splitext(temp_path)[0] + '.json'
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(book_data, f, indent=2, ensure_ascii=False)
        
        # Process the book data and save quotes with the current user as owner
        result = save_quotes_from_docx(book_data, request.user)
        
        # Create import log
        import_log = ImportLog.objects.create(
            owner=request.user,
            platform='google_books',
            file=file_obj,
            status='completed'
        )
        
        return Response({
            "message": f"Document processed successfully. Created {result['quotes_created']} quotes.",
            "book": result["book"].title,
            "author": result["author"].name,
            "quotes_count": result["quotes_created"],
            "book_id": result["book"].id,
            "json_data": book_data  # Include full JSON data in response
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error processing DOCX: {str(e)}")
        return Response({"error": f"Error processing DOCX: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    finally:
        # Clean up temporary files
        if os.path.exists(temp_path):
            os.remove(temp_path)
        json_path = os.path.splitext(temp_path)[0] + '.json'
        if os.path.exists(json_path):
            # Leave JSON file for debugging/reference
            pass

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_zip(request):
    """
    API view to upload a .zip file containing multiple .docx files,
    convert them to JSON, and process quotes for each one.
    The file must be sent with the key 'file' in request.FILES.
    """
    file_obj = request.FILES.get('file', None)
    if not file_obj:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if file is a zip
    if not file_obj.name.endswith('.zip'):
        return Response({"error": "Invalid file type. Only .zip files are allowed."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create a temporary path to save the zip file
    temp_zip_path = os.path.join(settings.MEDIA_ROOT, 'temp', file_obj.name)
    temp_extract_dir = os.path.join(settings.MEDIA_ROOT, 'temp', 'extract_' + str(hash(file_obj.name)))
    
    os.makedirs(os.path.dirname(temp_zip_path), exist_ok=True)
    os.makedirs(temp_extract_dir, exist_ok=True)
    
    results = {
        "total_docx_files": 0,
        "processed_files": 0,
        "total_quotes": 0,
        "books": [],
        "errors": []
    }
    
    try:
        # Save the zip file temporarily
        with open(temp_zip_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)
        
        # Extract the zip file
        with zipfile.ZipFile(temp_zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_extract_dir)
        
        # Process all DOCX files in the extracted directory
        docx_files = []
        for root, dirs, files in os.walk(temp_extract_dir):
            for file in files:
                if file.endswith('.docx'):
                    docx_files.append(os.path.join(root, file))
        
        results["total_docx_files"] = len(docx_files)
        
        # Process each DOCX file
        for docx_path in docx_files:
            try:
                # Convert DOCX to JSON
                book_data = convert_docx_to_json(docx_path)
                
                # Save JSON for reference
                json_path = os.path.splitext(docx_path)[0] + '.json'
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(book_data, f, indent=2, ensure_ascii=False)
                
                # Process quotes
                result = save_quotes_from_docx(book_data, request.user)
                
                results["processed_files"] += 1
                results["total_quotes"] += result["quotes_created"]
                results["books"].append({
                    "title": result["book"].title,
                    "author": result["author"].name,
                    "quotes_count": result["quotes_created"],
                    "book_id": result["book"].id
                })
                
            except Exception as e:
                error_msg = f"Error processing {os.path.basename(docx_path)}: {str(e)}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        # Create import log
        import_log = ImportLog.objects.create(
            owner=request.user,
            platform='google_books_batch',
            file=file_obj,
            status='completed'
        )
        
        return Response({
            "message": f"Processed {results['processed_files']} of {results['total_docx_files']} DOCX files, creating {results['total_quotes']} quotes.",
            "results": results
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error processing ZIP file: {str(e)}")
        return Response({"error": f"Error processing ZIP file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    finally:
        # Clean up temporary files
        if os.path.exists(temp_zip_path):
            os.remove(temp_zip_path)
        
        # Remove the extraction directory and its contents
        import shutil
        shutil.rmtree(temp_extract_dir, ignore_errors=True)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_statistics(request):
    """
    API view to get dashboard statistics for the current user.
    Returns counts of books, authors, quotes, and other metrics.
    """
    user = request.user
    
    # Get statistics
    stats = {
        'total_books': Book.objects.filter(quotes__owner=user).distinct().count(),
        'books_without_covers': Book.objects.filter(quotes__owner=user, cover__isnull=True).distinct().count(),
        'total_authors': Author.objects.filter(books__quotes__owner=user).distinct().count(),
        'total_quotes': Quote.objects.filter(owner=user).count(),
        'quote_lists': QuoteList.objects.filter(owner=user).count(),
        'quote_groups': QuoteGroup.objects.filter(members=user).distinct().count(),
    }
    
    return Response(stats, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar_direct(request):
    """
    Dedicated view function for avatar uploads.
    This bypasses the ViewSet architecture for troubleshooting.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Direct upload avatar request received. Method: {request.method}")
    logger.info(f"Content-Type: {request.content_type}")
    logger.info(f"FILES: {request.FILES}")
    logger.info(f"DATA: {request.data}")
    
    user = request.user
    avatar_file = request.FILES.get('avatar')
    
    if not avatar_file:
        logger.error("No avatar file found in request")
        return Response({'error': 'No avatar file provided'}, status=400)
    
    # Set a logical filename based on the user
    filename = f"avatar_{user.id}_{avatar_file.name}"
    
    # Save the file to media/avatars/
    avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
    os.makedirs(avatar_dir, exist_ok=True)
    
    filepath = os.path.join(avatar_dir, filename)
    with open(filepath, 'wb+') as destination:
        for chunk in avatar_file.chunks():
            destination.write(chunk)
    
    # Update the user's avatar field with the URL
    user.avatar = f"{settings.MEDIA_URL}avatars/{filename}"
    user.save()
    
    logger.info(f"Avatar uploaded successfully: {user.avatar}")
    
    return Response({
        'success': True,
        'avatar_url': user.avatar,
        'message': 'Avatar uploaded successfully'
    })

@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_update_direct(request):
    """
    Dedicated view function for profile updates.
    This bypasses the ViewSet architecture for troubleshooting.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Direct profile update request received. Method: {request.method}")
    logger.info(f"Content-Type: {request.content_type}")
    logger.info(f"DATA: {request.data}")
    
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        logger.info(f"Profile updated successfully for user: {user.username}")
        return Response(serializer.data)
    
    logger.error(f"Profile update validation errors: {serializer.errors}")
    return Response(serializer.errors, status=400)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_goals(request):
    """
    View function for handling user goals.
    GET: Retrieve current user goals
    PATCH: Update user goals
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Get the UserGoals model for the current user, or create it if it doesn't exist
    from django.conf import settings
    from .models import User, UserGoals
    
    user = request.user
    
    try:
        # Try to get existing goals or create default goals
        goals, created = UserGoals.objects.get_or_create(
            user=user,
            defaults={
                'quotes_goal': 100,
                'books_goal': 30,
                'authors_goal': 20
            }
        )
        
        if request.method == 'GET':
            # Return the user's goals
            return Response({
                'quotes_goal': goals.quotes_goal,
                'books_goal': goals.books_goal,
                'authors_goal': goals.authors_goal
            })
        
        elif request.method == 'PATCH':
            # Update the user's goals
            data = request.data
            
            if 'quotes_goal' in data:
                goals.quotes_goal = max(1, int(data['quotes_goal']))
            if 'books_goal' in data:
                goals.books_goal = max(1, int(data['books_goal']))
            if 'authors_goal' in data:
                goals.authors_goal = max(1, int(data['authors_goal']))
                
            goals.save()
            
            logger.info(f"Updated goals for user {user.username}: quotes={goals.quotes_goal}, books={goals.books_goal}, authors={goals.authors_goal}")
            
            return Response({
                'quotes_goal': goals.quotes_goal,
                'books_goal': goals.books_goal,
                'authors_goal': goals.authors_goal
            })
    
    except Exception as e:
        logger.error(f"Error handling user goals: {e}")
        return Response(
            {'error': 'Failed to process user goals'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
