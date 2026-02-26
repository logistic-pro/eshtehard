import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, Typography, Alert, IconButton, Tooltip, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusChip from '../../components/ui/StatusChip';
import { cargoService } from '../../services/cargo.service';
import { fa } from '../../i18n/fa';

export default function MyCargoList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [cancelDialog, setCancelDialog] = useState<{ id: string } | null>(null);
  const [cancelNote, setCancelNote] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cargo', 'producer', page, status],
    queryFn: () => cargoService.list({ page: String(page), limit: '15', ...(status ? { status } : {}) }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => cargoService.cancel(id, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cargo'] }); setCancelDialog(null); setCancelNote(''); },
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 15);

  const handleRepeat = (c: Record<string, unknown>) => {
    navigate('/producer/new-cargo', {
      state: {
        originProvince: c.originProvince,
        originCity: c.originCity,
        destProvince: c.destProvince,
        destCity: c.destCity,
        cargoType: c.cargoType,
        weight: c.weight,
        unit: c.unit,
        description: c.description,
        isUrgent: c.isUrgent,
      },
    });
  };

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="لیست بارهای من" subtitle={`${total} بار`} />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>وضعیت</InputLabel>
              <Select value={status} label="وضعیت" onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <MenuItem value="">همه</MenuItem>
                {['DRAFT','SUBMITTED','ACCEPTED_BY_FREIGHT','ANNOUNCED_TO_HALL','DRIVER_ASSIGNED','IN_TRANSIT','DELIVERED','CANCELLED'].map(s => (
                  <MenuItem key={s} value={s}>{fa[s as keyof typeof fa]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>کد مرجع</TableCell>
              <TableCell>نوع بار</TableCell>
              <TableCell>مبدأ</TableCell>
              <TableCell>مقصد</TableCell>
              <TableCell>وزن</TableCell>
              <TableCell>تاریخ بارگیری</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell>باربری</TableCell>
              <TableCell>یادداشت رد</TableCell>
              <TableCell align="center">عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((c: {
              id: string; referenceCode: string; cargoType: string;
              originProvince: string; destProvince: string; weight: number; unit: string;
              status: string; freight?: { user: { name: string } };
              loadingDateTime?: string; rejectionNote?: string;
            }) => (
              <TableRow key={c.id} hover>
                <TableCell><Typography variant="body2" fontFamily="monospace">{c.referenceCode}</Typography></TableCell>
                <TableCell>{c.cargoType}</TableCell>
                <TableCell>{c.originProvince}</TableCell>
                <TableCell>{c.destProvince}</TableCell>
                <TableCell>{c.weight} {c.unit}</TableCell>
                <TableCell>
                  {c.loadingDateTime
                    ? new Date(c.loadingDateTime).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
                    : '-'}
                </TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                <TableCell>{c.freight?.user?.name ?? '-'}</TableCell>
                <TableCell>
                  {c.rejectionNote
                    ? <Typography variant="caption" color="error.main">{c.rejectionNote}</Typography>
                    : '-'}
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5} justifyContent="center">
                    <Tooltip title="تکرار این بار">
                      <IconButton size="small" color="primary" onClick={() => handleRepeat(c as Record<string, unknown>)}>
                        <CopyAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {['DRAFT','SUBMITTED'].includes(c.status) && (
                      <Tooltip title="لغو بار">
                        <IconButton size="small" color="error" onClick={() => setCancelDialog({ id: c.id })}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={10} align="center"><Typography color="text.secondary" py={3}>داده‌ای یافت نشد</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      <Dialog open={!!cancelDialog} onClose={() => setCancelDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>لغو بار</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="دلیل لغو (اختیاری)" value={cancelNote}
            onChange={e => setCancelNote(e.target.value)} multiline rows={2} sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(null)}>انصراف</Button>
          <Button variant="contained" color="error"
            onClick={() => cancelDialog && cancelMutation.mutate({ id: cancelDialog.id, note: cancelNote })}
            disabled={cancelMutation.isPending}>
            لغو بار
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
