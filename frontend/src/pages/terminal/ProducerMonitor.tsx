import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, Box,
} from '@mui/material';
import api from '../../services/api';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type ProducerItem = {
  id: string;
  companyName: string;
  total: number;
  submitted: number;
  delivered: number;
  cancelled: number;
  user: { name: string; phone: string; isActive: boolean };
};

export default function TerminalProducerMonitor() {
  const { data, isLoading } = useQuery({
    queryKey: ['producer-stats'],
    queryFn: () => api.get('/reports/producer-stats'),
  });

  const items: ProducerItem[] = data?.data ?? [];

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="پایش تولیدی‌ها" subtitle={`${items.length} شرکت تولیدی`} />
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>نام شرکت</TableCell>
              <TableCell>مدیر</TableCell>
              <TableCell>موبایل</TableCell>
              <TableCell align="center">کل بار</TableCell>
              <TableCell align="center">در انتظار</TableCell>
              <TableCell align="center">تحویل شده</TableCell>
              <TableCell align="center">لغو شده</TableCell>
              <TableCell>وضعیت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell><Typography variant="body2" fontWeight={600}>{p.companyName}</Typography></TableCell>
                <TableCell>{p.user.name}</TableCell>
                <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{p.user.phone}</TableCell>
                <TableCell align="center"><Chip label={p.total} size="small" /></TableCell>
                <TableCell align="center"><Chip label={p.submitted} color={p.submitted > 0 ? 'warning' : 'default'} size="small" /></TableCell>
                <TableCell align="center"><Chip label={p.delivered} color={p.delivered > 0 ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell align="center"><Chip label={p.cancelled} color={p.cancelled > 0 ? 'error' : 'default'} size="small" /></TableCell>
                <TableCell>
                  <Chip label={p.user.isActive ? 'فعال' : 'غیرفعال'} color={p.user.isActive ? 'success' : 'error'} size="small" />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">
                <Typography color="text.secondary" py={3}>تولیدی‌ای یافت نشد</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
  );
}
