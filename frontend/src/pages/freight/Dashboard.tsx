import { useQuery } from '@tanstack/react-query';
import { Grid, Typography, Box, Card, CardContent, Button } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DescriptionIcon from '@mui/icons-material/Description';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import StatCard from '../../components/ui/StatCard';
import UserInfoBanner from '../../components/ui/UserInfoBanner';
import { cargoService } from '../../services/cargo.service';
import { appointmentsService } from '../../services/appointments.service';

export default function FreightDashboard() {
  const navigate = useNavigate();
  const { data: cargoData } = useQuery({ queryKey: ['cargo', 'freight'], queryFn: () => cargoService.list() });
  const { data: apptData } = useQuery({ queryKey: ['appointments', 'freight'], queryFn: () => appointmentsService.list() });

  const totalCargo = cargoData?.data?.total ?? 0;
  const totalAppts = apptData?.data?.total ?? 0;
  const pendingCargo = cargoData?.data?.items?.filter((c: { status: string }) => c.status === 'SUBMITTED').length ?? 0;

  return (
    <MainLayout>
      <UserInfoBanner />
      <Typography variant="h5" fontWeight={700} mb={3}>داشبورد باربری</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={3}>
          <StatCard title="کل بارها" value={totalCargo} icon={<LocalShippingIcon fontSize="large" />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <StatCard title="منتظر پذیرش" value={pendingCargo} icon={<LocalShippingIcon fontSize="large" />} color="#f57c00" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <StatCard title="نوبت‌ها" value={totalAppts} icon={<EventNoteIcon fontSize="large" />} color="#388e3c" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <StatCard title="حواله‌ها" value={0} icon={<DescriptionIcon fontSize="large" />} color="#7b1fa2" />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {[
          { label: 'درخواست‌های جدید', path: '/freight/cargo-requests', icon: <LocalShippingIcon />, color: '#1976d2' },
          { label: 'اعلان به سالن', path: '/freight/hall-dispatch', icon: <EventNoteIcon />, color: '#388e3c' },
          { label: 'صدور نوبت', path: '/freight/appointments', icon: <EventNoteIcon />, color: '#f57c00' },
          { label: 'مدیریت رانندگان', path: '/freight/drivers', icon: <PeopleIcon />, color: '#7b1fa2' },
        ].map(item => (
          <Grid item xs={12} sm={6} md={3} key={item.path}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate(item.path)}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                <Typography variant="body1" fontWeight={500}>{item.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </MainLayout>
  );
}
