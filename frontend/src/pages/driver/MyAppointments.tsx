import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, Divider,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusChip from '../../components/ui/StatusChip';
import { appointmentsService } from '../../services/appointments.service';
import { waybillsService } from '../../services/waybills.service';
import { toJalaliDateTime } from '../../utils/jalali';
import { printWaybill } from '../../utils/printWaybill';

type WaybillDetail = {
  id: string;
  waybillNumber: string;
  issuedAt: string;
  cargo: {
    referenceCode: string; cargoType: string;
    originProvince: string; originCity: string;
    destProvince: string; destCity: string;
    weight: number; unit: string; fare?: number;
    producer?: { user: { name: string; phone: string } };
    freight?: { user: { name: string; phone: string } };
  };
  appointment: {
    appointmentDate?: string;
    driver: { user: { name: string; phone: string }; vehicles: { plate: string; vehicleType: string }[] };
  };
};

function WaybillViewDialog({ waybillId, onClose }: { waybillId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['waybill', waybillId],
    queryFn: () => waybillsService.get(waybillId),
  });
  const w: WaybillDetail | undefined = data?.data;

  const row = (label: string, value?: string | number | null) => (
    <Box display="flex" justifyContent="space-between" py={0.5} borderBottom="1px solid #f0f0f0">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value ?? '-'}</Typography>
    </Box>
  );

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>جزئیات حواله الکترونیکی</DialogTitle>
      <DialogContent>
        {isLoading && <LoadingSpinner />}
        {w && (
          <Box mt={1}>
            <Typography variant="subtitle2" color="primary" mb={1}>اطلاعات بار</Typography>
            {row('شماره حواله', w.waybillNumber)}
            {row('کد مرجع', w.cargo.referenceCode)}
            {row('نوع بار', w.cargo.cargoType)}
            {row('وزن', `${w.cargo.weight} ${w.cargo.unit}`)}
            {row('مبدأ', `${w.cargo.originProvince} - ${w.cargo.originCity}`)}
            {row('مقصد', `${w.cargo.destProvince} - ${w.cargo.destCity}`)}
            {w.cargo.fare && row('کرایه (ریال)', w.cargo.fare.toLocaleString('fa-IR'))}

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" color="primary" mb={1}>اطلاعات راننده</Typography>
            {row('نام راننده', w.appointment.driver.user.name)}
            {row('موبایل', w.appointment.driver.user.phone)}
            {w.appointment.driver.vehicles[0] && row('پلاک خودرو', w.appointment.driver.vehicles[0].plate)}

            {w.cargo.producer && (<>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" color="primary" mb={1}>تولیدکننده / فرستنده</Typography>
              {row('نام', w.cargo.producer.user.name)}
              {row('موبایل', w.cargo.producer.user.phone)}
            </>)}

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" color="primary" mb={1}>تاریخ‌ها</Typography>
            {row('تاریخ صدور', toJalaliDateTime(w.issuedAt))}
            {row('تاریخ نوبت', toJalaliDateTime(w.appointment.appointmentDate))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {w && (
          <Button onClick={() => printWaybill(w)} startIcon={<PrintIcon />} variant="outlined">
            چاپ / ذخیره PDF
          </Button>
        )}
        <Button onClick={onClose} variant="contained">بستن</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DriverAppointments() {
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [viewWaybill, setViewWaybill] = useState<string | null>(null);
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

                {a.status === 'CONFIRMED' && (
                  <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
                    {a.cargo.status === 'DRIVER_ASSIGNED' && !a.waybill && (
                      <Alert severity="warning" sx={{ py: 0.5, width: '100%' }}>
                        منتظر صدور حواله توسط باربری باشید — تا صدور حواله نمی‌توانید بارگیری کنید
                      </Alert>
                    )}
                    {a.cargo.status === 'DRIVER_ASSIGNED' && a.waybill && (
                      <Button size="small" variant="contained" color="warning"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => statusMutation.mutate({ id: a.id, status: 'IN_TRANSIT' })}
                        disabled={statusMutation.isPending}>
                        بارگیری شد / در حال حمل
                      </Button>
                    )}
                    {a.cargo.status === 'IN_TRANSIT' && (
                      <Button size="small" variant="contained" color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => statusMutation.mutate({ id: a.id, status: 'DELIVERED' })}
                        disabled={statusMutation.isPending}>
                        تحویل داده شد
                      </Button>
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
                  <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
                    <Button size="small" variant="outlined" startIcon={<VisibilityIcon />}
                      onClick={() => setViewWaybill(a.waybill!.id)}>
                      مشاهده / چاپ حواله
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {viewWaybill && (
        <WaybillViewDialog waybillId={viewWaybill} onClose={() => setViewWaybill(null)} />
      )}

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
