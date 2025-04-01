from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, views_tags

router = DefaultRouter()
# Register your viewsets here, e.g.:
# router.register(r'quotes', views.QuoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('suggest-tags/', views_tags.suggest_tags, name='suggest-tags'),
    path('available-tags/', views_tags.get_available_tags, name='available-tags'),
] 