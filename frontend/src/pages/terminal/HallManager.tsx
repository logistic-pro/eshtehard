import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert, Chip,
  IconButton, Tooltip, Switch, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { hallsService, terminalsService } from '../../services/halls.service';

interface HallRow {
  id: string; name: string; province: string; shift?: string;
  capacity: number; isActive: boolean;
  terminal: { name: string };
  terminalId: string;
}

const emptyForm = { terminalId: '', name: '', province: '', shift: '', capacity: '100' };

export default function TerminalHallManager() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [editHall, setEditHall] = useState<HallRow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', province: '', shift: '', capacity: '100', isActive: true });
  const [editError, setEditError] = useState('');
  const [deleteHall, setDeleteHall] = useState<HallRow | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['halls'],
    queryFn: () => hallsService.list(),
    refetchInterval: 15000,
  });
  const { data: terminalsData } = useQuery({ queryKey: ['terminals'], queryFn: () => terminalsService.list() });

  const createMutation = useMutation({
    mutationFn: () => hallsService.create({ ...form, capacity: Number(form.capacity) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['halls'] }); setOpen(false); setForm(emptyForm); setError(''); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در ایجاد سالن');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string; name: string; province: string; shift: string; capacity: number; isActive: boolean }) =>
      hallsService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['halls'] }); setEditHall(null); setEditError(''); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg ?? 'خطا در ویرایش سالن');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hallsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['halls'] }); setDeleteHall(null); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'خطا در حذف سالن');
    },
  });

  const halls: HallRow[] = data?.data ?? [];
  const terminals = terminalsData?.data ?? [];

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="مدیریت سالن‌ها" subtitle={`${halls.length} سالن`}
        action={{ label: 'افزودن سالن', onClick: () => { setOpen(true); setForm(emptyForm); setError(''); }, icon: <AddIcon /> }} />

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
            {halls.map(h => (
              <TableRow key={h.id} hover>
                <TableCell>{h.name}</TableCell>
                <TableCell>{h.terminal?.name}</TableCell>
                <TableCell>{h.province}</TableCell>
                <TableCell>{h.shift ?? '-'}</TableCell>
                <TableCell>{h.capacity}</TableCell>
                <TableCell>
                  <Chip label={h.isActive ? 'فعال' : 'غیرفعال'} color={h.isActive ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={0.5}>
                    <Tooltip title="ویرایش">
                      <IconButton size="small" color="primary" onClick={() => {
                        setEditHall(h);
                        setEditForm({ name: h.name, province: h.province, shift: h.shift ?? '', capacity: String(h.capacity), isActive: h.isActive });
                        setEditError('');
                      }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف">
                      <IconButton size="small" color="error" onClick={() => setDeleteHall(h)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {halls.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">
                <Typography color="text.secondary" py={3}>سالنی یافت نشد</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
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
          <Button variant="contained" onClick={() => createMutation.mutate()}
            disabled={!form.terminalId || !form.name || createMutation.isPending}>
            {createMutation.isPending ? 'در حال افزودن...' : 'افزودن'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editHall} onClose={() => setEditHall(null)} maxWidth="sm" fullWidth>
        <DialogTitle>ویرایش سالن</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField fullWidth label="نام سالن" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <TextField fullWidth label="استان" value={editForm.province} onChange={e => setEditForm(f => ({ ...f, province: e.target.value }))} />
            <TextField fullWidth label="شیفت (اختیاری)" value={editForm.shift} onChange={e => setEditForm(f => ({ ...f, shift: e.target.value }))} />
            <TextField fullWidth label="ظرفیت" type="number" value={editForm.capacity} onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))} inputProps={{ dir: 'ltr' }} />
            <FormControlLabel
              control={<Switch checked={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} color="success" />}
              label={editForm.isActive ? 'فعال' : 'غیرفعال'}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditHall(null)}>انصراف</Button>
          <Button variant="contained" disabled={!editForm.name || updateMutation.isPending}
            onClick={() => {
              if (editHall) {
                updateMutation.mutate({
                  id: editHall.id,
                  name: editForm.name,
                  province: editForm.province,
                  shift: editForm.shift,
                  capacity: Number(editForm.capacity),
                  isActive: editForm.isActive,
                });
              }
            }}>
            {updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteHall} onClose={() => setDeleteHall(null)} maxWidth="xs" fullWidth>
        <DialogTitle>حذف سالن</DialogTitle>
        <DialogContent>
          <Typography>آیا از حذف سالن <strong>{deleteHall?.name}</strong> مطمئن هستید؟</Typography>
          <Typography variant="caption" color="error">این عملیات برگشت‌پذیر نیست.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteHall(null)}>انصراف</Button>
          <Button variant="contained" color="error" disabled={deleteMutation.isPending}
            onClick={() => deleteHall && deleteMutation.mutate(deleteHall.id)}>
            {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
