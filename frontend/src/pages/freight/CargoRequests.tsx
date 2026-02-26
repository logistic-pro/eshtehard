import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, TextField, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Pagination,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import BlockIcon from '@mui/icons-material/Block';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusChip from '../../components/ui/StatusChip';
import { cargoService } from '../../services/cargo.service';
import { toJalaliDateTime } from '../../utils/jalali';

export default function FreightCargoRequests() {
  const [page, setPage] = useState(1);
  const [fareDialog, setFareDialog] = useState<{ id: string } | null>(null);
  const [fare, setFare] = useState('');
  const [fareError, setFareError] = useState('');
  const [rejectDialog, setRejectDialog] = useState<{ id: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cargo', 'freight', page],
    queryFn: () => cargoService.list({ page: String(page), limit: '15' }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => cargoService.accept(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cargo'] }),
  });

  const fareMutation = useMutation({
    mutationFn: ({ id, fare }: { id: string; fare: number }) => cargoService.setFare(id, fare),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cargo'] }); setFareDialog(null); setFare(''); setFareError(''); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFareError(msg ?? 'خطا در ثبت کرایه');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => cargoService.reject(id, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cargo'] }); setRejectDialog(null); setRejectNote(''); },
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 15);

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="درخواست‌های بار" subtitle={`${total} بار`} />

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>کد مرجع</TableCell>
              <TableCell>نوع بار</TableCell>
              <TableCell>مبدأ → مقصد</TableCell>
              <TableCell>وزن</TableCell>
              <TableCell>کرایه</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell>تولیدکننده</TableCell>
              <TableCell align="center">عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c: {
              id: string; referenceCode: string; cargoType: string;
              originProvince: string; destProvince: string; weight: number; unit: string;
              fare?: number; status: string; producer: { user: { name: string } };
            }) => (
              <TableRow key={c.id} hover>
                <TableCell><Typography variant="caption" fontFamily="monospace">{c.referenceCode}</Typography></TableCell>
                <TableCell>{c.cargoType}</TableCell>
                <TableCell>{c.originProvince} ← {c.destProvince}</TableCell>
                <TableCell>{c.weight} {c.unit}</TableCell>
                <TableCell>{c.fare ? `${c.fare.toLocaleString()} ریال` : '-'}</TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                <TableCell>{c.producer?.user?.name ?? '-'}</TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5} justifyContent="center">
                    {c.status === 'SUBMITTED' && (
                      <Tooltip title="پذیرش بار">
                        <IconButton size="small" color="success" onClick={() => acceptMutation.mutate(c.id)}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {c.status === 'ACCEPTED_BY_FREIGHT' && (
                      <Tooltip title="تعیین کرایه">
                        <IconButton size="small" color="primary" onClick={() => { setFareDialog({ id: c.id }); setFareError(''); }}>
                          <PriceChangeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {['SUBMITTED', 'ACCEPTED_BY_FREIGHT', 'ANNOUNCED_TO_HALL'].includes(c.status) && (
                      <Tooltip title="رد بار با یادداشت">
                        <IconButton size="small" color="error" onClick={() => { setRejectDialog({ id: c.id }); setRejectNote(''); }}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center"><Typography color="text.secondary" py={3}>داده‌ای یافت نشد</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>رد بار با یادداشت</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="دلیل رد (برای اطلاع تولیدی)" value={rejectNote}
            onChange={e => setRejectNote(e.target.value)} multiline rows={3} sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)}>انصراف</Button>
          <Button variant="contained" color="error"
            onClick={() => rejectDialog && rejectMutation.mutate({ id: rejectDialog.id, note: rejectNote })}
            disabled={rejectMutation.isPending}>
            رد بار
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!fareDialog} onClose={() => setFareDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>تعیین کرایه بار</DialogTitle>
        <DialogContent>
          {fareError && <Alert severity="error" sx={{ mb: 2 }}>{fareError}</Alert>}
          <TextField
            fullWidth label="کرایه (ریال)" type="number" value={fare}
            onChange={e => setFare(e.target.value)} sx={{ mt: 1 }}
            inputProps={{ dir: 'ltr' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFareDialog(null)}>انصراف</Button>
          <Button
            variant="contained"
            onClick={() => fareDialog && fareMutation.mutate({ id: fareDialog.id, fare: Number(fare) })}
            disabled={!fare || fareMutation.isPending}
          >
            ثبت کرایه
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
