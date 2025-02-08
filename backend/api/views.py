from rest_framework import viewsets, permissions
from .models import (
    User, Author, Book, Tag, Quote, QuoteTag,
    QuoteGroup, QuoteGroupMembership, QuoteGroupShare,
    QuoteList, QuoteListQuote, Document, ImportLog
)
from .serializers import (
    UserSerializer, AuthorSerializer, BookSerializer, TagSerializer,
    QuoteSerializer, QuoteTagSerializer, QuoteGroupSerializer,
    QuoteGroupMembershipSerializer, QuoteGroupShareSerializer,
    QuoteListSerializer, QuoteListQuoteSerializer, DocumentSerializer,
    ImportLogSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # def get_permissions(self):
    #     if self.action == 'create':
    #         return [permissions.AllowAny()]
    #     return [permissions.IsAuthenticated()]

class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer

class QuoteTagViewSet(viewsets.ModelViewSet):
    queryset = QuoteTag.objects.all()
    serializer_class = QuoteTagSerializer

class QuoteGroupViewSet(viewsets.ModelViewSet):
    queryset = QuoteGroup.objects.all()
    serializer_class = QuoteGroupSerializer

class QuoteGroupMembershipViewSet(viewsets.ModelViewSet):
    queryset = QuoteGroupMembership.objects.all()
    serializer_class = QuoteGroupMembershipSerializer

class QuoteGroupShareViewSet(viewsets.ModelViewSet):
    queryset = QuoteGroupShare.objects.all()
    serializer_class = QuoteGroupShareSerializer

class QuoteListViewSet(viewsets.ModelViewSet):
    queryset = QuoteList.objects.all()
    serializer_class = QuoteListSerializer

class QuoteListQuoteViewSet(viewsets.ModelViewSet):
    queryset = QuoteListQuote.objects.all()
    serializer_class = QuoteListQuoteSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

class ImportLogViewSet(viewsets.ModelViewSet):
    queryset = ImportLog.objects.all()
    serializer_class = ImportLogSerializer
