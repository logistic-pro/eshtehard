import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Pagination, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { waybillsService } from '../../services/waybills.service';
import { toJalaliDateTime } from '../../utils/jalali';
import { printWaybill } from '../../utils/printWaybill';

type WaybillDetail = {
  id: string; waybillNumber: string; issuedAt: string;
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

function WaybillDetailDialog({ waybillId, onClose }: { waybillId: string; onClose: () => void }) {
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
      <DialogTitle>جزئیات حواله {w?.waybillNumber}</DialogTitle>
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
            {row('نام', w.appointment.driver.user.name)}
            {row('موبایل', w.appointment.driver.user.phone)}
            {w.appointment.driver.vehicles[0] && row('پلاک', w.appointment.driver.vehicles[0].plate)}

            {w.cargo.freight && (<>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" color="primary" mb={1}>باربری</Typography>
              {row('نام', w.cargo.freight.user.name)}
              {row('موبایل', w.cargo.freight.user.phone)}
            </>)}

            {w.cargo.producer && (<>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" color="primary" mb={1}>تولیدکننده</Typography>
              {row('نام', w.cargo.producer.user.name)}
              {row('موبایل', w.cargo.producer.user.phone)}
            </>)}

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" color="primary" mb={1}>تاریخ‌ها</Typography>
            {row('صدور', toJalaliDateTime(w.issuedAt))}
            {row('نوبت بارگیری', toJalaliDateTime(w.appointment.appointmentDate))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {w && (
          <Button startIcon={<PrintIcon />} variant="outlined"
            onClick={() => printWaybill(w)}>
            چاپ / ذخیره PDF
          </Button>
        )}
        <Button onClick={onClose} variant="contained">بستن</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TerminalWaybillMonitor() {
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['waybills', 'admin', page],
    queryFn: () => waybillsService.list({ page: String(page), limit: '20' }),
    refetchInterval: 15000,
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <MainLayout>
      <PageHeader title="پایش حواله‌ها" subtitle={`${total} حواله`} />

      {isLoading ? <LoadingSpinner /> : (
        <>
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>شماره حواله</TableCell>
                  <TableCell>کد مرجع</TableCell>
                  <TableCell>نوع بار</TableCell>
                  <TableCell>مبدأ → مقصد</TableCell>
                  <TableCell>وزن</TableCell>
                  <TableCell>کرایه</TableCell>
                  <TableCell>راننده</TableCell>
                  <TableCell>موبایل راننده</TableCell>
                  <TableCell>تاریخ صدور</TableCell>
                  <TableCell>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((w: {
                  id: string; waybillNumber: string; issuedAt: string;
                  cargo: { referenceCode: string; cargoType: string; originProvince: string; destProvince: string; weight: number; unit: string; fare?: number };
                  appointment: { driver: { user: { name: string; phone: string }; vehicles: { plate: string }[] } };
                }) => (
                  <TableRow key={w.id} hover>
                    <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={600}>{w.waybillNumber}</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontFamily="monospace">{w.cargo.referenceCode}</Typography></TableCell>
                    <TableCell>{w.cargo.cargoType}</TableCell>
                    <TableCell>{w.cargo.originProvince} ← {w.cargo.destProvince}</TableCell>
                    <TableCell>{w.cargo.weight} {w.cargo.unit}</TableCell>
                    <TableCell>{w.cargo.fare ? `${w.cargo.fare.toLocaleString('fa-IR')} ریال` : '-'}</TableCell>
                    <TableCell>{w.appointment.driver.user.name}</TableCell>
                    <TableCell dir="ltr" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{w.appointment.driver.user.phone}</TableCell>
                    <TableCell><Typography variant="caption">{toJalaliDateTime(w.issuedAt)}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setViewId(w.id)}>مشاهده</Button>
                        <Button size="small" color="primary" startIcon={<PrintIcon />}
                          onClick={async () => { const r = await waybillsService.get(w.id); printWaybill(r.data); }}>چاپ</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={10} align="center">
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
        </>
      )}

      {viewId && <WaybillDetailDialog waybillId={viewId} onClose={() => setViewId(null)} />}
    </MainLayout>
  );
}
