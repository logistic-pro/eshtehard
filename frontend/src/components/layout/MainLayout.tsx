import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton,
  useTheme, useMediaQuery, Avatar, Menu, MenuItem, Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddBoxIcon from '@mui/icons-material/AddBox';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DescriptionIcon from '@mui/icons-material/Description';
import FactoryIcon from '@mui/icons-material/Factory';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { authService } from '../../services/auth.service';

const DRAWER_WIDTH = 256;

const NAV: Record<string, { label: string; path: string; icon: React.ReactNode }[]> = {
  DRIVER: [
    { label: 'داشبورد', path: '/driver', icon: <DashboardIcon /> },
    { label: 'لیست بارها', path: '/driver/cargo', icon: <LocalShippingIcon /> },
    { label: 'نوبت‌های من', path: '/driver/appointments', icon: <EventNoteIcon /> },
  ],
  FREIGHT_COMPANY: [
    { label: 'داشبورد', path: '/freight', icon: <DashboardIcon /> },
    { label: 'درخواست‌های بار', path: '/freight/cargo-requests', icon: <LocalShippingIcon /> },
    { label: 'ارسال به سالن', path: '/freight/hall-dispatch', icon: <MeetingRoomIcon /> },
    { label: 'صدور نوبت', path: '/freight/appointments', icon: <EventNoteIcon /> },
    { label: 'رانندگان و ناوگان', path: '/freight/drivers', icon: <PeopleIcon /> },
    { label: 'حواله‌ها', path: '/freight/waybills', icon: <DescriptionIcon /> },
    { label: 'گزارشات', path: '/freight/reports', icon: <AssessmentIcon /> },
  ],
  PRODUCER: [
    { label: 'داشبورد', path: '/producer', icon: <DashboardIcon /> },
    { label: 'ثبت بار جدید', path: '/producer/new-cargo', icon: <AddBoxIcon /> },
    { label: 'بارهای من', path: '/producer/cargo', icon: <LocalShippingIcon /> },
    { label: 'آپلود اکسل', path: '/producer/bulk-upload', icon: <UploadFileIcon /> },
  ],
  TERMINAL_ADMIN: [
    { label: 'داشبورد', path: '/terminal', icon: <DashboardIcon /> },
    { label: 'پایش بارها', path: '/terminal/cargo', icon: <LocalShippingIcon /> },
    { label: 'رانندگان و ناوگان', path: '/terminal/drivers', icon: <PeopleIcon /> },
    { label: 'پایش باربری‌ها', path: '/terminal/freight', icon: <DirectionsBusIcon /> },
    { label: 'پایش تولیدی‌ها', path: '/terminal/producers', icon: <FactoryIcon /> },
    { label: 'سالن‌ها', path: '/terminal/halls', icon: <MeetingRoomIcon /> },
    { label: 'کاربران', path: '/terminal/users', icon: <AccountCircleIcon /> },
    { label: 'حواله‌ها', path: '/terminal/waybills', icon: <DescriptionIcon /> },
    { label: 'گزارشات', path: '/terminal/reports', icon: <AssessmentIcon /> },
    { label: 'لاگ سیستم', path: '/terminal/audit-log', icon: <HistoryIcon /> },
  ],
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const navItems = NAV[user?.role ?? ''] ?? [];

  const handleLogout = async () => {
    await authService.logout().catch(() => null);
    dispatch(logout());
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="subtitle1" fontWeight={700} fontSize={13} lineHeight={1.4}>
          سامانه پایانه بار اشتهارد
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>{user?.name}</Typography>
      </Box>
      <List sx={{ flex: 1, pt: 1, overflow: 'auto' }}>
        {navItems.map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
              sx={{ borderRadius: 1, mx: 1, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.50', color: 'primary.main' } }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ mx: 1, borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="خروج" primaryTypographyProps={{ fontSize: 13 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar variant="dense" sx={{ minHeight: 56 }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ ml: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 600, fontSize: { xs: 13, md: 15 } }}>
            سامانه مدیریت پایانه بار اشتهارد
          </Typography>
          <IconButton color="inherit" onClick={e => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: 'secondary.main' }}>
              {user?.name?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled><Typography fontSize={13}>{user?.name}</Typography></MenuItem>
            <MenuItem disabled><Typography fontSize={12} color="text.secondary">{user?.phone}</Typography></MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}><LogoutIcon fontSize="small" sx={{ mr: 1 }} />خروج</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        anchor="right"
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, mt: { md: '56px' }, borderLeft: '1px solid rgba(0,0,0,0.12)', borderRight: 'none', boxSizing: 'border-box' } }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          mt: '56px',
          mr: { md: `${DRAWER_WIDTH}px` },
          minWidth: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
