import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { fleetService, driversService } from '../../services/drivers.service';
import { fa } from '../../i18n/fa';

const VEHICLE_TYPES = ['TRAILER','TRUCK','PICKUP','VAN','REFRIGERATED','TANKER','FLATBED'];

export default function FreightFleet() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ driverId: '', plate: '', vehicleType: 'TRUCK', ownership: 'OWNED', model: '', year: '' });
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['fleet'], queryFn: () => fleetService.list() });
  const { data: driversData } = useQuery({ queryKey: ['drivers', 'all'], queryFn: () => driversService.list({ limit: '200' }) });

  const createMutation = useMutation({
    mutationFn: () => fleetService.create({ ...form, year: form.year ? Number(form.year) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fleet'] }); setOpen(false); setError(''); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا');
    },
  });

  const items = data?.data?.items ?? [];
  const drivers = driversData?.data?.items ?? [];

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="مدیریت ناوگان" subtitle={`${data?.data?.total ?? 0} وسیله`}
        action={{ label: 'افزودن ناوگان', onClick: () => setOpen(true), icon: <AddIcon /> }} />

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>پلاک</TableCell>
              <TableCell>نوع وسیله</TableCell>
              <TableCell>مالکیت</TableCell>
              <TableCell>مدل</TableCell>
              <TableCell>راننده</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((v: { id: string; plate: string; vehicleType: string; ownership: string; model?: string; driver: { user: { name: string } } }) => (
              <TableRow key={v.id} hover>
                <TableCell dir="ltr">{v.plate}</TableCell>
                <TableCell>{(fa as Record<string, string>)[v.vehicleType]}</TableCell>
                <TableCell><Chip label={(fa as Record<string, string>)[v.ownership]} color={v.ownership === 'OWNED' ? 'primary' : 'warning'} size="small" /></TableCell>
                <TableCell>{v.model ?? '-'}</TableCell>
                <TableCell>{v.driver?.user?.name ?? '-'}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary" py={3}>ناوگانی ثبت نشده است</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن ناوگان</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>راننده</InputLabel>
              <Select value={form.driverId} label="راننده" onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))}>
                {drivers.map((d: { id: string; user: { name: string } }) => <MenuItem key={d.id} value={d.id}>{d.user.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="پلاک" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} />
            <FormControl fullWidth>
              <InputLabel>نوع وسیله</InputLabel>
              <Select value={form.vehicleType} label="نوع وسیله" onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
                {VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{(fa as Record<string, string>)[t]}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>مالکیت</InputLabel>
              <Select value={form.ownership} label="مالکیت" onChange={e => setForm(f => ({ ...f, ownership: e.target.value }))}>
                <MenuItem value="OWNED">ملکی</MenuItem>
                <MenuItem value="LEASED">استیجاری</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="مدل (اختیاری)" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
            <TextField fullWidth label="سال ساخت (اختیاری)" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} inputProps={{ dir: 'ltr' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={!form.driverId || !form.plate || createMutation.isPending}>افزودن</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
