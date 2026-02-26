import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { authService } from '../../services/auth.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);

  const isValid = /^09[0-9]{9}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    setPendingApproval(false);
    try {
      const res = await authService.sendOtp(phone);
      if (res.data?.registered) {
        // New user — registered, now waiting for admin approval
        setPendingApproval(true);
      } else {
        navigate('/otp', { state: { phone } });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در ارسال کد تأیید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
      <Card elevation={4} sx={{ width: '100%', maxWidth: 420, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <LocalShippingIcon sx={{ fontSize: 56, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700} mt={1}>سامانه پایانه بار اشتهارد</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              شماره موبایل خود را وارد کنید
            </Typography>
          </Box>

          {pendingApproval ? (
            <Box textAlign="center" py={2}>
              <HourglassEmptyIcon sx={{ fontSize: 52, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" fontWeight={600} color="warning.dark" mb={1}>
                ثبت‌نام شما انجام شد
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                حساب کاربری شما برای شماره <Box component="span" dir="ltr" fontFamily="monospace">{phone}</Box> ایجاد شد.
                پس از تأیید توسط مدیر پایانه می‌توانید وارد شوید.
              </Typography>
              <Button variant="outlined" onClick={() => { setPendingApproval(false); setPhone(''); }}>
                بازگشت
              </Button>
            </Box>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth label="شماره موبایل" placeholder="09xxxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  inputProps={{ dir: 'ltr', maxLength: 11 }}
                  error={phone.length > 0 && !isValid}
                  helperText={phone.length > 0 && !isValid ? 'شماره موبایل نامعتبر است' : ''}
                  sx={{ mb: 3 }}
                />
                <Button fullWidth variant="contained" size="large" type="submit"
                  disabled={loading || !isValid}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
                  {loading ? 'در حال بررسی...' : 'ادامه'}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
