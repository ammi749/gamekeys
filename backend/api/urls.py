from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from users.views import UserViewSet, CashbackTransactionViewSet
from products.views import CategoryViewSet, PlatformViewSet, ProductViewSet, AdminProductViewSet
from orders.views import OrderViewSet, StripeWebhookView


# Create a router and register our viewsets
router = DefaultRouter()

# User endpoints
router.register(r'users', UserViewSet, basename='user')
router.register(r'cashback-transactions', CashbackTransactionViewSet, basename='cashback-transaction')

# Product endpoints
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'platforms', PlatformViewSet, basename='platform')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'admin/products', AdminProductViewSet, basename='admin-product')

# Order endpoints
router.register(r'orders', OrderViewSet, basename='order')

# API URLs
urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # JWT Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Webhook endpoints
    path('webhooks/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
]