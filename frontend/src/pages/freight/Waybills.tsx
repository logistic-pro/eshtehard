import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, IconButton, Tooltip, Pagination, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { waybillsService } from '../../services/waybills.service';
import { appointmentsService } from '../../services/appointments.service';
import { toJalaliDate } from '../../utils/jalali';
import { printWaybill } from '../../utils/printWaybill';

interface ApptOption {
  id: string;
  cargo: { cargoType: string; referenceCode: string; originProvince: string; destProvince: string };
  driver: { user: { name: string; phone: string } };
  waybill: unknown | null;
}

export default function FreightWaybills() {
  const [open, setOpen] = useState(false);
  const [apptId, setApptId] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['waybills', page],
    queryFn: () => waybillsService.list({ page: String(page), limit: '15' }),
    refetchInterval: 15000,
  });

  const { data: apptData } = useQuery({
    queryKey: ['appointments', 'for-waybill'],
    queryFn: () => appointmentsService.list({ status: 'CONFIRMED', limit: '100' }),
    refetchInterval: 15000,
  });

  const createMutation = useMutation({
    mutationFn: () => waybillsService.create(apptId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waybills'] });
      qc.invalidateQueries({ queryKey: ['appointments', 'for-waybill'] });
      setOpen(false); setApptId(''); setError('');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در صدور حواله');
    },
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  // Only show CONFIRMED appointments that don't have a waybill yet
  const allAppts: ApptOption[] = apptData?.data?.items ?? [];
  const appts = allAppts.filter(a => !a.waybill);
  const pageCount = Math.ceil(total / 15);

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="حواله‌ها" subtitle={`${total} حواله`}
        action={{ label: 'صدور حواله', onClick: () => { setOpen(true); setApptId(''); setError(''); }, icon: <AddIcon /> }} />

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>شماره حواله</TableCell>
              <TableCell>نوع بار</TableCell>
              <TableCell>مسیر</TableCell>
              <TableCell>راننده</TableCell>
              <TableCell>تاریخ صدور</TableCell>
              <TableCell align="center">PDF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((w: {
              id: string; waybillNumber: string; issuedAt: string;
              cargo: { cargoType: string; originProvince: string; destProvince: string };
              appointment: { driver: { user: { name: string } } };
            }) => (
              <TableRow key={w.id} hover>
                <TableCell><Typography variant="caption" fontFamily="monospace">{w.waybillNumber}</Typography></TableCell>
                <TableCell>{w.cargo.cargoType}</TableCell>
                <TableCell>{w.cargo.originProvince} ← {w.cargo.destProvince}</TableCell>
                <TableCell>{w.appointment?.driver?.user?.name ?? '-'}</TableCell>
                <TableCell>{toJalaliDate(w.issuedAt)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="چاپ / ذخیره PDF">
                    <IconButton size="small" color="primary"
                      onClick={async () => { const r = await waybillsService.get(w.id); printWaybill(r.data); }}>
                      <PrintIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">
                <Typography color="text.secondary" py={3}>حواله‌ای یافت نشد</Typography>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>صدور حواله الکترونیکی</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {appts.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              هیچ نوبت تأیید شده‌ای بدون حواله وجود ندارد.
              ابتدا درخواست راننده را تأیید کنید.
            </Typography>
          ) : (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>انتخاب نوبت</InputLabel>
              <Select value={apptId} label="انتخاب نوبت" onChange={e => setApptId(e.target.value)}>
                {appts.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.cargo.cargoType} — {a.driver.user.name} ({a.cargo.originProvince} ← {a.cargo.destProvince})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained"
            onClick={() => createMutation.mutate()}
            disabled={!apptId || createMutation.isPending || appts.length === 0}>
            {createMutation.isPending ? 'در حال صدور...' : 'صدور حواله'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
