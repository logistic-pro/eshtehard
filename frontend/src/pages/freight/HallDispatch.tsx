import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Grid, Typography, Button, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Chip, IconButton, Tooltip,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { cargoService } from '../../services/cargo.service';
import { announcementsService, hallsService } from '../../services/halls.service';

export default function FreightHallDispatch() {
  const [open, setOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState('');
  const [selectedHall, setSelectedHall] = useState('');
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data: cargoData, isLoading: cargoLoading } = useQuery({
    queryKey: ['cargo', 'freight', 'accepted'],
    queryFn: () => cargoService.list({ status: 'ACCEPTED_BY_FREIGHT', limit: '100', orderBy: 'fare' }),
  });

  const { data: hallsData } = useQuery({
    queryKey: ['halls'],
    queryFn: () => hallsService.list(),
  });

  const { data: annData, isLoading: annLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsService.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => announcementsService.create({ cargoId: selectedCargo, hallId: selectedHall }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); qc.invalidateQueries({ queryKey: ['cargo'] }); setOpen(false); setError(''); },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => announcementsService.suspend(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => announcementsService.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const cargoItems = cargoData?.data?.items ?? [];
  const halls = hallsData?.data ?? [];
  const announcements = annData?.data?.items ?? [];

  if (cargoLoading || annLoading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <PageHeader
        title="اعلان بار در سالن"
        action={{ label: 'اعلان بار جدید', onClick: () => setOpen(true), icon: <AddIcon /> }}
      />

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>کد مرجع</TableCell>
              <TableCell>نوع بار</TableCell>
              <TableCell>سالن</TableCell>
              <TableCell>پایانه</TableCell>
              <TableCell>وضعیت</TableCell>
              <TableCell align="center">عملیات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {announcements.map((a: {
              id: string; isSuspended: boolean;
              cargo: { referenceCode: string; cargoType: string };
              hall: { name: string; terminal?: { name: string } };
            }) => (
              <TableRow key={a.id} hover>
                <TableCell><Typography variant="caption" fontFamily="monospace">{a.cargo.referenceCode}</Typography></TableCell>
                <TableCell>{a.cargo.cargoType}</TableCell>
                <TableCell>{a.hall.name}</TableCell>
                <TableCell>{a.hall.terminal?.name ?? '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={a.isSuspended ? 'متوقف' : 'فعال'}
                    color={a.isSuspended ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {a.isSuspended ? (
                    <Tooltip title="از سرگیری">
                      <IconButton size="small" color="success" onClick={() => resumeMutation.mutate(a.id)}>
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="توقف اعلان">
                      <IconButton size="small" color="error" onClick={() => suspendMutation.mutate(a.id)}>
                        <PauseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {announcements.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" py={3}>اعلانی یافت نشد</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>اعلان بار در سالن</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Alert severity="info" sx={{ mb: 2 }}>
            فقط بارهایی که کرایه آن‌ها تعیین شده قابل ارسال به سالن هستند.
          </Alert>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>انتخاب بار</InputLabel>
            <Select value={selectedCargo} label="انتخاب بار" onChange={e => setSelectedCargo(e.target.value)}>
              {cargoItems.map((c: { id: string; referenceCode: string; cargoType: string; fare?: number }) => (
                <MenuItem key={c.id} value={c.id} disabled={!c.fare}>
                  {c.cargoType} — {c.referenceCode} {c.fare ? `(${c.fare.toLocaleString('fa-IR')} ریال)` : '⚠️ بدون کرایه'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>انتخاب سالن</InputLabel>
            <Select value={selectedHall} label="انتخاب سالن" onChange={e => setSelectedHall(e.target.value)}>
              {halls.map((h: { id: string; name: string; province: string }) => (
                <MenuItem key={h.id} value={h.id}>{h.name} — {h.province}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={!selectedCargo || !selectedHall || createMutation.isPending}>
            اعلان
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
