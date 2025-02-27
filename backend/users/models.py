from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal

class User(AbstractUser):
    """
    Custom user model with additional fields for the e-commerce platform.
    """
    email = models.EmailField(_('email address'), unique=True)
    cashback_balance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Use email as the username field for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    def __str__(self):
        return self.email
    
    def add_cashback(self, amount):
        """
        Add cashback to user's balance.
        """
        if amount <= 0:
            raise ValueError("Cashback amount must be positive")
        self.cashback_balance += Decimal(amount)
        self.save(update_fields=['cashback_balance'])
        
        # Create transaction record
        CashbackTransaction.objects.create(
            user=self,
            amount=amount,
            transaction_type='CREDIT',
            description='Cashback earned from order'
        )
        
        return self.cashback_balance
    
    def use_cashback(self, amount):
        """
        Use cashback from user's balance.
        """
        amount = Decimal(amount)
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        if amount > self.cashback_balance:
            raise ValueError("Insufficient cashback balance")
        
        self.cashback_balance -= amount
        self.save(update_fields=['cashback_balance'])
        
        # Create transaction record
        CashbackTransaction.objects.create(
            user=self,
            amount=amount,
            transaction_type='DEBIT',
            description='Cashback used on order'
        )
        
        return self.cashback_balance


class CashbackTransaction(models.Model):
    """
    Records all cashback transactions (earning and spending).
    """
    TRANSACTION_TYPES = (
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
    )
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='cashback_transactions'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES
    )
    description = models.CharField(max_length=255)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.user.email}"