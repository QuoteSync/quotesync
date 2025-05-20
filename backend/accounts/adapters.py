from allauth.account.adapter import DefaultAccountAdapter

class CustomHeadlessAdapter(DefaultAccountAdapter):
    def get_user_data(self, user):
        data = super().get_user_data(user)
        # Add subscription_type to the user data
        data['subscription_type'] = user.subscription_type
        return data

    def serialize_user(self, user):
        """Serialize user data for the session response."""
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'subscription_type': user.subscription_type
        }
        return data 