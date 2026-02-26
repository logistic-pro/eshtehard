import { Box, CircularProgress, Typography } from '@mui/material';
export default function LoadingSpinner({ text = 'در حال بارگذاری...' }: { text?: string }) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
      <CircularProgress />
      <Typography mt={2} color="text.secondary">{text}</Typography>
    </Box>
  );
}
