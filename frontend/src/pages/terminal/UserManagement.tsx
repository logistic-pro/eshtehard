import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Tooltip, Pagination, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Badge,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';
import { fa } from '../../i18n/fa';
import { toJalaliDate } from '../../utils/jalali';

type UserStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED';
type UserRole = 'DRIVER' | 'FREIGHT_COMPANY' | 'PRODUCER' | 'TERMINAL_ADMIN';

interface UserRow {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  createdAt: string;
}

const statusColor: Record<UserStatus, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  SUSPENDED: 'error',
};

const roleAvatarColor: Record<UserRole, string> = {
  DRIVER: '#1976d2',
  FREIGHT_COMPANY: '#7b1fa2',
  PRODUCER: '#388e3c',
  TERMINAL_ADMIN: '#d32f2f',
};

const emptyForm = { phone: '', name: '', role: 'DRIVER' as UserRole };

export default function TerminalUserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () => api.get('/users', {
      params: {
        page: String(page), limit: '20',
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      api.put(`/users/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof emptyForm) => api.post('/users', { ...body, status: 'APPROVED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setAddOpen(false);
      setForm(emptyForm);
      setFormError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'خطا در ایجاد کاربر');
    },
  });

  const items: UserRow[] = data?.data?.users ?? [];
  const total: number = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 20);
  const pendingCount = items.filter(u => u.status === 'PENDING').length;

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <PageHeader title="مدیریت کاربران" subtitle={`${total} کاربر ثبت‌شده`} />
          {pendingCount > 0 && (
            <Chip
              icon={<HourglassEmptyIcon />}
              label={`${pendingCount} کاربر در انتظار تأیید`}
              color="warning"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => { setAddOpen(true); setFormError(''); setForm(emptyForm); }}
        >
          افزودن کاربر
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          size="small" label="جستجوی نام / موبایل" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          sx={{ width: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>نقش</InputLabel>
          <Select value={roleFilter} label="نقش" onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">همه</MenuItem>
            {(['DRIVER', 'FREIGHT_COMPANY', 'PRODUCER', 'TERMINAL_ADMIN'] as UserRole[]).map(r => (
              <MenuItem key={r} value={r}>{(fa as Record<string, string>)[r]}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>وضعیت</InputLabel>
          <Select value={statusFilter} label="وضعیت" onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">همه</MenuItem>
            <MenuItem value="PENDING">در انتظار تأیید</MenuItem>
            <MenuItem value="APPROVED">تأیید شده</MenuItem>
            <MenuItem value="SUSPENDED">مسدود</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>کاربر</TableCell>
              <TableCell>موبایل</TableCell>
              <TableCell>نقش</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell>تاریخ ثبت</TableCell>
              <TableCell align="center">عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(u => (
              <TableRow key={u.id} hover sx={u.status === 'PENDING' ? { bgcolor: 'warning.lighter' } : {}}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        width: 34, height: 34, fontSize: 13, fontWeight: 700,
                        bgcolor: roleAvatarColor[u.role] ?? '#999',
                      }}
                    >
                      {u.name.slice(0, 2)}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>{u.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{u.phone}</TableCell>
                <TableCell>
                  <Chip
                    label={(fa as Record<string, string>)[u.role] ?? u.role}
                    size="small"
                    sx={{ bgcolor: roleAvatarColor[u.role], color: '#fff', fontSize: 11 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={(fa as Record<string, string>)[u.status] ?? u.status}
                    color={statusColor[u.status] ?? 'default'}
                    size="small"
                    variant={u.status === 'PENDING' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>{toJalaliDate(u.createdAt)}</TableCell>
                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={0.5}>
                    {u.status !== 'APPROVED' && (
                      <Tooltip title="تأیید کاربر">
                        <IconButton
                          size="small" color="success"
                          onClick={() => updateMutation.mutate({ id: u.id, status: 'APPROVED' })}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {u.status !== 'SUSPENDED' && (
                      <Tooltip title="مسدود کردن">
                        <IconButton
                          size="small" color="error"
                          onClick={() => updateMutation.mutate({ id: u.id, status: 'SUSPENDED' })}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <Typography variant="caption" color="text.disabled">مسدود</Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" py={3}>کاربری یافت نشد</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      {/* Add User Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>افزودن کاربر جدید</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formError && (
            <Typography color="error" variant="body2">{formError}</Typography>
          )}
          <TextField
            label="شماره موبایل"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
            inputProps={{ dir: 'ltr' }}
            helperText="مثال: 09123456789"
            fullWidth
          />
          <TextField
            label="نام کامل"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>نقش</InputLabel>
            <Select
              value={form.role}
              label="نقش"
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
            >
              {(['DRIVER', 'FREIGHT_COMPANY', 'PRODUCER', 'TERMINAL_ADMIN'] as UserRole[]).map(r => (
                <MenuItem key={r} value={r}>{(fa as Record<string, string>)[r]}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>انصراف</Button>
          <Button
            variant="contained"
            onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending || !form.phone || !form.name}
          >
            {createMutation.isPending ? 'در حال ذخیره...' : 'ایجاد کاربر'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
