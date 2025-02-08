from django.contrib import admin
from .models import (
    User, Author, Book, Tag, Quote, QuoteTag,
    QuoteGroup, QuoteGroupMembership, QuoteGroupShare,
    QuoteList, QuoteListQuote, Document, ImportLog
)

admin.site.register(User)
admin.site.register(Author)
admin.site.register(Book)
admin.site.register(Tag)
admin.site.register(Quote)
admin.site.register(QuoteTag)
admin.site.register(QuoteGroup)
admin.site.register(QuoteGroupMembership)
admin.site.register(QuoteGroupShare)
admin.site.register(QuoteList)
admin.site.register(QuoteListQuote)
admin.site.register(Document)
admin.site.register(ImportLog)
