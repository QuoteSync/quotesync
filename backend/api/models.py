# models.py
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser


# -------------------------------------------------------------------------
# Custom User Model
# -------------------------------------------------------------------------

class User(AbstractUser):
    """
    Custom user model.
    The corresponding SQL table will be named "users" with columns for username,
    email, password, first_name, last_name, is_active, is_staff, is_superuser,
    date_joined, last_login, etc.
    """
    username = models.CharField(max_length=150, unique=True, help_text="Nombre de usuario")
    email = models.EmailField(unique=True, help_text="Dirección de correo electrónico")
    first_name = models.CharField(max_length=30, blank=True, help_text="Nombre")
    last_name = models.CharField(max_length=150, blank=True, help_text="Apellido")
    avatar = models.URLField(
        blank=True, 
        null=True, 
        default="https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png",
        help_text="URL del avatar del usuario"
    )
    bio = models.TextField(blank=True, null=True, help_text="Biografía del usuario")
    location = models.CharField(max_length=100, blank=True, null=True, help_text="Ubicación del usuario")
    website = models.URLField(blank=True, null=True, help_text="Sitio web del usuario")
    twitter = models.CharField(max_length=50, blank=True, null=True, help_text="Usuario de Twitter")
    github = models.CharField(max_length=50, blank=True, null=True, help_text="Usuario de GitHub")
    SUBSCRIPTION_CHOICES = [
        ('free', 'Free'),
        ('reader', 'Reader'),
        ('scholar', 'Scholar'),
    ]
    
    subscription_type = models.CharField(
        max_length=10,
        choices=SUBSCRIPTION_CHOICES,
        default='free'
    )

    def __str__(self):
        return f"{self.username}"

    class Meta:
        db_table = 'users'
        ordering = ('username',)


# -------------------------------------------------------------------------
# Core Models: Author, Book, Tag, and Quote
# -------------------------------------------------------------------------

class Author(models.Model):
    name = models.CharField(max_length=1024, unique=True, help_text="Nombre del autor")
    cover = models.URLField(
        blank=True,
        null=True,
        default="https://media.briantracy.com/blog/wp-content/uploads/2021/12/03083020/how-to-become-an-author.jpg",
        help_text="URL de la foto del autor"
    )
    bio = models.TextField(blank=True, null=True, help_text="Biografía del autor")
    is_favorite = models.BooleanField(default=False, help_text="Indica si el autor está marcado como favorito")
    gradient_primary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Color primario para el gradiente de la imagen del autor")
    gradient_secondary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Color secundario para el gradiente de la imagen del autor")

    def __str__(self):
        return self.name

    class Meta:
        ordering = ('-is_favorite', 'name')
        db_table = 'authors'


class Book(models.Model):
    title = models.CharField(max_length=1024, unique=True, help_text="Título del libro")
    author = models.ForeignKey(
        Author,
        blank=True,
        null=True,
        related_name="books",
        on_delete=models.SET_NULL,
        help_text="Autor del libro"
    )
    cover = models.URLField(blank=True, null=True, help_text="URL de la portada del libro", default="https://media.briantracy.com/blog/wp-content/uploads/2021/12/03083020/how-to-become-an-author.jpg")
    description = models.TextField(blank=True, null=True, help_text="Descripción del libro")
    published = models.DateField(blank=True, null=True, help_text="Fecha de publicación")
    isbn = models.CharField(max_length=13, blank=True, null=True, help_text="ISBN del libro")
    pages = models.PositiveIntegerField(blank=True, null=True, help_text="Número de páginas")
    publisher = models.CharField(max_length=1024, blank=True, null=True, help_text="Editorial")
    language = models.CharField(max_length=50, blank=True, null=True, help_text="Idioma")
    gradient_primary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Color primario para el gradiente de la portada")
    gradient_secondary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Color secundario para el gradiente de la portada")
    created = models.DateTimeField(auto_now_add=True, help_text="Fecha de creación")
    updated = models.DateTimeField(auto_now=True, help_text="Fecha de última actualización")
    is_favorite = models.BooleanField(default=False, help_text="Indica si el libro está marcado como favorito")

    def __str__(self):
        return "{} ({})".format(self.title, self.author)

    class Meta:
        ordering = ('-is_favorite', 'title')
        db_table = 'books'


class Tag(models.Model):
    title = models.SlugField(max_length=100, unique=True, help_text="Título de la etiqueta")
    description = models.CharField(max_length=1024, blank=True, null=True, help_text="Descripción de la etiqueta")
    is_favorite = models.BooleanField(default=False, help_text="Indica si la etiqueta está marcada como favorita")
    gradient_primary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Color primario para el gradiente de la etiqueta")
    gradient_secondary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Color secundario para el gradiente de la etiqueta")

    class Meta:
        ordering = ('-is_favorite', 'title')
        db_table = 'tags'

    def __str__(self):
        return self.title


