from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import stripe
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem
from products.models import Product, DigitalKey
from .serializers import OrderSerializer, OrderCreateSerializer, OrderKeySerializer
from .tasks import send_order_confirmation_email


# Setup Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class OrderViewSet(viewsets.GenericViewSet):
    """
    API endpoint for order operations.
    """
    queryset = Order.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['retrieve', 'list', 'my_orders']:
            return OrderSerializer
        return OrderKeySerializer
    
    def get_permissions(self):
        if self.action == 'create' or self.action == 'process_payment':
            # Allow anyone to create an order or process payment
            permission_classes = [AllowAny]
        else:
            # All other actions require authentication
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter orders to only show those belonging to the current user.
        Admin users can see all orders.
        """
        user = self.request.user
        
        if user.is_staff:
            return Order.objects.all()
        
        return Order.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """
        Returns a list of orders for the current user.
        """
        queryset = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get a specific order. Either the user's own order or an admin can view.
        Include keys if order is fulfilled.
        """
        order = self.get_object()
        
        # Check if user is authorized to view this order
        if not request.user.is_staff and order.user != request.user:
            if order.is_guest and order.email == request.data.get('email'):
                # Allow guest to view their order with email verification
                pass
            else:
                return Response(
                    {"error": "You do not have permission to view this order."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Use OrderKeySerializer if order is fulfilled, otherwise use OrderSerializer
        if order.is_fulfilled:
            serializer = OrderKeySerializer(order)
        else:
            serializer = OrderSerializer(order)
        
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new order.
        """
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Prepare data for payment processing
        payment_data = self._prepare_payment_data(order)
        
        # Return the order and payment session data
        return Response({
            'order': OrderSerializer(order).data,
            'payment': payment_data
        }, status=status.HTTP_201_CREATED)
    
    def _prepare_payment_data(self, order):
        """
        Prepare payment data based on the selected payment method.
        """
        if order.payment_method == 'STRIPE':
            return self._create_stripe_payment(order)
        elif order.payment_method == 'PAYPAL':
            return self._create_paypal_payment(order)
        elif order.payment_method == 'CASHBACK' and order.total == 0:
            # Order is already paid with cashback
            self._process_cashback_only_payment(order)
            return {'status': 'PAID', 'message': 'Order paid with cashback'}
        
        return {'status': 'ERROR', 'message': 'Invalid payment method'}
    
    def _create_stripe_payment(self, order):
        """
        Create a Stripe payment intent or checkout session.
        """
        try:
            # Create a payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 100),  # Convert to cents
                currency='usd',  # Change according to your currency
                metadata={
                    'order_id': str(order.id),
                    'email': order.email
                }
            )
            
            # Store the payment intent ID with the order
            order.stripe_payment_intent_id = intent.id
            order.status = 'PAYMENT_PROCESSING'
            order.save(update_fields=['stripe_payment_intent_id', 'status'])
            
            return {
                'client_secret': intent.client_secret,
                'payment_method': 'STRIPE',
                'amount': order.total
            }
            
        except stripe.error.StripeError as e:
            # Handle Stripe errors
            return {
                'status': 'ERROR',
                'message': str(e),
                'payment_method': 'STRIPE'
            }
    
    def _create_paypal_payment(self, order):
        """
        Create a PayPal payment.
        In a real implementation, use PayPal SDK to create an order.
        """
        # Placeholder for PayPal implementation
        # In a real scenario, you would use PayPal's SDK
        
        # For now, just return data needed by frontend
        return {
            'order_id': str(order.id),
            'payment_method': 'PAYPAL',
            'amount': float(order.total)
        }
    
    def _process_cashback_only_payment(self, order):
        """
        Process an order that is fully paid with cashback.
        """
        user = order.user
        
        # Deduct cashback from user's balance
        user.use_cashback(order.cashback_used)
        
        # Mark order as paid
        order.mark_as_paid()
        
        # Process order fulfillment
        self._fulfill_order(order)
    
    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        """
        Confirm that payment was successful and fulfill the order.
        This would typically be called after a successful client-side payment.
        """
        order = self.get_object()
        
        # Verify payment (in a real app, this would verify with Stripe/PayPal)
        payment_intent_id = request.data.get('payment_intent_id')
        payment_method = request.data.get('payment_method')
        
        if payment_method == 'STRIPE' and payment_intent_id:
            try:
                # Verify payment intent with Stripe
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                
                # Check if the payment intent belongs to this order
                if intent.metadata.get('order_id') != str(order.id):
                    return Response(
                        {"error": "Payment verification failed."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if payment is successful
                if intent.status != 'succeeded':
                    return Response(
                        {"error": f"Payment not completed. Status: {intent.status}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                # Mark order as paid
                order.mark_as_paid()
                
                # Process the order
                self._fulfill_order(order)
                
                return Response(
                    {"message": "Payment verified and order fulfilled."},
                    status=status.HTTP_200_OK
                )
            
            except stripe.error.StripeError as e:
                return Response(
                    {"error": f"Stripe error: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        elif payment_method == 'PAYPAL':
            # Placeholder for PayPal verification
            # In a real implementation, verify with PayPal API
            
            # For now, just mark as paid
            order.mark_as_paid()
            
            # Process the order
            self._fulfill_order(order)
            
            return Response(
                {"message": "PayPal payment verified and order fulfilled."},
                status=status.HTTP_200_OK
            )
            
        return Response(
            {"error": "Invalid payment verification request."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def _fulfill_order(self, order):
        """
        Fulfill an order by assigning keys and sending confirmation email.
        """
        # Only process if the order is paid but not yet fulfilled
        if not order.is_paid or order.is_fulfilled:
            return False
        
        try:
            # Get all items in the order
            order_items = order.items.all()
            
            # Assign keys for each item
            for item in order_items:
                product = item.product
                quantity = item.quantity
                
                if product.is_external:
                    # For external products, fetch keys from supplier API
                    # This is a placeholder - in a real app, you'd call the supplier API
                    for _ in range(quantity):
                        self._get_external_key(order, product)
                else:
                    # For internal products, assign keys from inventory
                    available_keys = DigitalKey.objects.filter(
                        product=product, 
                        is_sold=False
                    )[:quantity]
                    
                    # Check if we have enough keys
                    if available_keys.count() < quantity:
                        # Not enough keys available
                        # In a real app, you might notify admin and handle this case
                        raise ValueError(f"Not enough keys available for {product.name}")
                    
                    # Mark keys as sold and associate with this order
                    for key in available_keys:
                        key.mark_as_sold(order)
            
            # Mark order as fulfilled
            order.mark_as_fulfilled()
            
            # Add cashback to user's balance if applicable
            if order.cashback_earned > 0 and order.user and not order.is_guest:
                order.add_cashback_to_user()
            
            # Send confirmation email
            send_order_confirmation_email.delay(order.id)
            
            return True
            
        except Exception as e:
            # Log the error and handle accordingly
            print(f"Error fulfilling order {order.id}: {str(e)}")
            return False
    
    def _get_external_key(self, order, product):
        """
        Get a key from external supplier API.
        This is a placeholder - in a real app, you'd call the API.
        """
        # Placeholder for external API call
        # In a real implementation, you would:
        # 1. Call the supplier API
        # 2. Purchase or reserve a key
        # 3. Save the key to your database
        
        # For now, just create a dummy key
        key = DigitalKey.objects.create(
            product=product,
            key_code=f"EXTERNAL-DEMO-KEY-{order.id}-{product.id}",
            is_sold=True,
            sold_at=timezone.now(),
            order=order
        )
        
        return key


class StripeWebhookView(generics.GenericAPIView):
    """
    Endpoint for Stripe webhooks.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            # Verify the webhook signature
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            
            # Handle specific events
            if event['type'] == 'payment_intent.succeeded':
                self._handle_payment_success(event['data']['object'])
            elif event['type'] == 'payment_intent.payment_failed':
                self._handle_payment_failure(event['data']['object'])
            
            return Response(status=status.HTTP_200_OK)
            
        except stripe.error.SignatureVerificationError as e:
            return Response(
                {"error": "Invalid signature"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _handle_payment_success(self, payment_intent):
        """
        Handle successful Stripe payment.
        """
        # Get the order ID from metadata
        order_id = payment_intent.get('metadata', {}).get('order_id')
        
        if not order_id:
            return
        
        try:
            # Find the order
            order = Order.objects.get(id=order_id)
            
            # Only process if the order is not already paid
            if order.is_paid:
                return
            
            # Update order status
            order.mark_as_paid()
            
            # Fulfill the order (assign keys, send email)
            order_view = OrderViewSet()
            order_view._fulfill_order(order)
            
        except Order.DoesNotExist:
            # Order not found - log this event
            print(f"Webhook error: Order {order_id} not found")
    
    def _handle_payment_failure(self, payment_intent):
        """
        Handle failed Stripe payment.
        """
        # Get the order ID from metadata
        order_id = payment_intent.get('metadata', {}).get('order_id')
        
        if not order_id:
            return
        
        try:
            # Find the order
            order = Order.objects.get(id=order_id)
            
            # Update order status to failed
            order.status = 'FAILED'
            order.save(update_fields=['status'])
            
            # You might want to notify the customer here
            
        except Order.DoesNotExist:
            # Order not found - log this event
            print(f"Webhook error: Order {order_id} not found")