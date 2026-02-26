import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Chip, Tabs, Tab, Tooltip, IconButton, Drawer,
  Divider, Badge,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusChip from '../../components/ui/StatusChip';
import { appointmentsService } from '../../services/appointments.service';
import { cargoService } from '../../services/cargo.service';
import { toJalaliDateTime } from '../../utils/jalali';

type DriverRequest = {
  id: string;
  status: string;
  priorityRank: number;
  daysSinceLast: number;
  totalDrivers: number;
  driver: { user: { name: string; phone: string }; vehicles: { plate: string; vehicleType: string }[] };
  cargo: { referenceCode: string; cargoType: string };
};

type CargoItem = {
  id: string; referenceCode: string; cargoType: string;
  originProvince: string; destProvince: string; status: string;
  loadingDateTime?: string;
};

export default function FreightAppointmentIssue() {
  const [tab, setTab] = useState<'cargos' | 'confirmed'>('cargos');
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approveDialog, setApproveDialog] = useState<{ id: string; driverName: string; loadingDateTime?: string } | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const qc = useQueryClient();

  // Cargos with pending driver requests
  const { data: cargoData, isLoading: cargoLoading } = useQuery({
    queryKey: ['cargo', 'freight', 'announced'],
    queryFn: () => cargoService.list({ status: 'ANNOUNCED_TO_HALL', limit: '50' }),
    enabled: tab === 'cargos',
    refetchInterval: 15000,
  });

  // Driver requests for selected cargo
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['driver-requests', selectedCargo?.id],
    queryFn: () => cargoService.getDriverRequests(selectedCargo!.id),
    enabled: !!selectedCargo,
  });

  // Confirmed appointments tab
  const { data: confirmedData, isLoading: confirmedLoading } = useQuery({
    queryKey: ['appointments', 'freight', 'confirmed'],
    queryFn: () => appointmentsService.list({ status: 'CONFIRMED', limit: '50' }),
    enabled: tab === 'confirmed',
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      appointmentsService.approve(id, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-requests'] });
      qc.invalidateQueries({ queryKey: ['cargo'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setApproveDialog(null);
      setNote('');
      setError('');
      setDrawerOpen(false);
      setSelectedCargo(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در تأیید درخواست');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-requests'] });
      qc.invalidateQueries({ queryKey: ['cargo'] });
    },
  });

  const cargoItems: CargoItem[] = cargoData?.data?.items ?? [];
  const requests: DriverRequest[] = requestsData?.data ?? [];
  const confirmedItems = confirmedData?.data?.items ?? [];

  const openDrawer = (cargo: CargoItem) => {
    setSelectedCargo(cargo);
    setDrawerOpen(true);
  };

  const rankColor = (rank: number) => rank === 1 ? 'error' : rank === 2 ? 'warning' : rank === 3 ? 'info' : 'default';

  return (
    <MainLayout>
      <PageHeader title="صدور نوبت" />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="بارهای فعال" value="cargos" />
          <Tab label="نوبت‌های تأیید شده" value="confirmed" />
        </Tabs>
      </Box>

      {tab === 'cargos' && (
        <>
          {cargoLoading ? <LoadingSpinner /> : (
            <TableContainer component={Card}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell>کد مرجع</TableCell>
                    <TableCell>نوع بار</TableCell>
                    <TableCell>مسیر</TableCell>
                    <TableCell>تاریخ بارگیری</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell align="center">درخواست رانندگان</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargoItems.map(c => (
                    <TableRow key={c.id} hover>
                      <TableCell><Typography variant="caption" fontFamily="monospace">{c.referenceCode}</Typography></TableCell>
                      <TableCell>{c.cargoType}</TableCell>
                      <TableCell>{c.originProvince} ← {c.destProvince}</TableCell>
                      <TableCell>
                        {c.loadingDateTime
                          ? toJalaliDateTime(c.loadingDateTime)
                          : '-'}
                      </TableCell>
                      <TableCell><StatusChip status={c.status} /></TableCell>
                      <TableCell align="center">
                        <Button
                          size="small" variant="outlined"
                          startIcon={<PeopleAltIcon />}
                          onClick={() => openDrawer(c)}
                        >
                          مشاهده رانندگان
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cargoItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary" py={3}>باری در وضعیت اعلان به سالن وجود ندارد</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === 'confirmed' && (
        confirmedLoading ? <LoadingSpinner /> : (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>راننده</TableCell>
                  <TableCell>نوع بار</TableCell>
                  <TableCell>تاریخ نوبت</TableCell>
                  <TableCell>پیامک</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {confirmedItems.map((a: { id: string; appointmentDate?: string; smsSent: boolean; cargo: { cargoType: string }; driver: { user: { name: string; phone: string } } }) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography variant="body2">{a.driver.user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.driver.user.phone}</Typography>
                    </TableCell>
                    <TableCell>{a.cargo.cargoType}</TableCell>
                    <TableCell>{toJalaliDateTime(a.appointmentDate)}</TableCell>
                    <TableCell>{a.smsSent ? '✅' : '—'}</TableCell>
                  </TableRow>
                ))}
                {confirmedItems.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" py={3}>نوبتی یافت نشد</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* Driver Requests Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedCargo(null); }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}>
        {selectedCargo && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>رانندگان متقاضی</Typography>
              <IconButton onClick={() => { setDrawerOpen(false); setSelectedCargo(null); }}><CloseIcon /></IconButton>
            </Box>
            <Box mb={2} p={1.5} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2"><strong>بار:</strong> {selectedCargo.cargoType}</Typography>
              <Typography variant="body2"><strong>مسیر:</strong> {selectedCargo.originProvince} ← {selectedCargo.destProvince}</Typography>
              {selectedCargo.loadingDateTime && (
                <Typography variant="body2" color="primary.main"><strong>زمان بارگیری:</strong> {toJalaliDateTime(selectedCargo.loadingDateTime)}</Typography>
              )}
              <Typography variant="caption" fontFamily="monospace" color="text.secondary">{selectedCargo.referenceCode}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {requestsLoading ? <LoadingSpinner /> : requests.length === 0 ? (
              <Alert severity="info">هنوز راننده‌ای درخواست حمل این بار را ثبت نکرده است</Alert>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Typography variant="caption" color="text.secondary" mb={1}>
                  رتبه‌بندی بر اساس مدت زمان انتظار از آخرین حمل
                </Typography>
                {requests.map((r) => (
                  <Card key={r.id} elevation={1} sx={{ borderRight: 3, borderColor: `${rankColor(r.priorityRank)}.main` }}>
                    <Box p={1.5}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            icon={<EmojiEventsIcon />}
                            label={`اولویت ${r.priorityRank}`}
                            color={rankColor(r.priorityRank) as 'error' | 'warning' | 'info' | 'default'}
                            size="small"
                          />
                          <Typography fontWeight={600}>{r.driver.user.name}</Typography>
                        </Box>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="تأیید">
                            <IconButton size="small" color="success"
                              onClick={() => setApproveDialog({ id: r.id, driverName: r.driver.user.name, loadingDateTime: selectedCargo?.loadingDateTime ? toJalaliDateTime(selectedCargo.loadingDateTime) : undefined })}>
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="رد درخواست">
                            <IconButton size="small" color="error"
                              onClick={() => rejectMutation.mutate(r.id)}
                              disabled={rejectMutation.isPending}>
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">{r.driver.user.phone}</Typography>
                      {r.driver.vehicles[0] && (
                        <Typography variant="caption" color="text.secondary">
                          پلاک: {r.driver.vehicles[0].plate} — {r.driver.vehicles[0].vehicleType}
                        </Typography>
                      )}
                      <Typography variant="caption" display="block" color={r.daysSinceLast === 99999 ? 'success.main' : 'text.secondary'} mt={0.5}>
                        {r.daysSinceLast === 99999 ? 'هنوز باری حمل نکرده (اولویت بالا)' : `${r.daysSinceLast} روز از آخرین حمل`}
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </Drawer>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onClose={() => { setApproveDialog(null); setError(''); }} maxWidth="xs" fullWidth>
        <DialogTitle>تأیید درخواست راننده</DialogTitle>
        <DialogContent>
          {approveDialog && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              راننده: <strong>{approveDialog.driverName}</strong>
            </Typography>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {approveDialog?.loadingDateTime && (
            <Alert severity="info" sx={{ mb: 2 }}>
              زمان نوبت: <strong>{approveDialog.loadingDateTime}</strong> (ثبت‌شده توسط تولیدی)
            </Alert>
          )}
          <TextField
            fullWidth label="یادداشت (اختیاری)" value={note}
            onChange={e => setNote(e.target.value)} multiline rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setApproveDialog(null); setError(''); }}>انصراف</Button>
          <Button
            variant="contained" color="success"
            onClick={() => approveDialog && approveMutation.mutate({ id: approveDialog.id, note })}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'در حال ذخیره...' : 'تأیید و ارسال پیامک'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
