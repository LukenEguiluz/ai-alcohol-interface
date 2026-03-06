const API_BASE = 'http://127.0.0.1:8000/api';
const MEDIA_BASE = 'http://127.0.0.1:8000';

/** Construye la URL absoluta del archivo de media (video/audio). */
export function getMediaUrl(archivoPath) {
  if (!archivoPath) return '';
  if (archivoPath.startsWith('http')) return archivoPath;
  const path = archivoPath.startsWith('/') ? archivoPath : `/${archivoPath}`;
  return `${MEDIA_BASE}${path}`;
}

let onUnauthorized = null;

export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

function getToken() {
  return localStorage.getItem('access');
}

async function handleResponse(res) {
  if (res.status === 401) {
    onUnauthorized?.();
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Sesión expirada. Inicia sesión de nuevo.');
  }
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

export const ROLES = ['Administrador', 'Doctor', 'Residente', 'Psicologo', 'Otro'];

export async function createUser(username, password, email = '', role = 'Otro') {
  const token = getToken();
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ username, password, email, role }),
  });
  if (!res.ok) {
    await handleResponse(res);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear usuario');
  }
  return res.json();
}

export async function getPacientes() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/pacientes/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al cargar pacientes');
  }
  return res.json();
}

export async function createPaciente(data) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/pacientes/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  const token = getToken();
  const res = await fetch(`${API_BASE}/pacientes/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al actualizar paciente');
  }
  return res.json();
}

export async function deletePaciente(id) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/pacientes/${id}/`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) await handleResponse(res);
}

export async function getVideos() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/videos/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    await handleResponse(res);
    throw new Error('Error al cargar videos');
  }
  return res.json();
}

export async function uploadVideo(pacienteId, file, notas = '') {
  const token = getToken();
  const form = new FormData();
  form.append('paciente', pacienteId);
  form.append('archivo', file);
  if (notas) form.append('notas', notas);
  const res = await fetch(`${API_BASE}/videos/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  const token = getToken();
  const res = await fetch(`${API_BASE}/backup/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
