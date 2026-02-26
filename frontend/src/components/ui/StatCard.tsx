import { Card, CardContent, Typography, Box } from '@mui/material';

interface Props {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

export default function StatCard({ title, value, icon, color = '#1976d2' }: Props) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" fontWeight={700} mt={1}>{value}</Typography>
          </Box>
          <Box sx={{ color, bgcolor: `${color}22`, borderRadius: 2, p: 1.5, display: 'flex' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
