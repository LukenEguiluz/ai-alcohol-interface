import { useState, memo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';

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

function proyectoLabel(opt) {
  if (!opt) return '';
  const h = opt.hospital_nombre || '';
  const e = opt.especialidad_nombre || '';
  return [opt.nombre, h, e].filter(Boolean).join(' · ');
}

function PacienteForm({
  initialValues,
  isEditing,
  onSubmit,
  onCancel,
  proyectoOptions = [],
  proyectoLocked = false,
}) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      proyecto: Number(form.proyecto),
      edad: Number(form.edad),
      child_pugh: form.child_pugh || '',
      puntaje_phes: form.puntaje_phes === '' ? null : Number(form.puntaje_phes),
      puntaje_flicker: form.puntaje_flicker === '' ? null : Number(form.puntaje_flicker),
    };
    onSubmit(payload);
  };

  const singleOpt = proyectoLocked && proyectoOptions.length === 1 ? proyectoOptions[0] : null;

  return (
    <Card
      sx={{
        maxWidth: 800,
        width: '100%',
        mx: 'auto',
        border: 1,
        borderColor: 'divider',
        boxShadow: (t) => (t.palette.mode === 'dark' ? '0 0 0 1px rgba(255,255,255,0.06)' : '0 1px 2px rgba(15,23,42,0.06)'),
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          {isEditing ? 'Editar paciente' : 'Nuevo paciente'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Los datos quedan asociados al proyecto seleccionado.
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          {singleOpt ? (
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Proyecto
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {proyectoLabel(singleOpt)}
              </Typography>
            </Box>
          ) : (
            <FormControl fullWidth required sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <InputLabel>Proyecto</InputLabel>
              <Select
                label="Proyecto"
                value={form.proyecto === '' ? '' : String(form.proyecto)}
                disabled={proyectoLocked}
                onChange={(e) => setForm((f) => ({ ...f, proyecto: e.target.value === '' ? '' : Number(e.target.value) }))}
              >
                {proyectoOptions.map((opt) => (
                  <MenuItem key={opt.id} value={String(opt.id)}>
                    {proyectoLabel(opt)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Apellido paterno"
            value={form.apellido_paterno}
            onChange={(e) => setForm((f) => ({ ...f, apellido_paterno: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Apellido materno"
            value={form.apellido_materno}
            onChange={(e) => setForm((f) => ({ ...f, apellido_materno: e.target.value }))}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Sexo</InputLabel>
            <Select
              value={form.sexo}
              label="Sexo"
              onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value }))}
            >
              {SEXO_OPCIONES.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="number"
            label="Edad"
            value={form.edad}
            onChange={(e) => setForm((f) => ({ ...f, edad: e.target.value }))}
            inputProps={{ min: 1, max: 120 }}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Child-Pugh (CP)</InputLabel>
            <Select
              value={form.child_pugh}
              label="Child-Pugh (CP)"
              onChange={(e) => setForm((f) => ({ ...f, child_pugh: e.target.value }))}
            >
              {CHILD_PUGH_OPCIONES.map((o) => (
                <MenuItem key={o.value || 'none'} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.tiene_tx}
                onChange={(e) => setForm((f) => ({ ...f, tiene_tx: e.target.checked }))}
              />
            }
            label="Tiene Tx"
          />
          <TextField
            type="number"
            label="Puntaje PHES"
            value={form.puntaje_phes}
            onChange={(e) => setForm((f) => ({ ...f, puntaje_phes: e.target.value }))}
            inputProps={{ step: 0.01, min: 0 }}
            placeholder="Opcional"
            fullWidth
          />
          <TextField
            type="number"
            label="Puntaje Flicker"
            value={form.puntaje_flicker}
            onChange={(e) => setForm((f) => ({ ...f, puntaje_flicker: e.target.value }))}
            inputProps={{ step: 0.01, min: 0 }}
            placeholder="Opcional"
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.saludable}
                onChange={(e) => setForm((f) => ({ ...f, saludable: e.target.checked }))}
              />
            }
            label="Saludable"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.tiene_cirrosis}
                onChange={(e) => setForm((f) => ({ ...f, tiene_cirrosis: e.target.checked }))}
              />
            }
            label="Cirrosis"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.tiene_ehm}
                onChange={(e) => setForm((f) => ({ ...f, tiene_ehm: e.target.checked }))}
              />
            }
            label="EHM"
          />
          <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' }, display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            <Button variant="outlined" startIcon={<CancelIcon />} onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" startIcon={isEditing ? <SaveIcon /> : <PersonAddOutlinedIcon />}>
              {isEditing ? 'Guardar' : 'Añadir paciente'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default memo(PacienteForm);
