import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, Chip, Pagination, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { driversService } from '../../services/drivers.service';
import { fa } from '../../i18n/fa';

const VEHICLE_TYPES = ['TRAILER','TRUCK','PICKUP','VAN','REFRIGERATED','TANKER','FLATBED'];

const emptyForm = { phone: '', name: '', homeProvince: '', plate: '', vehicleType: '', ownership: 'OWNED' };

export default function FreightDrivers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, search],
    queryFn: () => driversService.list({ page: String(page), limit: '15', ...(search ? { search } : {}) }),
    refetchInterval: 15000,
  });

  const addMutation = useMutation({
    mutationFn: () => driversService.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      setOpen(false);
      setForm(emptyForm);
      setError('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در ثبت راننده');
    },
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 15);

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="رانندگان و ناوگان" subtitle={`${total} راننده`} />
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField size="small" label="جستجو نام یا موبایل" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} sx={{ width: 280 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpen(true); setError(''); setForm(emptyForm); }}>
          افزودن راننده
        </Button>
      </Box>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>نام</TableCell>
              <TableCell>موبایل</TableCell>
              <TableCell>استان</TableCell>
              <TableCell>پلاک</TableCell>
              <TableCell>نوع ناوگان</TableCell>
              <TableCell>وضعیت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((d: {
              id: string;
              homeProvince?: string;
              user: { name: string; phone: string; isActive: boolean };
              vehicles: { plate: string; vehicleType: string; ownership: string }[];
            }) => {
              const v = d.vehicles?.[0];
              return (
                <TableRow key={d.id} hover>
                  <TableCell>{d.user.name}</TableCell>
                  <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{d.user.phone}</TableCell>
                  <TableCell>{d.homeProvince ?? '-'}</TableCell>
                  <TableCell dir="ltr">{v?.plate ?? '-'}</TableCell>
                  <TableCell>
                    {v ? (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <DirectionsBusIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">{(fa as Record<string, string>)[v.vehicleType] ?? v.vehicleType}</Typography>
                        <Chip label={(fa as Record<string, string>)[v.ownership]} size="small"
                          color={v.ownership === 'OWNED' ? 'primary' : 'warning'} sx={{ fontSize: 10 }} />
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={d.user.isActive ? 'فعال' : 'غیرفعال'}
                      color={d.user.isActive ? 'success' : 'error'} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">
                <Typography color="text.secondary" py={3}>رانندهای یافت نشده است</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      {/* Add Driver Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>افزودن راننده جدید</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="شماره موبایل" value={form.phone} size="small" inputProps={{ dir: 'ltr' }}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="09..." />
            <TextField label="نام و نام خانوادگی" value={form.name} size="small"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="استان (اختیاری)" value={form.homeProvince} size="small"
              onChange={e => setForm(f => ({ ...f, homeProvince: e.target.value }))} />
            <TextField label="پلاک خودرو (اختیاری)" value={form.plate} size="small" inputProps={{ dir: 'ltr' }}
              onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} placeholder="مثال: 12ب34567" />
            <FormControl size="small">
              <InputLabel>نوع خودرو</InputLabel>
              <Select value={form.vehicleType} label="نوع خودرو"
                onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
                <MenuItem value="">انتخاب نشده</MenuItem>
                {VEHICLE_TYPES.map(t => (
                  <MenuItem key={t} value={t}>{(fa as Record<string, string>)[t] ?? t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>مالکیت</InputLabel>
              <Select value={form.ownership} label="مالکیت"
                onChange={e => setForm(f => ({ ...f, ownership: e.target.value }))}>
                <MenuItem value="OWNED">ملکی</MenuItem>
                <MenuItem value="LEASED">استیجاری</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
            {addMutation.isPending ? 'در حال ثبت...' : 'ثبت'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
