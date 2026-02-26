import { useQuery } from '@tanstack/react-query';
import { Grid, Card, CardContent, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { reportsService } from '../../services/reports.service';
import { fa } from '../../i18n/fa';

const COLORS = ['#1976d2','#388e3c','#f57c00','#7b1fa2','#d32f2f','#0288d1'];

export default function TerminalReports() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['reports', 'cargo'], queryFn: reportsService.cargoSummary });
  const { data: driverPerf } = useQuery({ queryKey: ['reports', 'drivers'], queryFn: () => reportsService.driverPerformance(10) });
  const { data: hallActivity } = useQuery({ queryKey: ['reports', 'halls'], queryFn: reportsService.hallActivity });

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  const byStatus = (summary?.data?.byStatus ?? []).map((s: { status: string; _count: { id: number } }) => ({
    name: (fa as Record<string, string>)[s.status] ?? s.status, value: s._count.id,
  }));

  const byProvince = (summary?.data?.byProvince ?? []).map((s: { originProvince: string; _count: { id: number } }) => ({
    name: s.originProvince, count: s._count.id,
  }));

  const topDrivers = driverPerf?.data ?? [];
  const hallStats = hallActivity?.data ?? [];

  return (
    <MainLayout>
      <PageHeader title="گزارشات تفصیلی" subtitle={`مجموع ${summary?.data?.total ?? 0} بار ثبت‌شده`} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>توزیع وضعیت بارها</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byStatus} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={e => `${e.name}: ${e.value}`}>
                    {byStatus.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>بارها بر اساس استان مبدأ</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byProvince}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis /><Tooltip />
                  <Bar dataKey="count" fill="#1976d2" name="تعداد" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>برترین رانندگان</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>راننده</TableCell>
                      <TableCell>موبایل</TableCell>
                      <TableCell>تعداد حمل</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topDrivers.map((d: { driverId: string; _count: { id: number }; driver?: { user: { name: string; phone: string } } }, i: number) => (
                      <TableRow key={d.driverId}>
                        <TableCell>#{i + 1} {d.driver?.user.name ?? '-'}</TableCell>
                        <TableCell dir="ltr">{d.driver?.user.phone ?? '-'}</TableCell>
                        <TableCell>{d._count.id}</TableCell>
                      </TableRow>
                    ))}
                    {topDrivers.length === 0 && <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">داده‌ای یافت نشد</Typography></TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>فعالیت سالن‌ها</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>سالن</TableCell>
                      <TableCell>تعداد اعلان</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hallStats.map((h: { hallId: string; _count: { id: number }; hall?: { name: string } }) => (
                      <TableRow key={h.hallId}>
                        <TableCell>{h.hall?.name ?? '-'}</TableCell>
                        <TableCell>{h._count.id}</TableCell>
                      </TableRow>
                    ))}
                    {hallStats.length === 0 && <TableRow><TableCell colSpan={2} align="center"><Typography color="text.secondary">داده‌ای یافت نشد</Typography></TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainLayout>
  );
}
