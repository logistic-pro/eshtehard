import { Chip } from '@mui/material';
import { fa } from '../../i18n/fa';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  DRAFT: 'default', SUBMITTED: 'info', ACCEPTED_BY_FREIGHT: 'primary',
  ANNOUNCED_TO_HALL: 'warning', DRIVER_ASSIGNED: 'secondary',
  IN_TRANSIT: 'warning', DELIVERED: 'success', CANCELLED: 'error',
  PENDING: 'default', CONFIRMED: 'success', COMPLETED: 'success',
  OPEN: 'info', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'default',
};

export default function StatusChip({ status }: { status: string }) {
  const label = (fa as Record<string, string>)[status] ?? status;
  return <Chip label={label} color={STATUS_COLORS[status] ?? 'default'} size="small" />;
}
