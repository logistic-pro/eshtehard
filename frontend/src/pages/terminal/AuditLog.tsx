import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, Pagination, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';
import { toJalaliDateTime } from '../../utils/jalali';

const ACTIONS = ['LOGIN','CARGO_DRAFT','CARGO_SUBMITTED','CARGO_ACCEPTED_BY_FREIGHT','CARGO_ANNOUNCED_TO_HALL','CARGO_DRIVER_ASSIGNED','CARGO_IN_TRANSIT','CARGO_DELIVERED','CARGO_CANCELLED'];

const ACTION_FA: Record<string, string> = {
  LOGIN: 'ورود به سامانه',
  CARGO_DRAFT: 'ایجاد بار',
  CARGO_SUBMITTED: 'ارسال به باربری',
  CARGO_ACCEPTED_BY_FREIGHT: 'پذیرش توسط باربری',
  CARGO_ANNOUNCED_TO_HALL: 'اعلان در سالن',
  CARGO_DRIVER_ASSIGNED: 'تخصیص راننده',
  CARGO_IN_TRANSIT: 'شروع حمل',
  CARGO_DELIVERED: 'تحویل بار',
  CARGO_CANCELLED: 'لغو بار',
};

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'> = {
  LOGIN: 'info',
  CARGO_DELIVERED: 'success',
  CARGO_CANCELLED: 'error',
  CARGO_IN_TRANSIT: 'warning',
  CARGO_SUBMITTED: 'primary',
  CARGO_ACCEPTED_BY_FREIGHT: 'primary',
};

export default function TerminalAuditLog() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action],
    queryFn: () => api.get('/audit-logs', { params: { page: String(page), limit: '50', ...(action ? { action } : {}) } }),
    refetchInterval: 30000,
  });

  const items = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pageCount = Math.ceil(total / 50);

  return (
    <MainLayout>
      <PageHeader title="لاگ سیستم" subtitle={`${total} رویداد`} />

      <Card sx={{ mb: 2, p: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>نوع رویداد</InputLabel>
          <Select value={action} label="نوع رویداد" onChange={e => { setAction(e.target.value); setPage(1); }}>
            <MenuItem value="">همه</MenuItem>
            {ACTIONS.map(a => <MenuItem key={a} value={a}>{ACTION_FA[a] ?? a}</MenuItem>)}
          </Select>
        </FormControl>
      </Card>

      {isLoading ? <LoadingSpinner /> : (
        <>
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>تاریخ</TableCell>
                  <TableCell>رویداد</TableCell>
                  <TableCell>کاربر</TableCell>
                  <TableCell>موبایل</TableCell>
                  <TableCell>نقش</TableCell>
                  <TableCell>شناسه موجودیت</TableCell>
                  <TableCell>جزئیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((log: {
                  id: string;
                  action: string;
                  entityType: string;
                  entityId: string;
                  meta?: Record<string, unknown>;
                  createdAt: string;
                  user?: { name: string; phone: string; role: string };
                }) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="caption" dir="ltr" fontFamily="monospace">
                        {toJalaliDateTime(log.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={ACTION_FA[log.action] ?? log.action} size="small"
                        color={ACTION_COLORS[log.action] ?? 'default'} />
                    </TableCell>
                    <TableCell>{log.user?.name ?? '-'}</TableCell>
                    <TableCell dir="ltr" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{log.user?.phone ?? '-'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{log.user?.role ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                        {log.entityId?.slice(0, 8)}…
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {log.meta ? JSON.stringify(log.meta).slice(0, 60) : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>رویدادی یافت نشد</Typography>
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
