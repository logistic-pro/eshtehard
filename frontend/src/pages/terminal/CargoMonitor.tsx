import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, Pagination, FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusChip from '../../components/ui/StatusChip';
import { cargoService } from '../../services/cargo.service';
import { toJalaliDateTime } from '../../utils/jalali';
import { fa } from '../../i18n/fa';

const STATUSES = ['DRAFT','SUBMITTED','ACCEPTED_BY_FREIGHT','ANNOUNCED_TO_HALL','DRIVER_ASSIGNED','IN_TRANSIT','DELIVERED','CANCELLED'];

export default function TerminalCargoMonitor() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [province, setProvince] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cargo', 'admin', page, status, province],
    queryFn: () => cargoService.list({
      page: String(page), limit: '20',
      ...(status ? { status } : {}),
      ...(province ? { province } : {}),
    }),
    refetchInterval: 15000,
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <MainLayout>
      <PageHeader title="پایش بارها" subtitle={`${total} بار`} />

      <Card sx={{ mb: 2, p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>وضعیت</InputLabel>
            <Select value={status} label="وضعیت" onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <MenuItem value="">همه</MenuItem>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{fa[s as keyof typeof fa]}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="استان مبدأ" value={province}
            onChange={e => { setProvince(e.target.value); setPage(1); }} sx={{ width: 180 }} />
        </Box>
      </Card>

      {isLoading ? <LoadingSpinner /> : (
        <>
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>کد مرجع</TableCell>
                  <TableCell>نوع بار</TableCell>
                  <TableCell>مبدأ → مقصد</TableCell>
                  <TableCell>وزن</TableCell>
                  <TableCell>کرایه</TableCell>
                  <TableCell>تاریخ بارگیری</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell>تولیدی</TableCell>
                  <TableCell>باربری</TableCell>
                  <TableCell>راننده</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((c: {
                  id: string; referenceCode: string; cargoType: string;
                  originProvince: string; destProvince: string; weight: number; unit: string;
                  fare?: number; status: string; loadingDateTime?: string;
                  producer?: { user: { name: string; phone: string } };
                  freight?: { user: { name: string } };
                  appointments?: { driver: { user: { name: string; phone: string }; vehicles: { plate: string }[] } }[];
                }) => {
                  const driver = c.appointments?.[0]?.driver;
                  return (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography variant="caption" fontFamily="monospace">{c.referenceCode}</Typography></TableCell>
                    <TableCell>{c.cargoType}</TableCell>
                    <TableCell>{c.originProvince} ← {c.destProvince}</TableCell>
                    <TableCell>{c.weight} {c.unit}</TableCell>
                    <TableCell>{c.fare ? `${c.fare.toLocaleString('fa-IR')} ریال` : <Chip label="تعیین نشده" size="small" />}</TableCell>
                    <TableCell>{toJalaliDateTime(c.loadingDateTime)}</TableCell>
                    <TableCell><StatusChip status={c.status} /></TableCell>
                    <TableCell>{c.producer?.user?.name ?? '-'}</TableCell>
                    <TableCell>{c.freight?.user?.name ?? '-'}</TableCell>
                    <TableCell>
                      {driver ? (
                        <Box>
                          <Typography variant="body2">{driver.user.name}</Typography>
                          <Typography variant="caption" color="text.secondary" dir="ltr">{driver.user.phone}</Typography>
                          {driver.vehicles[0] && <Typography variant="caption" display="block" dir="ltr">{driver.vehicles[0].plate}</Typography>}
                        </Box>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                  );
                }
                ))}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" py={3}>باری یافت نشد</Typography>
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
    </MainLayout>
  );
}