class Quote(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="quotes",
        on_delete=models.CASCADE,
        help_text="Propietario de la cita"
    )
    title = models.CharField(max_length=1024, help_text="Título de la cita")
    body = models.TextField(blank=True, null=True, help_text="Contenido de la cita")
    archive = models.BooleanField(default=False, help_text="Indicador de archivado")
    created = models.DateField(auto_now_add=True, help_text="Fecha de creación")
    updated = models.DateField(auto_now=True, help_text="Fecha de última actualización")
    hash = models.SlugField(blank=True, null=True, help_text="Hash para evitar duplicados")
    book = models.ForeignKey(
        Book,
        blank=True,
        null=True,
        related_name="quotes",
        on_delete=models.SET_NULL,
        help_text="Libro de origen"
    )
    location = models.CharField(max_length=256, blank=True, null=True,
                                help_text="Ubicación en el libro (página, posición, etc.)")
    source_platform = models.CharField(max_length=50, blank=True, null=True,
                                       help_text="Plataforma de origen (Kindle, Google Books, Apple Books)")
    is_favorite = models.BooleanField(default=False, help_text="Indica si la cita está marcada como favorita")
    chapter = models.CharField(max_length=200, blank=True, null=True,
                              help_text="Capítulo del libro al que pertenece la cita")
    book_url = models.URLField(blank=True, null=True, help_text="URL al libro en plataformas externas (Google Books, etc.)")

    # Many-to-many relation to Tag. Django will auto-create the join table
    # but we also provide an explicit through model if you want more control.
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name="quotes",
        help_text="Etiquetas asociadas",
        through='QuoteTag'
    )

    def save(self, *args, **kwargs):
        # Compute a simple hash based on the body (or any other unique logic)
        self.hash = str(hash(self.body))
        super().save(*args, **kwargs)

    def __str__(self):
        return "{} [{}]".format(self.title, self.book)

    class Meta:
        ordering = ('-is_favorite', 'created', 'title')
        db_table = 'quotes'


# Optionally, if you want to control the join table for Quote-Tag relation explicitly:
class QuoteTag(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = 'quote_tags'
        unique_together = ('quote', 'tag')

    def __str__(self):
        return f"{self.quote} - {self.tag}"


# -------------------------------------------------------------------------
# Models for Groups, Group Memberships, and Group Sharing
# -------------------------------------------------------------------------

class QuoteGroup(models.Model):
    name = models.CharField(max_length=255, unique=True, help_text="Nombre del grupo")
    description = models.TextField(blank=True, null=True, help_text="Descripción del grupo")
    created = models.DateTimeField(auto_now_add=True, help_text="Fecha de creación del grupo")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_groups",
        on_delete=models.CASCADE,
        help_text="Creador del grupo"
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='QuoteGroupMembership',
        related_name="quote_groups",
        help_text="Miembros del grupo"
    )

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'quote_groups'


class QuoteGroupMembership(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('editor', 'Editor'),
        ('reader', 'Lector'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    group = models.ForeignKey(QuoteGroup, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, help_text="Rol del usuario en el grupo")
    joined = models.DateTimeField(auto_now_add=True, help_text="Fecha en la que el usuario se unió al grupo")

    class Meta:
        unique_together = ('user', 'group')
        db_table = 'quote_group_memberships'

    def __str__(self):
        return "{} en {} como {}".format(self.user, self.group, self.get_role_display())


class QuoteGroupShare(models.Model):
    PERMISSION_CHOICES = (
        ('read', 'Solo lectura'),
        ('edit', 'Edición'),
    )
    quote = models.ForeignKey(Quote, related_name="group_shares", on_delete=models.CASCADE)
    group = models.ForeignKey(QuoteGroup, related_name="quote_shares", on_delete=models.CASCADE)
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, help_text="Permiso de acceso en el grupo")
    shared_at = models.DateTimeField(auto_now_add=True, help_text="Fecha de compartición")

    class Meta:
        unique_together = ('quote', 'group')
        db_table = 'quote_group_shares'

    def __str__(self):
        return "La cita '{}' se compartió con el grupo '{}' como {}".format(
            self.quote, self.group, self.get_permission_display()
        )


# -------------------------------------------------------------------------
# Models for Thematic Quote Lists (Playlists)
# -------------------------------------------------------------------------

class QuoteList(models.Model):
    VISIBILITY_CHOICES = (
        ('private', 'Privada'),
        ('public', 'Pública'),
        ('group', 'Grupo'),
    )
    title = models.CharField(max_length=1024, help_text="Título de la lista")
    description = models.TextField(blank=True, null=True, help_text="Descripción de la lista")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="quote_lists",
        on_delete=models.CASCADE,
        help_text="Propietario de la lista"
    )
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private',
                                  help_text="Nivel de visibilidad de la lista")
    group = models.ForeignKey(
        QuoteGroup,
        blank=True,
        null=True,
        related_name="quote_lists",
        on_delete=models.SET_NULL,
        help_text="Grupo asociado (si es lista de grupo)"
    )
    quotes = models.ManyToManyField(
        Quote,
        blank=True,
        related_name="lists",
        help_text="Citas incluidas en la lista"
    )
    created = models.DateTimeField(auto_now_add=True, help_text="Fecha de creación de la lista")
    updated = models.DateTimeField(auto_now=True, help_text="Fecha de actualización de la lista")

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'quote_lists'


