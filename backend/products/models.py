from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from decimal import Decimal

class Category(models.Model):
    """
    Product categories such as Games, Software, Gift Cards, etc.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    
    class Meta:
        verbose_name = 'category'
        verbose_name_plural = 'categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Platform(models.Model):
    """
    Platforms like Steam, Epic Games, Origin, Xbox, PlayStation, etc.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='platforms/', blank=True, null=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Supplier(models.Model):
    """
    External API suppliers for digital keys.
    """
    name = models.CharField(max_length=100)
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    api_url = models.URLField()
    active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Digital products (game keys, software keys, etc.) for sale.
    """
    REGION_CHOICES = (
        ('GLOBAL', 'Global'),
        ('EU', 'Europe'),
        ('NA', 'North America'),
        ('SA', 'South America'),
        ('AS', 'Asia'),
        ('OC', 'Oceania'),
        ('AF', 'Africa'),
    )
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=255, blank=True)
    
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT,
        related_name='products'
    )
    platform = models.ForeignKey(
        Platform, 
        on_delete=models.PROTECT,
        related_name='products'
    )
    
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    sale_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        blank=True, 
        null=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_external = models.BooleanField(default=False)
    
    supplier = models.ForeignKey(
        Supplier, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='products'
    )
    external_id = models.CharField(max_length=255, blank=True, null=True)
    
    region = models.CharField(
        max_length=10, 
        choices=REGION_CHOICES, 
        default='GLOBAL'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def current_price(self):
        """Returns the sale price if available, otherwise the regular price."""
        return self.sale_price if self.sale_price else self.price
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage if on sale."""
        if self.sale_price and self.price > 0:
            return round((1 - (self.sale_price / self.price)) * 100)
        return 0
    
    @property
    def in_stock(self):
        """
        Check if product has available keys.
        For external products, this would query the supplier API.
        """
        if self.is_external:
            # Placeholder for external supplier stock check
            # In a real implementation, this would call the supplier API
            return True
        else:
            return self.keys.filter(is_sold=False).exists()
    
    @property
    def available_keys_count(self):
        """Count available keys for this product."""
        if self.is_external:
            # Placeholder for external supplier stock check
            # In a real implementation, this would call the supplier API
            return 999  # Assume always in stock for external
        else:
            return self.keys.filter(is_sold=False).count()


class DigitalKey(models.Model):
    """
    Individual digital keys/codes for products.
    """
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE,
        related_name='keys'
    )
    key_code = models.CharField(max_length=255)
    is_sold = models.BooleanField(default=False)
    sold_at = models.DateTimeField(null=True, blank=True)
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchased_keys'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'digital key'
        verbose_name_plural = 'digital keys'
        unique_together = ('product', 'key_code')
    
    def __str__(self):
        return f"{self.product.name} - {'Sold' if self.is_sold else 'Available'}"
    
    def mark_as_sold(self, order):
        """Mark this key as sold and associate with an order."""
        from django.utils import timezone
        self.is_sold = True
        self.sold_at = timezone.now()
        self.order = order
        self.save()