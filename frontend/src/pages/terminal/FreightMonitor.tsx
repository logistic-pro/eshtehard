import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Divider,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../services/api';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type FreightItem = {
  id: string;
  companyName: string;
  deliveredLastWeek: number;
  deliveredLastMonth: number;
  activeCount: number;
  user: { name: string; phone: string; isActive: boolean };
};

type MonthlyStats = {
  deliveredLastMonth: number;
  deliveredLastWeek: number;
  inTransit: number;
  total: number;
};

export default function TerminalFreightMonitor() {
  const [statsDialog, setStatsDialog] = useState<FreightItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['freight-stats'],
    queryFn: () => api.get('/reports/freight-stats'),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['freight-monthly', statsDialog?.id],
    queryFn: () => api.get('/reports/freight-stats', { params: { freightId: statsDialog!.id } }),
    enabled: !!statsDialog,
  });

  const items: FreightItem[] = data?.data ?? [];
  const monthly: MonthlyStats | null = monthlyData?.data ?? null;

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="پایش باربری‌ها" subtitle={`${items.length} باربری`} />
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>نام شرکت</TableCell>
              <TableCell>موبایل</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell align="center">بار هفته گذشته</TableCell>
              <TableCell align="center">بار فعال</TableCell>
              <TableCell align="center">آمار ماهانه</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((f) => (
              <TableRow key={f.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{f.companyName}</Typography>
                  <Typography variant="caption" color="text.secondary">{f.user.name}</Typography>
                </TableCell>
                <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{f.user.phone}</TableCell>
                <TableCell>
                  <Chip label={f.user.isActive ? 'فعال' : 'غیرفعال'} color={f.user.isActive ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={f.deliveredLastWeek}
                    color={f.deliveredLastWeek > 0 ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip label={f.activeCount} color={f.activeCount > 0 ? 'primary' : 'default'} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small" variant="outlined" startIcon={<BarChartIcon />}
                    onClick={() => setStatsDialog(f)}
                  >
                    آمار
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">
                <Typography color="text.secondary" py={3}>باربری‌ای یافت نشد</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!statsDialog} onClose={() => setStatsDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <span>آمار حمل بار — {statsDialog?.companyName}</span>
            <IconButton size="small" onClick={() => setStatsDialog(null)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {!monthly ? <LoadingSpinner /> : (
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" justifyContent="space-between" mb={1.5}>
                <Typography variant="body2">کل بارهای ثبت شده</Typography>
                <Chip label={monthly.total} color="default" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1.5}>
                <Typography variant="body2">در حال حمل</Typography>
                <Chip label={monthly.inTransit} color="primary" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1.5}>
                <Typography variant="body2">تحویل شده — ۷ روز گذشته</Typography>
                <Chip label={monthly.deliveredLastWeek} color="success" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">تحویل شده — ۳۰ روز گذشته</Typography>
                <Chip label={monthly.deliveredLastMonth} color="success" variant="outlined" size="small" />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog(null)}>بستن</Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
