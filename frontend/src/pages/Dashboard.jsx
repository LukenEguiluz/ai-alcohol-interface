import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  List,
  ListItemButton,
  Container,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
  InputAdornment,
  BottomNavigation,
  BottomNavigationAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Collapse,
  useMediaQuery,
  useTheme,
  Divider,
  OutlinedInput,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import FolderSpecialOutlinedIcon from '@mui/icons-material/FolderSpecialOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import { useAuth } from '../context/AuthContext';
import PacienteForm from '../components/PacienteForm';
import { useThemeMode } from '../context/ThemeContext';
import {
  getPacientes,
  createPaciente,
  updatePaciente,
  deletePaciente,
  getVideos,
  uploadVideo,
  getMediaUrl,
  downloadBackup,
  createUser,
  getUsers,
  patchUser,
  getProyectos,
  createProyecto,
  getViewAsRole,
  setViewAsRole,
  ROLES,
} from '../api';

const DRAWER_WIDTH = 256;
const VIEW_AS_OPTIONS = ['Superusuario', ...ROLES];
const STORAGE_PROYECTO = 'ai-alcohol-proyecto-filtro';

const SEXO_OPCIONES = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
];
const CHILD_PUGH_OPCIONES = [
  { value: '', label: '—' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

const INIT_PACIENTE = {
  proyecto: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  sexo: 'M',
  edad: '',
  child_pugh: '',
  tiene_tx: false,
  puntaje_phes: '',
  puntaje_flicker: '',
  saludable: false,
  tiene_cirrosis: false,
  tiene_ehm: false,
};

const INIT_USUARIO = { username: '', password: '', email: '', role: 'Otro', proyectoIds: [] };
const INIT_EDIT_USUARIO = { email: '', password: '', role: 'Otro', proyectoIds: [] };
const INIT_NUEVO_PROYECTO = { nombre: '', hospital_nombre: '', especialidad_nombre: '' };

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, refreshUser } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [pacientes, setPacientes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [proyectosDisponibles, setProyectosDisponibles] = useState([]);
  const [proyectoFiltro, setProyectoFiltro] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_PROYECTO) || '';
    } catch {
      return '';
    }
  });
  const [form, setForm] = useState(INIT_PACIENTE);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [userForm, setUserForm] = useState(INIT_USUARIO);
  const [creatingUser, setCreatingUser] = useState(false);
  const [section, setSection] = useState('list');
  const [anchorEl, setAnchorEl] = useState(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState(INIT_NUEVO_PROYECTO);
  const [creatingProject, setCreatingProject] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserRow, setEditUserRow] = useState(null);
  const [editUserForm, setEditUserForm] = useState(INIT_EDIT_USUARIO);
  const [savingUser, setSavingUser] = useState(false);
  const [newPacienteForUpload, setNewPacienteForUpload] = useState(null);
  const [expandedVerPacienteId, setExpandedVerPacienteId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterSexo, setFilterSexo] = useState('');
  const [filterChildPugh, setFilterChildPugh] = useState('');
  const [filterConArchivo, setFilterConArchivo] = useState('');
  const [filterTieneTx, setFilterTieneTx] = useState('');
  const [filterSaludable, setFilterSaludable] = useState('');
  const [filterCirrosis, setFilterCirrosis] = useState('');
  const [filterEhm, setFilterEhm] = useState('');
  const [filterEdadMin, setFilterEdadMin] = useState('');
  const [filterEdadMax, setFilterEdadMax] = useState('');

  /** Usuarios, backup, borrar pacientes (Administrador, Administrador de proyectos o staff). */
  const puedeAdminPlataforma =
    user?.puede_administrar_plataforma ??
    (user?.role === 'Administrador' ||
      user?.role === 'Administrador de proyectos' ||
      user?.is_staff === true);
  /** Ver todos los proyectos, filtro «Todos», crear/editar proyectos (superuser o Administrador de proyectos). */
  const puedeEditarProyectosGlobales = Boolean(user?.todos_los_proyectos);

  const opcionesProyectoForm = useMemo(() => {
    if (puedeEditarProyectosGlobales) return proyectosDisponibles;
    return user?.proyectos || [];
  }, [user, proyectosDisponibles]);

  const showProyectoSelector = Boolean(
    puedeEditarProyectosGlobales || (user?.proyectos && user.proyectos.length > 1),
  );

  const proyectoLocked = opcionesProyectoForm.length === 1;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROYECTO, proyectoFiltro);
    } catch {
      /* ignore */
    }
  }, [proyectoFiltro]);

  useEffect(() => {
    if (!puedeEditarProyectosGlobales && user?.proyectos?.length === 1) {
      setProyectoFiltro(String(user.proyectos[0].id));
    }
  }, [user?.id, puedeEditarProyectosGlobales, user?.proyectos]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      try {
        if (puedeEditarProyectosGlobales) {
          const list = await getProyectos();
          if (!cancelled) setProyectosDisponibles(list);
        } else if (!cancelled) {
          setProyectosDisponibles(user.proyectos || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, puedeEditarProyectosGlobales]);

  const pacienteHasFile = (pacienteId) => videos.some((v) => v.paciente === pacienteId);

  const filteredPacientes = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return pacientes.filter((p) => {
      if (q) {
        const fullName = `${p.nombre} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.toLowerCase();
        if (!fullName.includes(q)) return false;
      }
      if (filterSexo && p.sexo !== filterSexo) return false;
      if (filterChildPugh && p.child_pugh !== filterChildPugh) return false;
      const hasFile = pacienteHasFile(p.id);
      if (filterConArchivo === 'si' && !hasFile) return false;
      if (filterConArchivo === 'no' && hasFile) return false;
      if (filterTieneTx === 'si' && !p.tiene_tx) return false;
      if (filterTieneTx === 'no' && p.tiene_tx) return false;
      if (filterSaludable === 'si' && !p.saludable) return false;
      if (filterSaludable === 'no' && p.saludable) return false;
      if (filterCirrosis === 'si' && !p.tiene_cirrosis) return false;
      if (filterCirrosis === 'no' && p.tiene_cirrosis) return false;
      if (filterEhm === 'si' && !p.tiene_ehm) return false;
      if (filterEhm === 'no' && !p.tiene_ehm) return false;
      const edad = Number(p.edad);
      if (filterEdadMin !== '') {
        const min = Number(filterEdadMin);
        if (!Number.isNaN(min) && edad < min) return false;
      }
      if (filterEdadMax !== '') {
        const max = Number(filterEdadMax);
        if (!Number.isNaN(max) && edad > max) return false;
      }
      return true;
    });
  }, [
    pacientes,
    videos,
    searchText,
    filterSexo,
    filterChildPugh,
    filterConArchivo,
    filterTieneTx,
    filterSaludable,
    filterCirrosis,
    filterEhm,
    filterEdadMin,
    filterEdadMax,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (proyectoFiltro) params.proyecto = proyectoFiltro;
      const [p, v] = await Promise.all([getPacientes(params), getVideos(params)]);
      setPacientes(p);
      setVideos(v);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [proyectoFiltro]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !puedeAdminPlataforma || section !== 'users') return;
      setLoadingUsers(true);
      try {
        const list = await getUsers();
        if (!cancelled) setAdminUsers(list);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, puedeAdminPlataforma, section]);

  const defaultProyectoId = useMemo(() => {
    if (proyectoFiltro && opcionesProyectoForm.some((x) => String(x.id) === String(proyectoFiltro))) {
      return Number(proyectoFiltro);
    }
    const first = opcionesProyectoForm[0];
    return first ? first.id : '';
  }, [proyectoFiltro, opcionesProyectoForm]);

  const submitPacienteData = useCallback(
    async (payload) => {
      setError('');
      try {
        if (editingId) {
          await updatePaciente(editingId, payload);
          setEditingId(null);
          setForm(INIT_PACIENTE);
          setSection('list');
          load();
        } else {
          const created = await createPaciente(payload);
          setForm(INIT_PACIENTE);
          setNewPacienteForUpload({
            id: created.id,
            nombre: `${created.nombre} ${created.apellido_paterno} ${created.apellido_materno}`.trim(),
          });
          load();
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [editingId, load],
  );

  const cancelPacienteForm = useCallback(() => {
    setForm(INIT_PACIENTE);
    setEditingId(null);
    setNewPacienteForUpload(null);
    setSection('list');
  }, []);

  const patientToForm = useCallback(
    (p) => ({
      proyecto: p.proyecto,
      nombre: p.nombre,
      apellido_paterno: p.apellido_paterno || '',
      apellido_materno: p.apellido_materno || '',
      sexo: p.sexo || 'M',
      edad: p.edad,
      child_pugh: p.child_pugh || '',
      tiene_tx: p.tiene_tx || false,
      puntaje_phes: p.puntaje_phes != null ? String(p.puntaje_phes) : '',
      puntaje_flicker: p.puntaje_flicker != null ? String(p.puntaje_flicker) : '',
      saludable: p.saludable,
      tiene_cirrosis: p.tiene_cirrosis,
      tiene_ehm: p.tiene_ehm,
    }),
    [],
  );

  const handleEdit = useCallback(
    (p) => {
      setForm(patientToForm(p));
      setEditingId(p.id);
      setSection('create');
    },
    [patientToForm],
  );

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este paciente y sus videos?')) return;
    setError('');
    try {
      await deletePaciente(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setCreatingUser(true);
    try {
      await createUser(
        userForm.username,
        userForm.password,
        userForm.email,
        userForm.role,
        userForm.proyectoIds,
      );
      setUserForm(INIT_USUARIO);
      setCreateUserOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    setCreatingProject(true);
    try {
      await createProyecto(newProjectForm);
      setNewProjectForm(INIT_NUEVO_PROYECTO);
      setNewProjectOpen(false);
      const list = await getProyectos();
      setProyectosDisponibles(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleVideoUpload = async (pacienteId, e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setError('');
    setUploadingFor(pacienteId);
    try {
      await uploadVideo(pacienteId, file);
      setUploadingFor(null);
      e.target.value = '';
      if (newPacienteForUpload?.id === pacienteId) {
        setNewPacienteForUpload(null);
        setSection('list');
      }
      load();
    } catch (err) {
      setError(err.message);
      setUploadingFor(null);
    }
  };

  const skipUploadAndGoToList = () => {
    setNewPacienteForUpload(null);
    setSection('list');
  };

  const openEditUser = (row) => {
    setEditUserRow(row);
    setEditUserForm({
      email: row.email || '',
      password: '',
      role: row.role === 'Superusuario' ? 'Otro' : row.role || 'Otro',
      proyectoIds: Array.isArray(row.proyecto_ids) ? [...row.proyecto_ids] : [],
    });
    setEditUserOpen(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editUserRow) return;
    setError('');
    setSavingUser(true);
    try {
      const editedId = editUserRow.id;
      const body = { email: editUserForm.email || '', proyecto_ids: editUserForm.proyectoIds };
      if (editUserForm.password) body.password = editUserForm.password;
      if (!editUserRow.is_superuser) body.role = editUserForm.role;
      await patchUser(editedId, body);
      setEditUserOpen(false);
      setEditUserRow(null);
      setEditUserForm(INIT_EDIT_USUARIO);
      const list = await getUsers();
      setAdminUsers(list);
      if (editedId === user?.id) await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingUser(false);
    }
  };

  const navContent = (
    <List sx={{ pt: 2, px: 0.5 }}>
      <ListItemButton
        selected={section === 'list'}
        onClick={() => setSection('list')}
        sx={{ borderRadius: 2, mb: 0.5 }}
      >
        <ListItemIcon><ListAltIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary="Pacientes" secondary="Registro y archivos" />
      </ListItemButton>
      <ListItemButton
        selected={section === 'create'}
        onClick={() => {
          setSection('create');
          setEditingId(null);
          setForm({ ...INIT_PACIENTE, proyecto: defaultProyectoId || '' });
          setNewPacienteForUpload(null);
        }}
        sx={{ borderRadius: 2, mb: 0.5 }}
      >
        <ListItemIcon><PersonAddOutlinedIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary="Nuevo paciente" />
      </ListItemButton>
      {puedeAdminPlataforma && (
        <ListItemButton
          selected={section === 'users'}
          onClick={() => setSection('users')}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon><GroupOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Usuarios" secondary="Roles y proyectos" />
        </ListItemButton>
      )}
    </List>
  );

  const mainPadX = { xs: 2, sm: 3 };
  const mainMaxWidth = 'lg';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        bgcolor: 'background.default',
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
          backgroundColor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(15,18,28,0.85)' : 'rgba(255,255,255,0.9)',
        }}
      >
        <Toolbar
          sx={{
            gap: 1.5,
            minHeight: { xs: 56, sm: 64 },
            px: mainPadX,
            maxWidth: (t) => (mainMaxWidth === 'lg' ? t.breakpoints.values.lg : undefined),
            mx: 'auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <ScienceOutlinedIcon color="primary" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1.2, letterSpacing: 0.4 }}>
              Investigación clínica
            </Typography>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ lineHeight: 1.2 }}>
              AI Alcohol
            </Typography>
          </Box>
          {showProyectoSelector && (
            <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 220 }, maxWidth: { xs: '42vw', sm: 320 } }}>
              <InputLabel id="filtro-proyecto-label">Proyecto</InputLabel>
              <Select
                labelId="filtro-proyecto-label"
                label="Proyecto"
                value={proyectoFiltro}
                onChange={(e) => setProyectoFiltro(e.target.value)}
              >
                <MenuItem value="">
                  <em>{puedeEditarProyectosGlobales ? 'Todos' : 'Todos mis proyectos'}</em>
                </MenuItem>
                {(puedeEditarProyectosGlobales ? proyectosDisponibles : user?.proyectos || []).map((pr) => (
                  <MenuItem key={pr.id} value={String(pr.id)}>
                    {pr.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {user?.is_superuser && (
            <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 200 }, maxWidth: { xs: '40vw', sm: 280 } }}>
              <InputLabel id="view-as-label">Ver como</InputLabel>
              <Select
                labelId="view-as-label"
                label="Ver como"
                value={getViewAsRole() || 'Superusuario'}
                onChange={async (e) => {
                  const v = e.target.value;
                  setViewAsRole(v === 'Superusuario' ? '' : v);
                  setError('');
                  try {
                    await refreshUser();
                    await load();
                  } catch (err) {
                    setError(err.message || 'Error');
                  }
                }}
              >
                {VIEW_AS_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {!isMobile && (
              <>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                  {user?.username}
                </Typography>
                {user?.role && (
                  <Chip label={user.role} size="small" sx={{ height: 24, display: { xs: 'none', md: 'inline-flex' } }} />
                )}
              </>
            )}
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Opciones">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 2 } }}
      >
        <MenuItem onClick={() => { toggleTheme(); setAnchorEl(null); }}>
          <ListItemIcon>{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}</ListItemIcon>
          <ListItemText primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} />
        </MenuItem>
        {puedeEditarProyectosGlobales && (
          <MenuItem
            onClick={() => {
              setNewProjectOpen(true);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><FolderSpecialOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Nuevo proyecto" />
          </MenuItem>
        )}
        {puedeAdminPlataforma && (
          <MenuItem
            onClick={() => {
              setSection('users');
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><GroupOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Gestionar usuarios" />
          </MenuItem>
        )}
        {puedeAdminPlataforma && (
          <MenuItem
            onClick={() => {
              setCreateUserOpen(true);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Crear usuario" />
          </MenuItem>
        )}
        {puedeAdminPlataforma && (
          <MenuItem
            disabled={downloadingBackup}
            onClick={async () => {
              setAnchorEl(null);
              setDownloadingBackup(true);
              setError('');
              try {
                await downloadBackup();
              } catch (err) {
                setError(err.message);
              } finally {
                setDownloadingBackup(false);
              }
            }}
          >
            <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary={downloadingBackup ? 'Generando…' : 'Copia (.zip: BD + media + manifest)'} />
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            logout();
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </MenuItem>
      </Menu>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                top: { xs: 56, sm: 64 },
                height: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
                borderRight: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              },
            }}
          >
            {navContent}
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: mainPadX,
            py: { xs: 2, sm: 3 },
            pb: { xs: 10, md: 3 },
            minHeight: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
            overflow: 'auto',
          }}
        >
          <Container
            maxWidth={mainMaxWidth}
            disableGutters
            sx={{ maxWidth: { sm: '100%', md: theme.breakpoints.values.lg }, mx: 'auto' }}
          >
            {error && (
              <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {section === 'list' && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 1.5,
                    mb: 2.5,
                  }}
                >
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>
                      Base de pacientes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Filtra por proyecto desde la barra superior cuando tengas varios activos.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddOutlinedIcon />}
                    onClick={() => {
                      setForm({ ...INIT_PACIENTE, proyecto: defaultProyectoId || '' });
                      setEditingId(null);
                      setNewPacienteForUpload(null);
                      setSection('create');
                    }}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
                  >
                    Añadir paciente
                  </Button>
                </Box>

                {!loading && pacientes.length > 0 && (
                  <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                      size="small"
                      placeholder="Buscar por nombre o apellidos"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      sx={{ width: '100%', maxWidth: { sm: 360 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 120 }} variant="outlined">
                        <InputLabel shrink>Sexo</InputLabel>
                        <Select value={filterSexo} label="Sexo" onChange={(e) => setFilterSexo(e.target.value)}>
                          <MenuItem value="">Todos</MenuItem>
                          {SEXO_OPCIONES.map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 100 }} variant="outlined">
                        <InputLabel shrink>Child-Pugh</InputLabel>
                        <Select value={filterChildPugh} label="Child-Pugh" onChange={(e) => setFilterChildPugh(e.target.value)}>
                          <MenuItem value="">Todos</MenuItem>
                          {CHILD_PUGH_OPCIONES.filter((o) => o.value).map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        type="number"
                        label="Edad mín"
                        value={filterEdadMin}
                        onChange={(e) => setFilterEdadMin(e.target.value)}
                        inputProps={{ min: 0, max: 120 }}
                        sx={{ width: 96 }}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Edad máx"
                        value={filterEdadMax}
                        onChange={(e) => setFilterEdadMax(e.target.value)}
                        inputProps={{ min: 0, max: 120 }}
                        sx={{ width: 96 }}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                      />
                      <FormControl size="small" sx={{ minWidth: 130 }} variant="outlined">
                        <InputLabel shrink>Archivo</InputLabel>
                        <Select value={filterConArchivo} label="Archivo" onChange={(e) => setFilterConArchivo(e.target.value)}>
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="si">Con archivo</MenuItem>
                          <MenuItem value="no">Sin archivo</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 100 }} variant="outlined">
                        <InputLabel shrink>Tx</InputLabel>
                        <Select value={filterTieneTx} label="Tx" onChange={(e) => setFilterTieneTx(e.target.value)}>
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="si">Sí</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 110 }} variant="outlined">
                        <InputLabel shrink>Saludable</InputLabel>
                        <Select value={filterSaludable} label="Saludable" onChange={(e) => setFilterSaludable(e.target.value)}>
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="si">Sí</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 100 }} variant="outlined">
                        <InputLabel shrink>Cirrosis</InputLabel>
                        <Select value={filterCirrosis} label="Cirrosis" onChange={(e) => setFilterCirrosis(e.target.value)}>
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="si">Sí</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 90 }} variant="outlined">
                        <InputLabel shrink>EHM</InputLabel>
                        <Select value={filterEhm} label="EHM" onChange={(e) => setFilterEhm(e.target.value)}>
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="si">Sí</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                      {(searchText || filterSexo || filterChildPugh || filterConArchivo || filterTieneTx || filterSaludable || filterCirrosis || filterEhm || filterEdadMin !== '' || filterEdadMax !== '') && (
                        <Button size="small" onClick={() => { setSearchText(''); setFilterSexo(''); setFilterChildPugh(''); setFilterConArchivo(''); setFilterTieneTx(''); setFilterSaludable(''); setFilterCirrosis(''); setFilterEhm(''); setFilterEdadMin(''); setFilterEdadMax(''); }}>
                          Limpiar filtros
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : pacientes.length === 0 ? (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="text.secondary">
                        No hay pacientes en este contexto. Añade uno desde «Nuevo paciente» o revisa el filtro de proyecto.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : filteredPacientes.length === 0 ? (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography color="text.secondary">
                        Ningún paciente coincide con la búsqueda o filtros.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {filteredPacientes.map((p) => (
                      <Card
                        key={p.id}
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderColor: 'divider',
                          transition: 'box-shadow 0.2s, border-color 0.2s',
                          '&:hover': {
                            borderColor: 'primary.light',
                            boxShadow: (t) => (t.palette.mode === 'dark' ? '0 0 0 1px rgba(99,102,241,0.35)' : '0 8px 24px rgba(15,23,42,0.06)'),
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 0, pt: { xs: 2, sm: 2.5 } }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {p.nombre} {p.apellido_paterno} {p.apellido_materno}
                          </Typography>
                          {p.proyecto_label && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {p.proyecto_label}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            Edad {p.edad} · {SEXO_OPCIONES.find((s) => s.value === p.sexo)?.label || p.sexo}
                            {p.child_pugh && ` · CP ${p.child_pugh}`}
                            {p.tiene_tx && ' · Tx'}
                            {(p.puntaje_phes != null && p.puntaje_phes !== '') && ` · PHES ${p.puntaje_phes}`}
                            {(p.puntaje_flicker != null && p.puntaje_flicker !== '') && ` · Flicker ${p.puntaje_flicker}`}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.25 }}>
                            {pacienteHasFile(p.id) ? (
                              <Chip icon={<CheckCircleOutlineIcon />} label="Con archivo" size="small" color="success" variant="outlined" />
                            ) : (
                              <Chip icon={<WarningAmberIcon />} label="Sin archivo" size="small" color="default" variant="outlined" />
                            )}
                            {p.saludable && <Chip label="Saludable" size="small" color="success" />}
                            {p.tiene_cirrosis && <Chip label="Cirrosis" size="small" color="warning" />}
                            {p.tiene_ehm && <Chip label="EHM" size="small" color="warning" />}
                            {p.child_pugh && <Chip label={`CP ${p.child_pugh}`} size="small" />}
                            {p.tiene_tx && <Chip label="Tx" size="small" color="success" variant="outlined" />}
                          </Box>
                        </CardContent>
                        <CardActions sx={{ flexWrap: 'wrap', gap: 0.5, px: 2, pb: 2, pt: 0 }}>
                          <Button size="small" component="label" startIcon={<UploadIcon />} disabled={!!uploadingFor}>
                            {uploadingFor === p.id ? 'Subiendo...' : 'Subir video/audio'}
                            <input
                              type="file"
                              accept="video/*,audio/*"
                              hidden
                              onChange={(e) => handleVideoUpload(p.id, e)}
                            />
                          </Button>
                          {pacienteHasFile(p.id) && (
                            <Button
                              size="small"
                              onClick={() => setExpandedVerPacienteId((id) => (id === p.id ? null : p.id))}
                              endIcon={expandedVerPacienteId === p.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            >
                              {expandedVerPacienteId === p.id ? 'Ocultar archivo' : 'Ver archivo'}
                            </Button>
                          )}
                          <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(p)}>
                            Editar
                          </Button>
                          {puedeAdminPlataforma && (
                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(p.id)}>
                              Eliminar
                            </Button>
                          )}
                        </CardActions>
                        {pacienteHasFile(p.id) && (
                          <Collapse in={expandedVerPacienteId === p.id} unmountOnExit>
                            <CardContent sx={{ pt: 0, pb: 1.5 }}>
                              {videos.filter((v) => v.paciente === p.id).map((v) => {
                                const mediaUrl = getMediaUrl(v.archivo);
                                const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(v.archivo || '');
                                const isAudio = /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(v.archivo || '');
                                return (
                                  <Box key={v.id} sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      {new Date(v.subido_en).toLocaleString('es')} · {v.estado}
                                    </Typography>
                                    {mediaUrl && (
                                      isVideo ? (
                                        <Box component="video" controls sx={{ width: '100%', maxWidth: 560, borderRadius: 1, bgcolor: 'black' }} src={mediaUrl} />
                                      ) : isAudio ? (
                                        <Box component="audio" controls sx={{ width: '100%', maxWidth: 560 }} src={mediaUrl} />
                                      ) : (
                                        <Button size="small" href={mediaUrl} target="_blank" rel="noopener noreferrer">
                                          Ver / Descargar archivo
                                        </Button>
                                      )
                                    )}
                                  </Box>
                                );
                              })}
                            </CardContent>
                          </Collapse>
                        )}
                      </Card>
                    ))}
                  </Box>
                )}
              </>
            )}

            {section === 'users' && puedeAdminPlataforma && (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.3 }}>
                      Usuarios
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contraseña, rol y proyectos asignados (varios por usuario).
                    </Typography>
                  </Box>
                  {isMobile && (
                    <Button variant="outlined" size="small" onClick={() => setSection('list')}>
                      Volver a pacientes
                    </Button>
                  )}
                </Box>
                {loadingUsers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Usuario</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                          <TableCell>Rol</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Proyectos</TableCell>
                          <TableCell align="right"> </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {adminUsers.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.username}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.email || '—'}</TableCell>
                            <TableCell>{row.role || '—'}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              {(row.proyectos || []).map((p) => p.nombre).join(', ') || '—'}
                            </TableCell>
                            <TableCell align="right">
                              <Button size="small" startIcon={<EditIcon />} onClick={() => openEditUser(row)}>
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {section === 'create' && newPacienteForUpload && (
              <Card sx={{ maxWidth: 520, width: '100%', mx: 'auto' }} variant="outlined">
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" fontWeight={600} color="success.main" sx={{ mb: 0.5 }}>
                    Paciente creado
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {newPacienteForUpload.nombre}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    Subir video o audio (opcional):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    <Button variant="contained" component="label" startIcon={<UploadIcon />} disabled={!!uploadingFor}>
                      {uploadingFor === newPacienteForUpload.id ? 'Subiendo...' : 'Elegir archivo'}
                      <input
                        type="file"
                        accept="video/*,audio/*"
                        hidden
                        onChange={(e) => handleVideoUpload(newPacienteForUpload.id, e)}
                      />
                    </Button>
                    <Button variant="outlined" onClick={skipUploadAndGoToList}>
                      Continuar sin subir
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {section === 'create' && !newPacienteForUpload && (
              <PacienteForm
                key={editingId ?? 'new'}
                initialValues={form}
                isEditing={!!editingId}
                onSubmit={submitPacienteData}
                onCancel={cancelPacienteForm}
                proyectoOptions={opcionesProyectoForm}
                proyectoLocked={proyectoLocked && !editingId}
              />
            )}
          </Container>
        </Box>
      </Box>

      {isMobile && (section === 'list' || section === 'create') && (
        <BottomNavigation
          value={section === 'list' ? 0 : 1}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.drawer + 1,
            borderTop: 1,
            borderColor: 'divider',
            pb: 'env(safe-area-inset-bottom)',
            bgcolor: 'background.paper',
          }}
        >
          <BottomNavigationAction label="Pacientes" icon={<ListAltIcon />} onClick={() => setSection('list')} />
          <BottomNavigationAction
            label="Nuevo"
            icon={<PersonAddOutlinedIcon />}
            onClick={() => {
              setSection('create');
              setEditingId(null);
              setForm({ ...INIT_PACIENTE, proyecto: defaultProyectoId || '' });
              setNewPacienteForUpload(null);
            }}
          />
        </BottomNavigation>
      )}

      <Dialog open={editUserOpen} onClose={() => { setEditUserOpen(false); setEditUserRow(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Editar usuario{editUserRow ? `: ${editUserRow.username}` : ''}</DialogTitle>
        <form onSubmit={handleSaveEditUser}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
              <TextField
                type="email"
                label="Email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextField
                type="password"
                label="Nueva contraseña (opcional)"
                value={editUserForm.password}
                onChange={(e) => setEditUserForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
              />
              <FormControl fullWidth disabled={editUserRow?.is_superuser}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={editUserForm.role}
                  label="Rol"
                  onChange={(e) => setEditUserForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {editUserRow?.is_superuser && (
                <Typography variant="caption" color="text.secondary">
                  El rol del superusuario no se modifica desde aquí.
                </Typography>
              )}
              <FormControl fullWidth>
                <InputLabel id="edit-uproj-label">Proyectos asignados</InputLabel>
                <Select
                  labelId="edit-uproj-label"
                  multiple
                  value={editUserForm.proyectoIds}
                  onChange={(e) =>
                    setEditUserForm((f) => ({
                      ...f,
                      proyectoIds: typeof e.target.value === 'string' ? e.target.value.split(',').map(Number) : e.target.value.map(Number),
                    }))}
                  input={<OutlinedInput label="Proyectos asignados" />}
                  renderValue={(selected) =>
                    proyectosDisponibles
                      .filter((pr) => selected.includes(pr.id))
                      .map((pr) => pr.nombre)
                      .join(', ') || 'Ninguno'}
                >
                  {proyectosDisponibles.map((pr) => (
                    <MenuItem key={pr.id} value={pr.id}>
                      {pr.nombre} ({pr.hospital_nombre})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setEditUserOpen(false);
                setEditUserRow(null);
              }}
              startIcon={<CloseIcon />}
            >
              Cerrar
            </Button>
            <Button type="submit" variant="contained" disabled={savingUser} startIcon={<EditIcon />}>
              {savingUser ? '…' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={createUserOpen} onClose={() => setCreateUserOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Crear usuario</DialogTitle>
        <form onSubmit={handleCreateUser}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
              <TextField label="Usuario" value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} required />
              <TextField type="password" label="Contraseña" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} required />
              <TextField type="email" label="Email (opcional)" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} />
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select value={userForm.role} label="Rol" onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="uproj-label">Proyectos asignados</InputLabel>
                <Select
                  labelId="uproj-label"
                  multiple
                  value={userForm.proyectoIds}
                  onChange={(e) => setUserForm((f) => ({ ...f, proyectoIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value.map(Number) }))}
                  input={<OutlinedInput label="Proyectos asignados" />}
                  renderValue={(selected) =>
                    proyectosDisponibles
                      .filter((pr) => selected.includes(pr.id))
                      .map((pr) => pr.nombre)
                      .join(', ') || 'Ninguno'}
                >
                  {proyectosDisponibles.map((pr) => (
                    <MenuItem key={pr.id} value={pr.id}>
                      {pr.nombre} ({pr.hospital_nombre})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                El usuario solo verá pacientes y archivos de los proyectos seleccionados (salvo administradores).
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateUserOpen(false)} startIcon={<CloseIcon />}>Cerrar</Button>
            <Button type="submit" variant="contained" disabled={creatingUser} startIcon={<PersonAddIcon />}>
              {creatingUser ? '...' : 'Crear usuario'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={newProjectOpen} onClose={() => setNewProjectOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>Nuevo proyecto</DialogTitle>
        <form onSubmit={handleCreateProject}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Se crean o reutilizan hospital y especialidad por nombre (poca carga en el servidor).
              </Typography>
              <TextField
                label="Nombre del proyecto"
                value={newProjectForm.nombre}
                onChange={(e) => setNewProjectForm((f) => ({ ...f, nombre: e.target.value }))}
                required
              />
              <TextField
                label="Hospital"
                value={newProjectForm.hospital_nombre}
                onChange={(e) => setNewProjectForm((f) => ({ ...f, hospital_nombre: e.target.value }))}
                required
              />
              <TextField
                label="Especialidad"
                value={newProjectForm.especialidad_nombre}
                onChange={(e) => setNewProjectForm((f) => ({ ...f, especialidad_nombre: e.target.value }))}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setNewProjectOpen(false)} startIcon={<CloseIcon />}>Cerrar</Button>
            <Button type="submit" variant="contained" disabled={creatingProject} startIcon={<FolderSpecialOutlinedIcon />}>
              {creatingProject ? '...' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
