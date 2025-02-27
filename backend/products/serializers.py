from rest_framework import serializers
from .models import Category, Platform, Product, Supplier


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image']


class PlatformSerializer(serializers.ModelSerializer):
    """Serializer for product platforms."""
    
    class Meta:
        model = Platform
        fields = ['id', 'name', 'slug', 'description', 'image']


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product list view (limited fields)."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    platform_name = serializers.CharField(source='platform.name', read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'image', 
            'category_name', 'platform_name', 'price', 'sale_price',
            'current_price', 'discount_percentage', 'in_stock', 'region'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for product detail view (all fields)."""
    category = CategorySerializer(read_only=True)
    platform = PlatformSerializer(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    available_keys_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category', 'platform', 'price', 'sale_price', 'current_price',
            'discount_percentage', 'image', 'is_featured', 'region',
            'in_stock', 'available_keys_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminProductSerializer(serializers.ModelSerializer):
    """Serializer for admin product operations."""
    
    class Meta:
        model = Product
        fields = '__all__'