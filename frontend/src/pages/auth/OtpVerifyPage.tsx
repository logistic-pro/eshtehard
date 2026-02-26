import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { authService } from '../../services/auth.service';

export default function OtpVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const phone = (location.state as { phone: string })?.phone ?? '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(120);

  useEffect(() => { if (!phone) navigate('/login'); }, [phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await authService.verifyOtp(phone, code);
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'کد تأیید نامعتبر است');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try { await authService.sendOtp(phone); setCountdown(120); }
    catch { setError('خطا در ارسال مجدد کد'); }
    finally { setResending(false); }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="background.default">
      <Card elevation={4} sx={{ width: '100%', maxWidth: 400, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>تأیید شماره موبایل</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            کد ۶ رقمی ارسال‌شده به {phone} را وارد کنید
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth label="کد تأیید" value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ dir: 'ltr', maxLength: 6, style: { textAlign: 'center', fontSize: 24, letterSpacing: 10 } }}
            sx={{ mb: 3 }}
          />
          <Button fullWidth variant="contained" size="large" onClick={handleVerify}
            disabled={loading || code.length !== 6}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
            {loading ? 'در حال تأیید...' : 'تأیید و ورود'}
          </Button>
          <Box textAlign="center" mt={2}>
            {countdown > 0
              ? <Typography variant="body2" color="text.secondary">ارسال مجدد تا {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</Typography>
              : <Button size="small" onClick={handleResend} disabled={resending}>{resending ? 'در حال ارسال...' : 'ارسال مجدد کد'}</Button>
            }
          </Box>
          <Button fullWidth variant="text" onClick={() => navigate('/login')} sx={{ mt: 1 }}>تغییر شماره موبایل</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
