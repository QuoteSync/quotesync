from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, AuthorViewSet, BookViewSet, TagViewSet, QuoteViewSet, QuoteTagViewSet,
    QuoteGroupViewSet, QuoteGroupMembershipViewSet, QuoteGroupShareViewSet,
    QuoteListViewSet, QuoteListQuoteViewSet, DocumentViewSet, ImportLogViewSet,
    QuoteNoteViewSet,
    current_user,
    upload_quotes,
    upload_docx,
    upload_zip,
    get_statistics,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'authors', AuthorViewSet)
router.register(r'books', BookViewSet)
router.register(r'tags', TagViewSet)
router.register(r'quotes', QuoteViewSet)
router.register(r'quote-tags', QuoteTagViewSet)
router.register(r'quote-groups', QuoteGroupViewSet)
router.register(r'group-memberships', QuoteGroupMembershipViewSet)
router.register(r'group-shares', QuoteGroupShareViewSet)
router.register(r'quote-lists', QuoteListViewSet, basename='quote-list')
router.register(r'quote-list-quotes', QuoteListQuoteViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'import-logs', ImportLogViewSet)
router.register(r'quote-notes', QuoteNoteViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    # path('api/me/', current_user, name='current_user'),
    path('api/_allauth/', include('allauth.headless.urls')),


    
    path('api/upload-quotes/', upload_quotes, name='upload_quotes'),
    path('api/upload-docx/', upload_docx, name='upload_docx'),
    path('api/upload-zip/', upload_zip, name='upload_zip'),
    path('api/statistics/', get_statistics, name='get_statistics'),
]
