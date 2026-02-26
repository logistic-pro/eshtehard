import { useQuery } from '@tanstack/react-query';
import { Grid, Typography, Card, CardContent, Box } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PendingIcon from '@mui/icons-material/Pending';
import MainLayout from '../../components/layout/MainLayout';
import StatCard from '../../components/ui/StatCard';
import UserInfoBanner from '../../components/ui/UserInfoBanner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { reportsService } from '../../services/reports.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fa } from '../../i18n/fa';

export default function TerminalDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'dashboard'], queryFn: reportsService.dashboard });
  const { data: summary } = useQuery({ queryKey: ['reports', 'cargo'], queryFn: reportsService.cargoSummary });

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  const stats = data?.data ?? {};
  const byStatus = (summary?.data?.byStatus ?? []).map((s: { status: string; _count: { id: number } }) => ({
    name: (fa as Record<string, string>)[s.status] ?? s.status,
    تعداد: s._count.id,
  }));

  return (
    <MainLayout>
      <UserInfoBanner />
      <Typography variant="h5" fontWeight={700} mb={3}>داشبورد مدیر پایانه</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={6} sm={3}><StatCard title="کل بارها" value={stats.totalCargo ?? 0} icon={<LocalShippingIcon fontSize="large" />} color="#1976d2" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="رانندگان" value={stats.totalDrivers ?? 0} icon={<PeopleIcon fontSize="large" />} color="#388e3c" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="باربری‌ها" value={stats.totalFreight ?? 0} icon={<BusinessIcon fontSize="large" />} color="#7b1fa2" /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="بارهای در انتظار" value={stats.pendingCargo ?? 0} icon={<PendingIcon fontSize="large" />} color="#f57c00" /></Grid>
      </Grid>
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>وضعیت بارها</Typography>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byStatus}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="تعداد" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
