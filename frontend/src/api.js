// En Docker (proxy nginx): VITE_API_BASE=/api, VITE_MEDIA_BASE vacío (mismo origen)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';
const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE ?? (import.meta.env.VITE_API_BASE ? '' : 'http://127.0.0.1:8000');

const STORAGE_VIEW_AS = 'ai-alcohol-view-as';

/** Construye la URL absoluta del archivo de media (video/audio). */
export function getMediaUrl(archivoPath) {
  if (!archivoPath) return '';
  if (archivoPath.startsWith('http')) return archivoPath;
  const path = archivoPath.startsWith('/') ? archivoPath : `/${archivoPath}`;
  return MEDIA_BASE ? `${MEDIA_BASE}${path}` : path;
}

let onUnauthorized = null;

export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

function getToken() {
  return localStorage.getItem('access');
}

/** Rol simulado (solo superuser); cadena vacía = vista normal. */
export function getViewAsRole() {
  try {
    return localStorage.getItem(STORAGE_VIEW_AS) || '';
  } catch {
    return '';
  }
}

export function setViewAsRole(role) {
  try {
    if (!role || role === 'Superusuario') {
      localStorage.removeItem(STORAGE_VIEW_AS);
    } else {
      localStorage.setItem(STORAGE_VIEW_AS, role);
    }
  } catch {
    /* ignore */
  }
}

export function authHeaders(extra = {}) {
  const token = getToken();
  const h = { ...extra };
  if (token) h.Authorization = `Bearer ${token}`;
  const va = getViewAsRole();
  if (va) h['X-View-As-Role'] = va;
  return h;
}

async function handleResponse(res) {
  if (res.status === 401) {
    onUnauthorized?.();
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Sesión expirada. Inicia sesión de nuevo.');
  }
}

function unwrapList(data) {
  if (data && Array.isArray(data.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  qs.set('page_size', String(params.page_size ?? 200));
  if (params.proyecto != null && params.proyecto !== '' && params.proyecto !== 'all') {
    qs.set('proyecto', String(params.proyecto));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Error al iniciar sesión');
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me/`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al cargar perfil');
  }
  return res.json();
}

export const ROLES = [
  'Administrador',
  'Administrador de proyectos',
  'Doctor',
  'Residente',
  'Psicologo',
  'Otro',
];

export async function getUsers(params = {}) {
  const qs = new URLSearchParams();
  qs.set('page_size', String(params.page_size ?? 500));
  const q = qs.toString();
  const res = await fetch(`${API_BASE}/auth/users/${q ? `?${q}` : ''}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await handleResponse(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Error al cargar usuarios');
  }
  return unwrapList(await res.json());
}

export async function patchUser(userId, body) {
  const res = await fetch(`${API_BASE}/auth/users/${userId}/`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    await handleResponse(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || JSON.stringify(err) || 'Error al actualizar usuario');
  }
  return res.json();
}

export async function createUser(username, password, email = '', role = 'Otro', proyectoIds = []) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ username, password, email, role, proyecto_ids: proyectoIds }),
  });
  if (!res.ok) {
    await handleResponse(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear usuario');
  }
  return res.json();
}

export async function getProyectos() {
  const res = await fetch(`${API_BASE}/proyectos/${buildQuery({ page_size: 500 })}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al cargar proyectos');
  }
  return unwrapList(await res.json());
}

export async function createProyecto({ nombre, hospital_nombre, especialidad_nombre }) {
  const res = await fetch(`${API_BASE}/proyectos/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      nombre,
      hospital_nombre: hospital_nombre || '—',
      especialidad_nombre: especialidad_nombre || '—',
    }),
  });
  if (!res.ok) {
    await handleResponse(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.nombre?.[0] || JSON.stringify(err) || 'Error al crear proyecto');
  }
  return res.json();
}

export async function getPacientes(params = {}) {
  const res = await fetch(`${API_BASE}/pacientes/${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al cargar pacientes');
  }
  return unwrapList(await res.json());
}

export async function createPaciente(data) {
  const res = await fetch(`${API_BASE}/pacientes/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleResponse(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.nombre?.[0] || JSON.stringify(err) || 'Error al crear paciente');
  }
  return res.json();
}

export async function updatePaciente(id, data) {
  const res = await fetch(`${API_BASE}/pacientes/${id}/`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al actualizar paciente');
  }
  return res.json();
}

export async function deletePaciente(id) {
  const res = await fetch(`${API_BASE}/pacientes/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) await handleResponse(res);
}

export async function getVideos(params = {}) {
  const res = await fetch(`${API_BASE}/videos/${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al cargar videos');
  }
  return unwrapList(await res.json());
}

export async function uploadVideo(pacienteId, file, notas = '') {
  const form = new FormData();
  form.append('paciente', pacienteId);
  form.append('archivo', file);
  if (notas) form.append('notas', notas);
  const res = await fetch(`${API_BASE}/videos/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    await handleResponse(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Error al subir video');
  }
  return res.json();
}

/** Descarga un .zip con la base de datos y todos los archivos (solo administradores). */
export async function downloadBackup() {
  const res = await fetch(`${API_BASE}/backup/`, {
    headers: authHeaders(),
  });
  await handleResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Error al generar la copia de seguridad');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition && disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : `ai-alcohol-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
