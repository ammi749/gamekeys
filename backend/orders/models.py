from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid

class Order(models.Model):
    """
    Order model to store purchases made by users or guests.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAYMENT_PROCESSING', 'Payment Processing'),
        ('PAID', 'Paid'),
        ('FULFILLED', 'Fulfilled'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('STRIPE', 'Stripe'),
        ('PAYPAL', 'PayPal'),
        ('CASHBACK', 'Cashback Only'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User can be null for guest checkouts
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    
    # Always require an email for key delivery
    email = models.EmailField()
    
    # Guest users will have this flag set to True
    is_guest = models.BooleanField(default=False)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        null=True,
        blank=True
    )
    
    # Store payment provider transaction IDs
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    paypal_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Order amounts
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    cashback_used = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Cashback earned from this order
    cashback_earned = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    
    # IP address for basic fraud prevention
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.id} - {self.status}"
    
    @property
    def is_paid(self):
        return self.status in ['PAID', 'FULFILLED']
    
    @property
    def is_fulfilled(self):
        return self.status == 'FULFILLED'
    
    def calculate_total(self):
        """Calculate order total considering cashback applied."""
        self.subtotal = sum(item.price * item.quantity for item in self.items.all())
        self.total = max(Decimal('0.00'), self.subtotal - self.cashback_used)
        self.save(update_fields=['subtotal', 'total'])
        return self.total
    
    def calculate_cashback(self, cashback_rate=Decimal('0.05')):
        """Calculate cashback earned from this order."""
        # Only registered users can earn cashback
        if self.is_guest:
            self.cashback_earned = Decimal('0.00')
        else:
            # Calculate cashback based on the subtotal (not considering cashback used)
            self.cashback_earned = round(self.subtotal * cashback_rate, 2)
        
        self.save(update_fields=['cashback_earned'])
        return self.cashback_earned
    
    def mark_as_paid(self):
        """Mark order as paid and record timestamp."""
        from django.utils import timezone
        self.status = 'PAID'
        self.paid_at = timezone.now()
        self.save(update_fields=['status', 'paid_at'])
    
    def mark_as_fulfilled(self):
        """Mark order as fulfilled and record timestamp."""
        from django.utils import timezone
        self.status = 'FULFILLED'
        self.fulfilled_at = timezone.now()
        self.save(update_fields=['status', 'fulfilled_at'])
    
    def add_cashback_to_user(self):
        """Add earned cashback to user's balance."""
        if self.user and not self.is_guest and self.cashback_earned > 0:
            self.user.add_cashback(self.cashback_earned)


class OrderItem(models.Model):
    """
    Individual items within an order.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    quantity = models.PositiveIntegerField(default=1)
    
    class Meta:
        unique_together = ('order', 'product')
    
    def __str__(self):
        return f"{self.product.name} in Order {self.order.id}"
    
    @property
    def item_total(self):
        return self.price * self.quantity