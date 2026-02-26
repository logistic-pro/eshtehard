import { useQuery } from '@tanstack/react-query';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { reportsService } from '../../services/reports.service';
import { fa } from '../../i18n/fa';

const COLORS = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#d32f2f','#0288d1','#558b2f','#e64a19'];

export default function FreightReports() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['reports', 'cargo'], queryFn: reportsService.cargoSummary });
  const { data: perf } = useQuery({ queryKey: ['reports', 'drivers'], queryFn: () => reportsService.driverPerformance(10) });

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  const byStatus = (summary?.data?.byStatus ?? []).map((s: { status: string; _count: { id: number } }) => ({
    name: (fa as Record<string, string>)[s.status] ?? s.status,
    value: s._count.id,
  }));

  const byProvince = (summary?.data?.byProvince ?? []).map((s: { originProvince: string; _count: { id: number } }) => ({
    name: s.originProvince,
    count: s._count.id,
  }));

  return (
    <MainLayout>
      <PageHeader title="گزارشات" subtitle={`مجموع ${summary?.data?.total ?? 0} بار`} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>وضعیت بارها</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={byStatus} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={e => e.name}>
                    {byStatus.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>بارها بر اساس استان مبدأ</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byProvince}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" name="تعداد" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
}
