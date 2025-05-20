"""
This script is meant to be run from the Django shell to remove duplicate quotes.

To use it:
1. Navigate to your Django project directory (where manage.py is)
2. Start the Django shell:
   python manage.py shell
3. Then copy-paste and run the following code:
"""

from django.db.models import Count
from api.models import Quote

# Get all quotes that have duplicate bodies
duplicates = Quote.objects.values('body').annotate(
    count=Count('id')
).filter(count__gt=1).order_by('body')

print(f"Found {len(duplicates)} quotes with duplicates")
total_deleted = 0

# Process each duplicate
for dup in duplicates:
    # Get all quotes with this body text
    quotes_with_body = Quote.objects.filter(body=dup['body']).order_by('created')
    
    # Keep the first one (oldest), delete the rest
    if quotes_with_body.count() > 1:
        original = quotes_with_body.first()
        duplicates_to_delete = quotes_with_body.exclude(id=original.id)
        count = duplicates_to_delete.count()
        
        print(f"Keeping quote ID {original.id} and deleting {count} duplicates with body: {original.body[:50]}...")
        
        # Delete the duplicates
        duplicates_to_delete.delete()
        total_deleted += count

print(f"Complete! Deleted {total_deleted} duplicate quotes.") 