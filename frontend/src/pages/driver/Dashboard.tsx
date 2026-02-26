import { useQuery } from '@tanstack/react-query';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../../components/layout/MainLayout';
import StatCard from '../../components/ui/StatCard';
import UserInfoBanner from '../../components/ui/UserInfoBanner';
import { appointmentsService } from '../../services/appointments.service';
import { RootState } from '../../store';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const { data } = useQuery({ queryKey: ['appointments', 'driver'], queryFn: () => appointmentsService.list() });
  const appts = data?.data?.items ?? [];
  const pending = appts.filter((a: { status: string }) => a.status === 'PENDING').length;
  const completed = appts.filter((a: { status: string }) => a.status === 'COMPLETED').length;

  return (
    <MainLayout>
      <UserInfoBanner />
      <Typography variant="h5" fontWeight={700} mb={1}>خوش آمدید، {user?.name}</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>وضعیت نوبت‌ها و بارهای شما</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6}>
          <StatCard title="نوبت‌های فعال" value={pending} icon={<EventNoteIcon fontSize="large" />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard title="حمل‌های انجام‌شده" value={completed} icon={<LocalShippingIcon fontSize="large" />} color="#388e3c" />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        {[
          { label: 'مشاهده بارها', sub: 'لیست بارهای موجود بر اساس استان', path: '/driver/cargo', icon: <LocalShippingIcon sx={{ fontSize: 48, color: 'primary.main' }} /> },
          { label: 'نوبت‌های من', sub: 'مشاهده نوبت‌ها و حواله‌ها', path: '/driver/appointments', icon: <EventNoteIcon sx={{ fontSize: 48, color: 'secondary.main' }} /> },
        ].map(item => (
          <Grid item xs={12} sm={6} key={item.path}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate(item.path)}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                {item.icon}
                <Typography variant="h6" mt={1}>{item.label}</Typography>
                <Typography variant="body2" color="text.secondary">{item.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </MainLayout>
  );
}
