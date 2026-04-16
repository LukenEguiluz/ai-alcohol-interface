"""Permisos y alcance por proyecto (bajo coste: sin dependencias extra)."""

GRUPO_ADMIN_PROYECTOS = 'Administrador de proyectos'

VIEW_AS_ALLOWED = frozenset({
    'Administrador',
    'Administrador de proyectos',
    'Doctor',
    'Residente',
    'Psicologo',
    'Otro',
})


def simulated_role(request):
    """Rol simulado (solo superuser + header); None si no aplica."""
    if not request:
        return None
    return getattr(request, 'view_as_role', None)


def es_administrador(request) -> bool:
    """Gestión de plataforma: superusuario, Administrador o Administrador de proyectos (salvo simulación)."""
    va = simulated_role(request)
    if va is not None:
        return va in ('Administrador', GRUPO_ADMIN_PROYECTOS)
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name__in=('Administrador', GRUPO_ADMIN_PROYECTOS)).exists()


def es_admin_proyectos_globales(request) -> bool:
    """Ver y editar todos los proyectos (salvo simulación)."""
    va = simulated_role(request)
    if va is not None:
        return va == GRUPO_ADMIN_PROYECTOS
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name=GRUPO_ADMIN_PROYECTOS).exists()


def ids_proyectos_usuario(request):
    """None = acceso a todos los proyectos. Lista vacía = sin proyectos asignados."""
    if es_admin_proyectos_globales(request):
        return None
    user = request.user
    if not user.is_authenticated:
        return []
    return list(
        user.proyectos_asignados.filter(activo=True).values_list('id', flat=True),
    )


def puede_usar_proyecto(request, proyecto_id: int) -> bool:
    ids = ids_proyectos_usuario(request)
    if ids is None:
        return True
    return int(proyecto_id) in ids
