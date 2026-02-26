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
import { hallsService, terminalsService } from '../../services/halls.service';

export default function TerminalHallManager() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ terminalId: '', name: '', province: '', shift: '', capacity: '100' });
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['halls'], queryFn: () => hallsService.list() });
  const { data: terminalsData } = useQuery({ queryKey: ['terminals'], queryFn: () => terminalsService.list() });

  const createMutation = useMutation({
    mutationFn: () => hallsService.create({ ...form, capacity: Number(form.capacity) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['halls'] }); setOpen(false); setError(''); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hallsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['halls'] }),
  });

  const halls = data?.data ?? [];
  const terminals = terminalsData?.data ?? [];

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="مدیریت سالن‌ها" subtitle={`${halls.length} سالن`}
        action={{ label: 'افزودن سالن', onClick: () => setOpen(true), icon: <AddIcon /> }} />

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>نام سالن</TableCell>
              <TableCell>پایانه</TableCell>
              <TableCell>استان</TableCell>
              <TableCell>شیفت</TableCell>
              <TableCell>ظرفیت</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell align="center">عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {halls.map((h: { id: string; name: string; province: string; shift?: string; capacity: number; isActive: boolean; terminal: { name: string } }) => (
              <TableRow key={h.id} hover>
                <TableCell>{h.name}</TableCell>
                <TableCell>{h.terminal?.name}</TableCell>
                <TableCell>{h.province}</TableCell>
                <TableCell>{h.shift ?? '-'}</TableCell>
                <TableCell>{h.capacity}</TableCell>
                <TableCell><Chip label={h.isActive ? 'فعال' : 'غیرفعال'} color={h.isActive ? 'success' : 'error'} size="small" /></TableCell>
                <TableCell align="center">
                  <Button size="small" color="error" onClick={() => deleteMutation.mutate(h.id)}>غیرفعال</Button>
                </TableCell>
              </TableRow>
            ))}
            {halls.length === 0 && <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" py={3}>سالنی یافت نشد</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن سالن جدید</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>پایانه</InputLabel>
              <Select value={form.terminalId} label="پایانه" onChange={e => setForm(f => ({ ...f, terminalId: e.target.value }))}>
                {terminals.map((t: { id: string; name: string }) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="نام سالن" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField fullWidth label="استان" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
            <TextField fullWidth label="شیفت (اختیاری)" value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} />
            <TextField fullWidth label="ظرفیت" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} inputProps={{ dir: 'ltr' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={!form.terminalId || !form.name || createMutation.isPending}>افزودن</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
