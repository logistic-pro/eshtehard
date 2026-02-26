import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, Box, Chip, Pagination, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { driversService } from '../../services/drivers.service';
import { appointmentsService } from '../../services/appointments.service';
import { fa } from '../../i18n/fa';
import { toJalaliDateTime } from '../../utils/jalali';

const VEHICLE_TYPES = ['TRAILER','TRUCK','PICKUP','VAN','REFRIGERATED','TANKER','FLATBED'];
const emptyForm = { phone: '', name: '', homeProvince: '', homeCity: '', licenseNumber: '', plate: '', vehicleType: 'TRUCK', ownership: 'OWNED', vehicleModel: '' };

export default function TerminalDriverMonitor() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const liftBanMutation = useMutation({
    mutationFn: (driverId: string) => appointmentsService.liftDriverBan(driverId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', 'terminal', page, search],
    queryFn: () => driversService.list({ page: String(page), limit: '20', ...(search ? { search } : {}) }),
  });

  const createMutation = useMutation({
    mutationFn: () => driversService.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] });
      setOpen(false);
      setForm(emptyForm);
      setError('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در افزودن راننده');
    },
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader
        title="رانندگان و ناوگان"
        subtitle={`${total} راننده`}
        action={{ label: 'افزودن راننده', onClick: () => { setOpen(true); setError(''); setForm(emptyForm); }, icon: <AddIcon /> }}
      />
      <Box mb={2}>
        <TextField size="small" label="جستجو نام یا موبایل" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} sx={{ width: 300 }} />
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
              <TableCell>باربری</TableCell>
              <TableCell>وضعیت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((d: {
              id: string;
              homeProvince?: string;
              cancelBanUntil?: string;
              user: { name: string; phone: string; isActive: boolean; status: string };
              freightCompany?: { companyName: string };
              vehicles: { plate: string; vehicleType: string; ownership: string }[];
            }) => {
              const v = d.vehicles?.[0];
              const isBanned = d.cancelBanUntil && new Date(d.cancelBanUntil) > new Date();
              return (
                <TableRow key={d.id} hover sx={{ bgcolor: isBanned ? 'error.50' : undefined }}>
                  <TableCell>{d.user.name}</TableCell>
                  <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{d.user.phone}</TableCell>
                  <TableCell>{d.homeProvince ?? '-'}</TableCell>
                  <TableCell dir="ltr">{v?.plate ?? '-'}</TableCell>
                  <TableCell>
                    {v ? (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <DirectionsBusIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">{(fa as Record<string, string>)[v.vehicleType] ?? v.vehicleType}</Typography>
                        <Chip label={(fa as Record<string, string>)[v.ownership]} size="small" color={v.ownership === 'OWNED' ? 'primary' : 'warning'} sx={{ fontSize: 10 }} />
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{d.freightCompany?.companyName ?? '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Chip label={d.user.isActive ? 'فعال' : 'غیرفعال'} color={d.user.isActive ? 'success' : 'error'} size="small" />
                      {isBanned && (
                        <Chip
                          label={`محدود تا ${toJalaliDateTime(d.cancelBanUntil)}`}
                          color="error" size="small" variant="outlined"
                          deleteIcon={<LockOpenIcon />}
                          onDelete={() => liftBanMutation.mutate(d.id)}
                        />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">
                <Typography color="text.secondary" py={3}>رانندهای یافت نشد</Typography>
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

      {/* Add Driver + Vehicle Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن راننده و ناوگان</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Typography variant="subtitle2" color="primary">اطلاعات راننده</Typography>
            <TextField fullWidth label="نام کامل" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField fullWidth label="شماره موبایل" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
              inputProps={{ dir: 'ltr' }} helperText="مثال: 09123456789" />
            <Box display="flex" gap={2}>
              <TextField fullWidth label="استان" value={form.homeProvince}
                onChange={e => setForm(f => ({ ...f, homeProvince: e.target.value }))} />
              <TextField fullWidth label="شهر" value={form.homeCity}
                onChange={e => setForm(f => ({ ...f, homeCity: e.target.value }))} />
            </Box>
            <TextField fullWidth label="شماره گواهینامه (اختیاری)" value={form.licenseNumber}
              onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} />

            <Typography variant="subtitle2" color="primary" mt={1}>اطلاعات ناوگان</Typography>
            <TextField fullWidth label="پلاک خودرو" value={form.plate}
              onChange={e => setForm(f => ({ ...f, plate: e.target.value }))}
              inputProps={{ dir: 'ltr' }} helperText="مثال: ۱۲ب۳۴۵الف" />
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>نوع وسیله</InputLabel>
                <Select value={form.vehicleType} label="نوع وسیله"
                  onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
                  {VEHICLE_TYPES.map(t => <MenuItem key={t} value={t}>{(fa as Record<string, string>)[t] ?? t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>مالکیت</InputLabel>
                <Select value={form.ownership} label="مالکیت"
                  onChange={e => setForm(f => ({ ...f, ownership: e.target.value }))}>
                  <MenuItem value="OWNED">ملکی</MenuItem>
                  <MenuItem value="LEASED">استیجاری</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField fullWidth label="مدل خودرو (اختیاری)" value={form.vehicleModel}
              onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()}
            disabled={!form.name || !form.phone || createMutation.isPending}>
            {createMutation.isPending ? 'در حال ذخیره...' : 'ثبت راننده'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