# If you wish to explicitly control the join table for QuoteList<->Quote relationship:
class QuoteListQuote(models.Model):
    quote_list = models.ForeignKey(QuoteList, on_delete=models.CASCADE)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('quote_list', 'quote')
        db_table = 'quote_list_quotes'

    def __str__(self):
        return f"Lista: {self.quote_list} - Cita: {self.quote}"


# -------------------------------------------------------------------------
# Models for Document Uploads and Import Logs
# -------------------------------------------------------------------------

class Document(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="documents",
        on_delete=models.CASCADE,
        help_text="Propietario del documento"
    )
    file = models.FileField(upload_to='documents/', help_text="Archivo del documento")
    title = models.CharField(max_length=1024, blank=True, null=True, help_text="Título del documento")
    uploaded_at = models.DateTimeField(auto_now_add=True, help_text="Fecha de subida")
    processed = models.BooleanField(default=False, help_text="Indicador de si el documento ya fue procesado")

    def __str__(self):
        return self.title or self.file.name

    class Meta:
        db_table = 'documents'


class ImportLog(models.Model):
    PLATFORM_CHOICES = (
        ('kindle', 'Kindle'),
        ('google_books', 'Google Books'),
        ('google_books_batch', 'Google Books (Batch)'),
        ('apple_books', 'Apple Books'),
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="import_logs",
        on_delete=models.CASCADE,
        help_text="Usuario que realizó la importación"
    )
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES, help_text="Plataforma de origen")
    file = models.FileField(upload_to='imports/', help_text="Archivo importado")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Fecha de importación")
    status = models.CharField(max_length=50, default='pending', help_text="Estado de la importación")
    quotes_added = models.IntegerField(default=0, help_text="Número de citas realmente añadidas durante esta importación")
    duplicates_skipped = models.IntegerField(default=0, help_text="Número de citas duplicadas omitidas durante esta importación")

    def save(self, *args, **kwargs):
        # No puede haber el mismo número de citas añadidas y duplicados (si todas son duplicadas, entonces quotes_added = 0)
        if self.duplicates_skipped > 0 and self.duplicates_skipped == self.quotes_added:
            self.quotes_added = 0
        super().save(*args, **kwargs)

    def __str__(self):
        return "Importación de {} el {}".format(self.platform, self.created_at)

    class Meta:
        db_table = 'import_logs'


# -------------------------------------------------------------------------
# Model for Quote Notes (Comments)
# -------------------------------------------------------------------------

class QuoteNote(models.Model):
    quote = models.ForeignKey(
        Quote,
        related_name="notes",
        on_delete=models.CASCADE,
        help_text="Cita a la que pertenece la nota"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="quote_notes",
        on_delete=models.CASCADE,
        help_text="Usuario que creó la nota"
    )
    content = models.TextField(help_text="Contenido de la nota")
    created = models.DateTimeField(auto_now_add=True, help_text="Fecha de creación")
    updated = models.DateTimeField(auto_now=True, help_text="Fecha de última actualización")
    is_private = models.BooleanField(default=False, help_text="Indica si la nota es privada o visible para otros usuarios")

    def __str__(self):
        return f"Nota de {self.user} en {self.quote.title}"

    class Meta:
        ordering = ('created',)
        db_table = 'quote_notes'


# Add a UserGoals model to store user goals
class UserGoals(models.Model):
    """
    Stores goals for users.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="goals",
        help_text="User who owns these goals"
    )
    quotes_goal = models.PositiveIntegerField(default=100, help_text="Target number of quotes to collect")
    books_goal = models.PositiveIntegerField(default=30, help_text="Target number of books to read")
    authors_goal = models.PositiveIntegerField(default=20, help_text="Target number of authors to explore")
    created = models.DateTimeField(auto_now_add=True, help_text="When these goals were created")
    updated = models.DateTimeField(auto_now=True, help_text="When these goals were last updated")

    def __str__(self):
        return f"{self.user.username}'s Goals"

    class Meta:
        db_table = 'user_goals'
        verbose_name = 'User Goals'
        verbose_name_plural = 'User Goals'
