import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Card, CardContent, Grid, Typography, TextField, Button, Chip, Divider, Pagination, Snackbar, Alert } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScaleIcon from '@mui/icons-material/Scale';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cargoService } from '../../services/cargo.service';
import { appointmentsService } from '../../services/appointments.service';

export default function DriverCargoList() {
  const [province, setProvince] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cargo', 'driver', page, search],
    queryFn: () => cargoService.list({ page: String(page), limit: '12', ...(search ? { province: search } : {}) }),
    refetchInterval: 15000,
  });

  const requestMutation = useMutation({
    mutationFn: (cargoId: string) => appointmentsService.requestCargo(cargoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setSnack({ open: true, message: 'درخواست حمل ارسال شد. منتظر تأیید باربری باشید.', severity: 'success' });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'خطا در ارسال درخواست';
      setSnack({ open: true, message: msg, severity: 'error' });
    },
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 12);

  return (
    <MainLayout>
      <PageHeader title="لیست بارها" subtitle={`${total} بار موجود`} />
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box display="flex" gap={2}>
            <TextField size="small" label="فیلتر بر اساس استان مبدأ" value={province}
              onChange={e => setProvince(e.target.value)} sx={{ flex: 1 }} />
            <Button variant="contained" onClick={() => { setSearch(province); setPage(1); }}>جستجو</Button>
            <Button variant="outlined" onClick={() => { setProvince(''); setSearch(''); setPage(1); }}>پاک‌کردن</Button>
          </Box>
        </CardContent>
      </Card>
      {isLoading ? <LoadingSpinner /> : (
        <>
          <Grid container spacing={2}>
            {items.map((c: {
              id: string; referenceCode: string; cargoType: string;
              originProvince: string; originCity: string; destProvince: string; destCity: string;
              weight: number; unit: string; fare?: number; isUrgent: boolean; status: string;
            }) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography fontWeight={600}>{c.cargoType}</Typography>
                      <Box display="flex" gap={0.5}>
                        {c.isUrgent && <Chip label="فوری" color="error" size="small" />}
                        {c.status === 'DRIVER_ASSIGNED' && <Chip label="تکمیل" color="default" size="small" />}
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{c.originProvince} / {c.originCity} ← {c.destProvince} / {c.destCity}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <ScaleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{c.weight} {c.unit}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">{c.referenceCode}</Typography>
                      {c.fare
                        ? <Typography variant="body2" fontWeight={600} color="primary.main">{c.fare.toLocaleString()} ریال</Typography>
                        : <Typography variant="caption" color="text.secondary">کرایه توافقی</Typography>}
                    </Box>
                    {c.status === 'ANNOUNCED_TO_HALL' && (
                      <Box mt={1.5}>
                        <Button
                          fullWidth variant="contained" size="small"
                          onClick={() => requestMutation.mutate(c.id)}
                          disabled={requestMutation.isPending}
                        >
                          درخواست حمل
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {items.length === 0 && (
              <Grid item xs={12}><Box textAlign="center" py={6}><Typography color="text.secondary">باری یافت نشد</Typography></Box></Grid>
            )}
          </Grid>
          {pageCount > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </MainLayout>
  );
}
