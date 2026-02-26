import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Grid, Typography, Alert, CircularProgress, FormControlLabel, Switch, InputAdornment } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import JalaliDateTimePicker from '../../components/ui/JalaliDateTimePicker';
import { cargoService } from '../../services/cargo.service';

const schema = z.object({
  originProvince: z.string().min(2, 'الزامی'),
  originCity: z.string().min(2, 'الزامی'),
  destProvince: z.string().min(2, 'الزامی'),
  destCity: z.string().min(2, 'الزامی'),
  cargoType: z.string().min(2, 'الزامی'),
  weight: z.coerce.number().positive('باید مثبت باشد'),
  unit: z.string().default('تن'),
  description: z.string().optional(),
  isUrgent: z.boolean().default(false),
  truckCount: z.coerce.number().int().min(1).max(50).default(1),
  loadingDateTime: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewCargoRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as FormData | null) ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: prefill?.unit ?? 'تن',
      isUrgent: prefill?.isUrgent ?? false,
      truckCount: 1,
      originProvince: prefill?.originProvince ?? '',
      originCity: prefill?.originCity ?? '',
      destProvince: prefill?.destProvince ?? '',
      destCity: prefill?.destCity ?? '',
      cargoType: prefill?.cargoType ?? '',
      weight: prefill?.weight ?? undefined,
      description: prefill?.description ?? '',
    },
  });

  const isUrgent = watch('isUrgent');
  const truckCount = watch('truckCount');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await cargoService.create(data);
      // Auto-submit all created cargo
      if (Array.isArray(res.data)) {
        await Promise.all(res.data.map((c: { id: string }) => cargoService.submit(c.id)));
        setSuccess(`${res.data.length} بار با موفقیت ثبت و ارسال شد`);
      } else {
        await cargoService.submit(res.data.id);
        setSuccess('بار با موفقیت ثبت و ارسال شد');
      }
      setTimeout(() => navigate('/producer/cargo'), 1500);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در ثبت بار');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader title={prefill ? 'تکرار بار قبلی' : 'ثبت بار جدید'} showBack />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>مبدأ و مقصد</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="استان مبدأ" {...register('originProvince')} error={!!errors.originProvince} helperText={errors.originProvince?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="شهر مبدأ" {...register('originCity')} error={!!errors.originCity} helperText={errors.originCity?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="استان مقصد" {...register('destProvince')} error={!!errors.destProvince} helperText={errors.destProvince?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="شهر مقصد" {...register('destCity')} error={!!errors.destCity} helperText={errors.destCity?.message} />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600} mb={2}>مشخصات بار</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="نوع بار" {...register('cargoType')} error={!!errors.cargoType} helperText={errors.cargoType?.message} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="وزن" type="number" {...register('weight')} error={!!errors.weight} helperText={errors.weight?.message} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField fullWidth label="واحد" {...register('unit')} defaultValue="تن" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="تعداد کامیون مورد نیاز" type="number"
                  {...register('truckCount')}
                  error={!!errors.truckCount}
                  helperText={truckCount > 1 ? `${truckCount} بار جداگانه ثبت می‌شود` : errors.truckCount?.message}
                  inputProps={{ min: 1, max: 50, dir: 'ltr' }}
                  InputProps={{ endAdornment: <InputAdornment position="end">کامیون</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <JalaliDateTimePicker
                  label="تاریخ و ساعت بارگیری"
                  value={watch('loadingDateTime')}
                  onChange={val => setValue('loadingDateTime', val)}
                  helperText="تاریخ و ساعت بارگیری (تقویم شمسی)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="توضیحات" {...register('description')} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={isUrgent} onChange={e => setValue('isUrgent', e.target.checked)} />}
                  label="بار فوری"
                />
              </Grid>
            </Grid>

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate(-1)}>انصراف</Button>
              <Button variant="contained" type="submit" disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}>
                {loading ? 'در حال ثبت...' : truckCount > 1 ? `ثبت ${truckCount} بار و ارسال` : 'ثبت و ارسال بار'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
