import { useState, memo } from 'react';
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

function PacienteForm({ initialValues, isEditing, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValues);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      edad: Number(form.edad),
      child_pugh: form.child_pugh || '',
      puntaje_phes: form.puntaje_phes === '' ? null : Number(form.puntaje_phes),
      puntaje_flicker: form.puntaje_flicker === '' ? null : Number(form.puntaje_flicker),
    };
    onSubmit(payload);
  };

  return (
    <Card sx={{ maxWidth: 720 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {isEditing ? 'Editar paciente' : 'Nuevo paciente'}
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
            alignItems: 'start',
          }}
        >
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
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, display: 'flex', gap: 1, mt: 0 }}>
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
