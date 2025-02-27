from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import Order


@shared_task
def send_order_confirmation_email(order_id):
    """
    Send an email with order confirmation and the purchased digital keys.
    """
    try:
        # Get the order
        order = Order.objects.get(id=order_id)
        
        # Get purchased keys
        purchased_keys = order.purchased_keys.all()
        
        # Prepare context for the email template
        context = {
            'order': order,
            'items': order.items.all(),
            'keys': purchased_keys,
            'site_name': settings.SITE_NAME,
            'site_url': settings.SITE_URL,
        }
        
        # Render the HTML content
        html_content = render_to_string('emails/order_confirmation.html', context)
        text_content = strip_tags(html_content)
        
        # Create the email
        subject = f'Your Order Confirmation #{order.id}'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = order.email
        
        # Create and send the email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send()
        
        return f"Order confirmation email sent for order {order_id}"
    
    except Order.DoesNotExist:
        return f"Error: Order {order_id} not found"
    
    except Exception as e:
        return f"Error sending confirmation email for order {order_id}: {str(e)}"


@shared_task
def sync_external_products():
    """
    Sync product inventory from external supplier APIs.
    This would be scheduled to run periodically.
    """
    # This is a placeholder function where you'd implement the logic
    # to sync with external APIs like Kinguin or CodesWholesale
    
    # Example implementation steps:
    # 1. Get all active suppliers
    # 2. For each supplier, call their API to get product updates
    # 3. Update existing products and add new ones
    # 4. Update prices and availability
    
    return "Product sync completed"