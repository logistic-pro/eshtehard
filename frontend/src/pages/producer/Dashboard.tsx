import { useQuery } from '@tanstack/react-query';
import { Grid, Card, CardContent, Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import StatCard from '../../components/ui/StatCard';
import UserInfoBanner from '../../components/ui/UserInfoBanner';
import { cargoService } from '../../services/cargo.service';

export default function ProducerDashboard() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['cargo', 'producer'], queryFn: () => cargoService.list() });
  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const delivered = items.filter((c: { status: string }) => c.status === 'DELIVERED').length;
  const pending = items.filter((c: { status: string }) => ['DRAFT', 'SUBMITTED'].includes(c.status)).length;

  return (
    <MainLayout>
      <UserInfoBanner />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>داشبورد تولیدکننده</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/producer/new-cargo')}>
          ثبت بار جدید
        </Button>
      </Box>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <StatCard title="کل بارها" value={total} icon={<LocalShippingIcon fontSize="large" />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="تحویل داده شده" value={delivered} icon={<CheckCircleIcon fontSize="large" />} color="#388e3c" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="در انتظار" value={pending} icon={<PendingIcon fontSize="large" />} color="#f57c00" />
        </Grid>
      </Grid>
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>آخرین بارها</Typography>
          {items.slice(0, 5).map((c: { id: string; referenceCode: string; cargoType: string; status: string }) => (
            <Box key={c.id} display="flex" justifyContent="space-between" py={1} borderBottom="1px solid #eee">
              <Typography>{c.cargoType}</Typography>
              <Typography variant="body2" color="text.secondary">{c.referenceCode}</Typography>
              <Typography variant="body2">{c.status}</Typography>
            </Box>
          ))}
          {items.length === 0 && <Typography color="text.secondary">هنوز باری ثبت نشده است</Typography>}
          <Button variant="text" onClick={() => navigate('/producer/cargo')} sx={{ mt: 1 }}>مشاهده همه</Button>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
