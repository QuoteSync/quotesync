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
    upload_avatar_direct,
    profile_update_direct,
    user_goals,
    search,
    import_history,
)
from .views_deepseek import DeepSeekTagView, DeepSeekRelatedView, DeepSeekChatView, DeepSeekRelatedByTextView, DeepSeekContextView

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
    path('api/me/', current_user, name='current_user'),
    path('api/_allauth/', include('allauth.headless.urls')),
    
    path('api/upload-quotes/', upload_quotes, name='upload_quotes'),
    path('api/upload-docx/', upload_docx, name='upload_docx'),
    path('api/upload-zip/', upload_zip, name='upload_zip'),
    path('api/import-history/', import_history, name='import_history'),
    path('api/statistics/', get_statistics, name='get_statistics'),
    path('api/upload-avatar-direct/', upload_avatar_direct, name='upload-avatar-direct'),
    path('api/profile-update-direct/', profile_update_direct, name='profile-update-direct'),
    path('api/users/goals/', user_goals, name='user-goals'),
    path('api/search/', search, name='search'),
    
    # DeepSeek AI endpoints
    path('api/deepseek/tag', DeepSeekTagView.as_view(), name='deepseek-tag'),
    path('api/deepseek/related', DeepSeekRelatedView.as_view(), name='deepseek-related'),
    path('api/deepseek/related-by-text', DeepSeekRelatedByTextView.as_view(), name='deepseek-related-by-text'),
    path('api/deepseek/chat', DeepSeekChatView.as_view(), name='deepseek-chat'),
    path('api/deepseek/context', DeepSeekContextView.as_view(), name='deepseek-context'),
]

# Map the UserViewSet action URLs in a more friendly way
urlpatterns += [
    path('api/users/profile/', UserViewSet.as_view({'get': 'profile', 'patch': 'profile_update', 'put': 'profile_update'}), name='user-profile'),
    path('api/users/change-password/', UserViewSet.as_view({'post': 'change_password'}), name='user-change-password'),
    path('api/users/upload-avatar', UserViewSet.as_view({'post': 'upload_avatar'}), name='user-upload-avatar'),
    path('api/users/upload-avatar/', UserViewSet.as_view({'post': 'upload_avatar'}), name='user-upload-avatar-slash'),
    path('api/users/stats/', UserViewSet.as_view({'get': 'stats'}), name='user-stats'),
    path('api/users/activity/', UserViewSet.as_view({'get': 'activity'}), name='user-activity'),
]
