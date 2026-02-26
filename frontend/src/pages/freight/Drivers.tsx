import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, TextField, Chip, Pagination,
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { driversService } from '../../services/drivers.service';
import { fa } from '../../i18n/fa';

export default function FreightDrivers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, search],
    queryFn: () => driversService.list({ page: String(page), limit: '15', ...(search ? { search } : {}) }),
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 15);

  if (isLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader title="رانندگان و ناوگان" subtitle={`${total} راننده`} />
      <Box mb={2}>
        <TextField size="small" label="جستجو نام یا موبایل" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} sx={{ width: 300 }} />
      </Box>
      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>نام</TableCell>
              <TableCell>موبایل</TableCell>
              <TableCell>استان</TableCell>
              <TableCell>پلاک</TableCell>
              <TableCell>نوع ناوگان</TableCell>
              <TableCell>وضعیت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((d: {
              id: string;
              homeProvince?: string;
              user: { name: string; phone: string; isActive: boolean };
              vehicles: { plate: string; vehicleType: string; ownership: string }[];
            }) => {
              const v = d.vehicles?.[0];
              return (
                <TableRow key={d.id} hover>
                  <TableCell>{d.user.name}</TableCell>
                  <TableCell dir="ltr" sx={{ fontFamily: 'monospace' }}>{d.user.phone}</TableCell>
                  <TableCell>{d.homeProvince ?? '-'}</TableCell>
                  <TableCell dir="ltr">{v?.plate ?? '-'}</TableCell>
                  <TableCell>
                    {v ? (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <DirectionsBusIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">{(fa as Record<string, string>)[v.vehicleType] ?? v.vehicleType}</Typography>
                        <Chip label={(fa as Record<string, string>)[v.ownership]} size="small"
                          color={v.ownership === 'OWNED' ? 'primary' : 'warning'} sx={{ fontSize: 10 }} />
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={d.user.isActive ? 'فعال' : 'غیرفعال'}
                      color={d.user.isActive ? 'success' : 'error'} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">
                <Typography color="text.secondary" py={3}>رانندهای یافت نشده است</Typography>
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
    </MainLayout>
  );
}
