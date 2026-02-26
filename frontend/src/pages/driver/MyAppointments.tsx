import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, Divider,
  Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import CancelIcon from '@mui/icons-material/Cancel';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusChip from '../../components/ui/StatusChip';
import { appointmentsService } from '../../services/appointments.service';
import { waybillsService } from '../../services/waybills.service';
import { toJalaliDateTime } from '../../utils/jalali';

export default function DriverAppointments() {
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'driver'],
    queryFn: () => appointmentsService.list(),
    refetchInterval: 10000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'IN_TRANSIT' | 'DELIVERED' }) =>
      appointmentsService.driverUpdateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.cancelByDriver(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setCancelDialog(null); },
  });

  const items = data?.data?.items ?? [];

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="نوبت‌های من" subtitle={`${data?.data?.total ?? 0} درخواست`} />
      {items.length === 0 && (
        <Alert severity="info">هنوز درخواستی ثبت نکرده‌اید. از صفحه لیست بارها، بار مورد نظر را انتخاب کنید.</Alert>
      )}
      <Grid container spacing={2}>
        {items.map((a: {
          id: string; appointmentDate?: string; status: string; note?: string;
          cargo: {
            referenceCode: string; cargoType: string; originProvince: string; destProvince: string;
            weight: number; unit: string; fare?: number; status: string; loadingDateTime?: string;
          };
          waybill?: { id: string };
        }) => (
          <Grid item xs={12} md={6} key={a.id}>
            <Card elevation={2} sx={{
              borderRight: 4,
              borderColor: a.status === 'CONFIRMED' ? 'success.main' : a.status === 'CANCELLED' ? 'error.main' : 'warning.main',
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {a.status === 'PENDING' ? <HourglassEmptyIcon color="warning" /> : <EventNoteIcon color="primary" />}
                    <Typography fontWeight={600}>درخواست #{a.id.slice(-6).toUpperCase()}</Typography>
                  </Box>
                  <StatusChip status={a.status} />
                </Box>

                {a.status === 'PENDING' && (
                  <Alert severity="warning" sx={{ mb: 1.5, py: 0.5 }}>در انتظار تأیید باربری</Alert>
                )}

                <Divider sx={{ mb: 1.5 }} />
                <Typography variant="body2" mb={0.5}><strong>نوع بار:</strong> {a.cargo.cargoType}</Typography>
                <Typography variant="body2" mb={0.5}><strong>مسیر:</strong> {a.cargo.originProvince} ← {a.cargo.destProvince}</Typography>
                <Typography variant="body2" mb={0.5}><strong>وزن:</strong> {a.cargo.weight} {a.cargo.unit}</Typography>
                {a.cargo.fare && (
                  <Typography variant="body2" mb={0.5}><strong>کرایه:</strong> {a.cargo.fare.toLocaleString('fa-IR')} ریال</Typography>
                )}
                {a.cargo.loadingDateTime && (
                  <Typography variant="body2" mb={0.5}>
                    <strong>زمان بارگیری:</strong> {toJalaliDateTime(a.cargo.loadingDateTime)}
                  </Typography>
                )}
                {a.note && (
                  <Typography variant="body2" mb={0.5} color="text.secondary"><strong>یادداشت:</strong> {a.note}</Typography>
                )}
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">{a.cargo.referenceCode}</Typography>

                {/* Driver action buttons — status change */}
                {a.status === 'CONFIRMED' && (
                  <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
                    {a.cargo.status === 'DRIVER_ASSIGNED' && (
                      <Button size="small" variant="contained" color="warning"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => statusMutation.mutate({ id: a.id, status: 'IN_TRANSIT' })}
                        disabled={statusMutation.isPending}>
                        بارگیری شد / در حال حمل
                      </Button>
                    )}
                    {a.cargo.status === 'IN_TRANSIT' && a.waybill && (
                      <Button size="small" variant="contained" color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => statusMutation.mutate({ id: a.id, status: 'DELIVERED' })}
                        disabled={statusMutation.isPending}>
                        تحویل داده شد
                      </Button>
                    )}
                    {a.cargo.status === 'IN_TRANSIT' && !a.waybill && (
                      <Typography variant="caption" color="warning.main">
                        در انتظار صدور حواله توسط باربری...
                      </Typography>
                    )}
                    {['DRIVER_ASSIGNED', 'IN_TRANSIT'].includes(a.cargo.status) && (
                      <Button size="small" variant="outlined" color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setCancelDialog(a.id)}>
                        لغو نوبت
                      </Button>
                    )}
                  </Box>
                )}

                {a.waybill && (
                  <Box mt={1.5}>
                    <Button size="small" variant="outlined" color="error" startIcon={<DownloadIcon />}
                      onClick={() => waybillsService.downloadPdf(a.waybill!.id)}>
                      دریافت حواله PDF
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!cancelDialog} onClose={() => setCancelDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>لغو نوبت</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            با لغو این نوبت، به مدت ۲۴ ساعت اجازه درخواست بار جدید نخواهید داشت.
            بار نیز به لیست سالن برمی‌گردد تا رانندگان دیگر بتوانند درخواست دهند.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(null)}>انصراف</Button>
          <Button variant="contained" color="error"
            onClick={() => cancelDialog && cancelMutation.mutate(cancelDialog)}
            disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? 'در حال لغو...' : 'لغو نوبت'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
