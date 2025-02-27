from rest_framework import viewsets, generics, filters, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Platform, Product
from .serializers import (
    CategorySerializer, PlatformSerializer,
    ProductListSerializer, ProductDetailSerializer, AdminProductSerializer
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for product categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class PlatformViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for product platforms.
    """
    queryset = Platform.objects.all()
    serializer_class = PlatformSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for products.
    """
    queryset = Product.objects.filter(is_active=True)
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'platform__slug', 'region']
    search_fields = ['name', 'description', 'short_description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['-created_at']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Return featured products.
        """
        featured = self.get_queryset().filter(is_featured=True)[:10]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        """
        Return products that are on sale.
        """
        on_sale = self.get_queryset().filter(sale_price__isnull=False)[:10]
        serializer = self.get_serializer(on_sale, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request, category_slug=None):
        """
        Return products for a specific category.
        """
        category_slug = request.query_params.get('category_slug')
        if not category_slug:
            return Response(
                {"error": "Category slug parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        products = self.get_queryset().filter(category__slug=category_slug)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_platform(self, request):
        """
        Return products for a specific platform.
        """
        platform_slug = request.query_params.get('platform_slug')
        if not platform_slug:
            return Response(
                {"error": "Platform slug parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        products = self.get_queryset().filter(platform__slug=platform_slug)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class AdminProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for admin operations on products.
    Only accessible by admin users.
    """
    queryset = Product.objects.all()
    serializer_class = AdminProductSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]