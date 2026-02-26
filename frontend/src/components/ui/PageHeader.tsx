import { Box, Typography, Button } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  showBack?: boolean;
}

export default function PageHeader({ title, subtitle, action, showBack }: Props) {
  const navigate = useNavigate();
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
      <Box display="flex" alignItems="center" gap={1}>
        {showBack && (
          <Button size="small" startIcon={<ArrowForwardIcon />} onClick={() => navigate(-1)}>بازگشت</Button>
        )}
        <Box>
          <Typography variant="h5" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
      {action && (
        <Button variant="contained" startIcon={action.icon} onClick={action.onClick}>{action.label}</Button>
      )}
    </Box>
  );
}
