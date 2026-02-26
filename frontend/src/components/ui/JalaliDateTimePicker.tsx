import { useState } from 'react';
import {
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Grid, IconButton, Typography, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import moment from 'moment-jalaali';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const DOW    = ['ش','ی','د','س','چ','پ','ج'];

interface Props {
  label: string;
  value: string | undefined;
  onChange: (isoString: string) => void;
  helperText?: string;
  fullWidth?: boolean;
}

export default function JalaliDateTimePicker({ label, value, onChange, helperText, fullWidth = true }: Props) {
  const parse = (iso?: string) => {
    const m = iso ? moment(iso) : moment();
    return { jy: m.jYear(), jm: m.jMonth(), jd: m.jDate(), h: m.hours(), min: m.minutes() };
  };

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear]   = useState(() => parse(value).jy);
  const [viewMonth, setViewMonth] = useState(() => parse(value).jm);
  const [sel, setSel] = useState<{ jy: number; jm: number; jd: number } | null>(
    value ? { jy: parse(value).jy, jm: parse(value).jm, jd: parse(value).jd } : null
  );
  const [hour, setHour]     = useState(() => parse(value).h);
  const [minute, setMinute] = useState(() => parse(value).min);

  const displayValue = value ? moment(value).format('jYYYY/jMM/jDD HH:mm') : '';

  const daysInMonth = (jy: number, jm: number) =>
    jm < 6 ? 31 : jm < 11 ? 30 : (moment.jIsLeapYear(jy) ? 30 : 29);

  // Iran: week starts Saturday → moment.day() Saturday=6 → (day+1)%7 = 0
  const firstDow = (jy: number, jm: number) =>
    (moment(`${jy}/${jm + 1}/1`, 'jYYYY/jM/jD').day() + 1) % 7;

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const handleOpen = () => {
    const p = parse(value);
    setViewYear(p.jy); setViewMonth(p.jm);
    setSel(value ? { jy: p.jy, jm: p.jm, jd: p.jd } : null);
    setHour(p.h); setMinute(p.min);
    setOpen(true);
  };

  const handleConfirm = () => {
    if (!sel) return;
    const m = moment(`${sel.jy}/${sel.jm + 1}/${sel.jd} ${hour}:${minute}`, 'jYYYY/jM/jD H:m');
    onChange(m.toISOString());
    setOpen(false);
  };

  const days = daysInMonth(viewYear, viewMonth);
  const startDow = firstDow(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel = (d: number) => sel?.jd === d && sel.jm === viewMonth && sel.jy === viewYear;
  const toFa = (n: number) => n.toLocaleString('fa-IR');

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        label={label}
        value={displayValue}
        onClick={handleOpen}
        placeholder="انتخاب تاریخ و ساعت"
        helperText={helperText}
        InputProps={{ readOnly: true, endAdornment: <CalendarMonthIcon color="action" sx={{ cursor: 'pointer' }} /> }}
        sx={{ cursor: 'pointer' }}
      />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0.5 }}>انتخاب تاریخ و ساعت</DialogTitle>
        <DialogContent>
          {/* Month nav */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <IconButton size="small" onClick={nextMonth}><ChevronRightIcon /></IconButton>
            <Typography fontWeight={700} fontSize={15}>
              {MONTHS[viewMonth]} {toFa(viewYear)}
            </Typography>
            <IconButton size="small" onClick={prevMonth}><ChevronLeftIcon /></IconButton>
          </Box>

          {/* Day-of-week headers */}
          <Grid container columns={7} sx={{ mb: 0.5 }}>
            {DOW.map(d => (
              <Grid item xs={1} key={d}>
                <Typography variant="caption" textAlign="center" display="block" color="text.secondary" fontWeight={700}>
                  {d}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Day cells */}
          <Grid container columns={7}>
            {cells.map((day, i) => (
              <Grid item xs={1} key={i} sx={{ p: '2px' }}>
                {day !== null ? (
                  <Button
                    fullWidth size="small"
                    variant={isSel(day) ? 'contained' : 'text'}
                    onClick={() => setSel({ jy: viewYear, jm: viewMonth, jd: day })}
                    sx={{ minWidth: 0, p: 0.5, fontSize: 12, borderRadius: '50%', aspectRatio: '1' }}
                  >
                    {toFa(day)}
                  </Button>
                ) : <Box sx={{ aspectRatio: '1' }} />}
              </Grid>
            ))}
          </Grid>

          {/* Time */}
          <Box display="flex" gap={2} mt={2} alignItems="center" justifyContent="center">
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>ساعت</InputLabel>
              <Select value={hour} label="ساعت" onChange={e => setHour(Number(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => (
                  <MenuItem key={i} value={i}>{toFa(i).padStart(2, '۰')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography fontWeight={700}>:</Typography>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>دقیقه</InputLabel>
              <Select value={minute} label="دقیقه" onChange={e => setMinute(Number(e.target.value))}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <MenuItem key={m} value={m}>{toFa(m).padStart(2, '۰')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>انصراف</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={!sel}>تأیید</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
