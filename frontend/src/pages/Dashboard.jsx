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
  createUser,
  ROLES,
} from '../api';

const DRAWER_WIDTH = 240;
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
const INIT_USUARIO = { username: '', password: '', email: '', role: 'Otro' };

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [pacientes, setPacientes] = useState([]);
  const [videos, setVideos] = useState([]);
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

  const isAdmin = user?.role === 'Administrador' || user?.is_staff;

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
      if (filterEhm === 'no' && p.tiene_ehm) return false;
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
  }, [pacientes, videos, searchText, filterSexo, filterChildPugh, filterConArchivo, filterTieneTx, filterSaludable, filterCirrosis, filterEhm, filterEdadMin, filterEdadMax]);

  const load = async () => {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([getPacientes(), getVideos()]);
      setPacientes(p);
      setVideos(v);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitPacienteData = useCallback(async (payload) => {
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
  }, [editingId]);

  const cancelPacienteForm = useCallback(() => {
    setForm(INIT_PACIENTE);
    setEditingId(null);
    setNewPacienteForUpload(null);
    setSection('list');
  }, []);

  const patientToForm = useCallback((p) => ({
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
  }), []);

  const handleEdit = useCallback((p) => {
    setForm(patientToForm(p));
    setEditingId(p.id);
    setSection('create');
  }, [patientToForm]);

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
      await createUser(userForm.username, userForm.password, userForm.email, userForm.role);
      setUserForm(INIT_USUARIO);
      setCreateUserOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingUser(false);
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

  const navContent = (
    <>
      <List sx={{ pt: 2 }}>
        <ListItemButton
          selected={section === 'list'}
          onClick={() => setSection('list')}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon><ListAltIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Base de pacientes" />
        </ListItemButton>
        <ListItemButton
          selected={section === 'create'}
          onClick={() => {
            setSection('create');
            setEditingId(null);
            setForm(INIT_PACIENTE);
            setNewPacienteForUpload(null);
          }}
          sx={{ borderRadius: 2, mx: 1 }}
        >
          <ListItemIcon><PersonAddOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Crear paciente" />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            AI Alcohol
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {!isMobile && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {user?.username}
                </Typography>
                {user?.role && (
                  <Chip label={user.role} size="small" sx={{ height: 24 }} />
                )}
              </>
            )}
            <IconButton
              color="inherit"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="Opciones"
            >
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
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <MenuItem onClick={() => { toggleTheme(); setAnchorEl(null); }}>
          <ListItemIcon>{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}</ListItemIcon>
          <ListItemText primary={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} />
        </MenuItem>
        {isAdmin && (
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
                top: 64,
                height: 'calc(100vh - 64px)',
                borderRight: 1,
                borderColor: 'divider',
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
            p: 2,
            pb: { xs: 10, md: 2 },
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
        <Container maxWidth="lg" disableGutters>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {section === 'list' && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Base de pacientes
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAddOutlinedIcon />}
                  onClick={() => {
                    setForm(INIT_PACIENTE);
                    setEditingId(null);
                    setNewPacienteForUpload(null);
                    setSection('create');
                  }}
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
                    sx={{ maxWidth: 320 }}
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
                      sx={{ width: 90 }}
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
                      sx={{ width: 90 }}
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
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : pacientes.length === 0 ? (
                <Card><CardContent><Typography color="text.secondary">No hay pacientes. Añade uno desde Crear paciente.</Typography></CardContent></Card>
              ) : filteredPacientes.length === 0 ? (
                <Card><CardContent><Typography color="text.secondary">Ningún paciente coincide con la búsqueda o filtros. Prueba a cambiar los criterios.</Typography></CardContent></Card>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {filteredPacientes.map((p) => (
                    <Card key={p.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ pb: 0 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {p.nombre} {p.apellido_paterno} {p.apellido_materno}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Edad {p.edad} · {SEXO_OPCIONES.find((s) => s.value === p.sexo)?.label || p.sexo}
                          {p.child_pugh && ` · CP ${p.child_pugh}`}
                          {p.tiene_tx && ' · Tx'}
                          {(p.puntaje_phes != null && p.puntaje_phes !== '') && ` · PHES ${p.puntaje_phes}`}
                          {(p.puntaje_flicker != null && p.puntaje_flicker !== '') && ` · Flicker ${p.puntaje_flicker}`}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
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
                      <CardActions sx={{ flexWrap: 'wrap', gap: 0.5, px: 2, pb: 0 }}>
                        <Button
                          size="small"
                          component="label"
                          startIcon={<UploadIcon />}
                          disabled={!!uploadingFor}
                        >
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
                        {isAdmin && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(p.id)}
                          >
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

          {section === 'create' && newPacienteForUpload && (
            <Card sx={{ maxWidth: 520 }} variant="outlined">
              <CardContent>
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
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={!!uploadingFor}
                  >
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
            />
          )}
        </Container>
        </Box>
      </Box>

      {isMobile && (
        <BottomNavigation
          value={section === 'list' ? 0 : 1}
          showLabels
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.drawer + 1, borderTop: 1, borderColor: 'divider' }}
        >
          <BottomNavigationAction label="Pacientes" icon={<ListAltIcon />} onClick={() => setSection('list')} />
          <BottomNavigationAction label="Crear" icon={<PersonAddOutlinedIcon />} onClick={() => { setSection('create'); setEditingId(null); setForm(INIT_PACIENTE); setNewPacienteForUpload(null); }} />
        </BottomNavigation>
      )}

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
    </Box>
  );
}
