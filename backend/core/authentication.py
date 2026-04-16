from rest_framework_simplejwt.authentication import JWTAuthentication

from .access import VIEW_AS_ALLOWED


class ViewAsRoleJWTAuthentication(JWTAuthentication):
    """Superusuarios pueden enviar X-View-As-Role para simular otro rol en permisos y payload de /auth/me/."""

    def authenticate(self, request):
        request.view_as_role = None
        result = super().authenticate(request)
        if result is None:
            return None
        user, validated_token = result
        if getattr(user, 'is_superuser', False):
            raw = (request.META.get('HTTP_X_VIEW_AS_ROLE') or '').strip()
            if raw and raw.lower() not in ('superuser', 'none', ''):
                if raw in VIEW_AS_ALLOWED:
                    request.view_as_role = raw
        return user, validated_token
