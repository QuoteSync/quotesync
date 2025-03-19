from django import forms

class CustomSignupForm(forms.Form):
    email = forms.EmailField(label="Email", required=True)
    password1 = forms.CharField(
        widget=forms.PasswordInput,
        label="Password",
        required=True
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput,
        label="Confirm Password",
        required=True
    )
    first_name = forms.CharField(max_length=30, label="First Name", required=True)
    last_name = forms.CharField(max_length=30, label="Last Name", required=True)

    def clean(self):
        cleaned_data = super().clean()
        p1 = cleaned_data.get("password1")
        p2 = cleaned_data.get("password2")
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Passwords do not match")
        return cleaned_data

    def signup(self, request, user):
        """
        Este método es llamado por django-allauth para completar el registro.
        Se asignan los valores validados al usuario.
        Se espera que allauth ya haya creado al usuario y establecido la contraseña
        (usando el valor de password1) mediante el adapter.
        """
        user.email = self.cleaned_data["email"]
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.save()
