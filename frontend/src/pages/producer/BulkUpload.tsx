import { useState, useRef } from 'react';
import { Box, Card, CardContent, Button, Typography, Alert, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/ui/PageHeader';
import { cargoService } from '../../services/cargo.service';

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await cargoService.bulkCreate(file);
      setResult(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'خطا در آپلود فایل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader title="آپلود گروهی بارها" subtitle="آپلود فایل اکسل برای ثبت همزمان چندین بار" showBack />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>راهنمای فایل اکسل</Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>فایل اکسل باید دارای ستون‌های زیر باشد:</Typography>
          <List dense>
            {['مبدأ استان', 'مبدأ شهر', 'مقصد استان', 'مقصد شهر', 'نوع بار', 'وزن', 'واحد (اختیاری)', 'توضیحات (اختیاری)'].map(col => (
              <ListItem key={col} sx={{ py: 0 }}>
                <ListItemText primary={`• ${col}`} primaryTypographyProps={{ fontSize: 13 }} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {result && <Alert severity="success" sx={{ mb: 2 }}>{result.count} بار با موفقیت ثبت شد</Alert>}

          <Box
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '2px dashed', borderColor: 'primary.main', borderRadius: 2,
              p: 4, textAlign: 'center', cursor: 'pointer', mb: 3,
              '&:hover': { bgcolor: 'primary.50' },
            }}
          >
            <UploadFileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography>{file ? file.name : 'کلیک کنید یا فایل را اینجا بکشید'}</Typography>
            <Typography variant="caption" color="text.secondary">فرمت‌های قابل قبول: .xlsx, .xls</Typography>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </Box>

          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <UploadFileIcon />}
              disabled={!file || loading}
              onClick={handleUpload}
            >
              {loading ? 'در حال آپلود...' : 'آپلود و ثبت'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
