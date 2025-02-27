from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product, DigitalKey


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    platform = serializers.CharField(source='product.platform.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_image', 
            'platform', 'price', 'quantity', 'item_total'
        ]
        read_only_fields = ['id', 'product_name', 'product_image', 'platform', 'item_total']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order details."""
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'email', 'status', 'payment_method', 
            'subtotal', 'cashback_used', 'total', 'cashback_earned',
            'created_at', 'paid_at', 'fulfilled_at', 'items',
            'is_paid', 'is_fulfilled', 'is_guest'
        ]
        read_only_fields = fields


class OrderKeySerializer(serializers.ModelSerializer):
    """Serializer for order with digital keys."""
    items = OrderItemSerializer(many=True, read_only=True)
    keys = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'email', 'status', 'payment_method', 
            'subtotal', 'cashback_used', 'total', 'cashback_earned',
            'created_at', 'paid_at', 'fulfilled_at', 'items', 'keys',
            'is_paid', 'is_fulfilled', 'is_guest'
        ]
        read_only_fields = fields
    
    def get_keys(self, obj):
        """Get the digital keys for this order if fulfilled."""
        if obj.is_fulfilled:
            keys = DigitalKey.objects.filter(order=obj)
            return [
                {
                    'id': key.id,
                    'product_name': key.product.name,
                    'key_code': key.key_code,
                    'platform': key.product.platform.name,
                    'sold_at': key.sold_at
                }
                for key in keys
            ]
        return []


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for order creation."""
    email = serializers.EmailField()
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            allow_empty=False
        )
    )
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    use_cashback = serializers.BooleanField(default=False)
    
    def validate_items(self, value):
        """Validate that items are valid product IDs."""
        validated_items = []
        
        for item_data in value:
            if 'product_id' not in item_data or 'quantity' not in item_data:
                raise serializers.ValidationError("Each item must have product_id and quantity.")
            
            product_id = item_data['product_id']
            quantity = item_data['quantity']
            
            if quantity < 1:
                raise serializers.ValidationError(f"Quantity must be positive for product {product_id}.")
            
            try:
                product = Product.objects.get(id=product_id, is_active=True)
                
                # Check if product is in stock
                if not product.in_stock:
                    raise serializers.ValidationError(f"Product {product.name} is out of stock.")
                
                # Check if enough keys are available
                if not product.is_external and product.available_keys_count < quantity:
                    raise serializers.ValidationError(
                        f"Not enough keys available for {product.name}. "
                        f"Only {product.available_keys_count} left."
                    )
                
                validated_items.append({
                    'product': product,
                    'quantity': quantity,
                    'price': product.current_price,
                })
                
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID {product_id} does not exist.")
        
        if not validated_items:
            raise serializers.ValidationError("At least one item is required.")
        
        return validated_items
    
    def validate(self, data):
        """Validate the entire order."""
        # Get the user from context, if authenticated
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        
        # Validate cashback usage
        if data.get('use_cashback') and not user:
            raise serializers.ValidationError(
                {"use_cashback": "You must be logged in to use cashback."}
            )
        
        # Add user to validated data, or mark as guest
        data['user'] = user
        data['is_guest'] = user is None
        
        # Add IP address for fraud prevention 
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                data['ip_address'] = x_forwarded_for.split(',')[0]
            else:
                data['ip_address'] = request.META.get('REMOTE_ADDR')
        
        return data
    
    def create(self, validated_data):
        """Create and return a new order."""
        user = validated_data.get('user')
        email = validated_data.get('email')
        is_guest = validated_data.get('is_guest', True)
        payment_method = validated_data.get('payment_method')
        items = validated_data.get('items', [])
        use_cashback = validated_data.get('use_cashback', False)
        ip_address = validated_data.get('ip_address')
        
        # Create the order
        order = Order.objects.create(
            user=user,
            email=email,
            is_guest=is_guest,
            payment_method=payment_method,
            subtotal=0,  # Will calculate after adding items
            total=0,     # Will calculate after adding items
            ip_address=ip_address,
            status='PENDING'
        )
        
        # Add items to order
        for item in items:
            OrderItem.objects.create(
                order=order,
                product=item['product'],
                price=item['price'],
                quantity=item['quantity']
            )
        
        # Calculate order total
        order.calculate_total()
        
        # Apply cashback if user requested and has available balance
        if use_cashback and user and user.cashback_balance > 0:
            # Use the minimum of: available cashback or order total
            cashback_to_use = min(user.cashback_balance, order.total)
            
            if cashback_to_use > 0:
                order.cashback_used = cashback_to_use
                order.calculate_total()  # Recalculate with cashback applied
        
        # Calculate potential cashback earned from this order
        order.calculate_cashback()
        
        return order