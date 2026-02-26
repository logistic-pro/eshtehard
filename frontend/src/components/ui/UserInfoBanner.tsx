import { Box, Avatar, Typography, Chip } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fa } from '../../i18n/fa';

const roleColors: Record<string, string> = {
  DRIVER: '#1976d2',
  FREIGHT_COMPANY: '#7b1fa2',
  PRODUCER: '#388e3c',
  TERMINAL_ADMIN: '#d32f2f',
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  SUSPENDED: 'error',
};

export default function UserInfoBanner() {
  const { user } = useSelector((s: RootState) => s.auth);
  if (!user) return null;

  const roleLabel = (fa as Record<string, string>)[user.role] ?? user.role;
  const statusLabel = (fa as Record<string, string>)[user.status] ?? user.status;
  const avatarColor = roleColors[user.role] ?? '#555';
  const initials = user.name.trim().slice(0, 2);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      p={2.5}
      mb={3}
      borderRadius={2}
      sx={{ bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}
    >
      <Avatar sx={{ bgcolor: avatarColor, width: 52, height: 52, fontSize: 20, fontWeight: 700 }}>
        {initials}
      </Avatar>
      <Box flex={1}>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{user.name}</Typography>
        <Typography variant="body2" color="text.secondary" dir="ltr">{user.phone}</Typography>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.8}>
        <Chip
          label={roleLabel}
          size="small"
          sx={{ bgcolor: avatarColor, color: '#fff', fontWeight: 600, fontSize: 12 }}
        />
        <Chip
          label={statusLabel}
          size="small"
          color={statusColors[user.status] ?? 'default'}
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
      </Box>
    </Box>
  );
}
