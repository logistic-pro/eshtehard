import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ProtectedRoute from './ProtectedRoute';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import OtpVerifyPage from '../pages/auth/OtpVerifyPage';

// Driver pages
import DriverDashboard from '../pages/driver/Dashboard';
import DriverCargoList from '../pages/driver/CargoList';
import DriverAppointments from '../pages/driver/MyAppointments';

// Freight pages
import FreightDashboard from '../pages/freight/Dashboard';
import FreightCargoRequests from '../pages/freight/CargoRequests';
import FreightHallDispatch from '../pages/freight/HallDispatch';
import FreightAppointmentIssue from '../pages/freight/AppointmentIssue';
import FreightDrivers from '../pages/freight/Drivers';
import FreightFleet from '../pages/freight/Fleet';
import FreightWaybills from '../pages/freight/Waybills';
import FreightReports from '../pages/freight/Reports';

// Producer pages
import ProducerDashboard from '../pages/producer/Dashboard';
import ProducerNewCargo from '../pages/producer/NewCargoRequest';
import ProducerCargoList from '../pages/producer/MyCargoList';
import ProducerBulkUpload from '../pages/producer/BulkUpload';

// Terminal pages
import TerminalDashboard from '../pages/terminal/Dashboard';
import TerminalDriverMonitor from '../pages/terminal/DriverMonitor';
import TerminalFreightMonitor from '../pages/terminal/FreightMonitor';
import TerminalCargoMonitor from '../pages/terminal/CargoMonitor';
import TerminalProducerMonitor from '../pages/terminal/ProducerMonitor';
import TerminalHallManager from '../pages/terminal/HallManager';
import TerminalUserManagement from '../pages/terminal/UserManagement';
import TerminalReports from '../pages/terminal/Reports';
import TerminalAuditLog from '../pages/terminal/AuditLog';
import TerminalWaybillMonitor from '../pages/terminal/WaybillMonitor';

function RoleRedirect() {
  const { user } = useSelector((s: RootState) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = {
    DRIVER: '/driver',
    FREIGHT_COMPANY: '/freight',
    PRODUCER: '/producer',
    TERMINAL_ADMIN: '/terminal',
  };
  return <Navigate to={map[user.role] ?? '/login'} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpVerifyPage />} />
      <Route path="/unauthorized" element={<div style={{ padding: 40, textAlign: 'center' }}>دسترسی مجاز نیست</div>} />

      {/* Root redirect */}
      <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

      {/* Driver */}
      <Route path="/driver" element={<ProtectedRoute roles={['DRIVER']}><DriverDashboard /></ProtectedRoute>} />
      <Route path="/driver/cargo" element={<ProtectedRoute roles={['DRIVER']}><DriverCargoList /></ProtectedRoute>} />
      <Route path="/driver/appointments" element={<ProtectedRoute roles={['DRIVER']}><DriverAppointments /></ProtectedRoute>} />

      {/* Freight */}
      <Route path="/freight" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightDashboard /></ProtectedRoute>} />
      <Route path="/freight/cargo-requests" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightCargoRequests /></ProtectedRoute>} />
      <Route path="/freight/hall-dispatch" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightHallDispatch /></ProtectedRoute>} />
      <Route path="/freight/appointments" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightAppointmentIssue /></ProtectedRoute>} />
      <Route path="/freight/drivers" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightDrivers /></ProtectedRoute>} />
      <Route path="/freight/fleet" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightFleet /></ProtectedRoute>} />
      <Route path="/freight/waybills" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightWaybills /></ProtectedRoute>} />
      <Route path="/freight/reports" element={<ProtectedRoute roles={['FREIGHT_COMPANY']}><FreightReports /></ProtectedRoute>} />

      {/* Producer */}
      <Route path="/producer" element={<ProtectedRoute roles={['PRODUCER']}><ProducerDashboard /></ProtectedRoute>} />
      <Route path="/producer/new-cargo" element={<ProtectedRoute roles={['PRODUCER']}><ProducerNewCargo /></ProtectedRoute>} />
      <Route path="/producer/cargo" element={<ProtectedRoute roles={['PRODUCER']}><ProducerCargoList /></ProtectedRoute>} />
      <Route path="/producer/bulk-upload" element={<ProtectedRoute roles={['PRODUCER']}><ProducerBulkUpload /></ProtectedRoute>} />

      {/* Terminal Admin */}
      <Route path="/terminal" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalDashboard /></ProtectedRoute>} />
      <Route path="/terminal/cargo" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalCargoMonitor /></ProtectedRoute>} />
      <Route path="/terminal/drivers" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalDriverMonitor /></ProtectedRoute>} />
      <Route path="/terminal/freight" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalFreightMonitor /></ProtectedRoute>} />
      <Route path="/terminal/producers" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalProducerMonitor /></ProtectedRoute>} />
      <Route path="/terminal/halls" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalHallManager /></ProtectedRoute>} />
      <Route path="/terminal/users" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalUserManagement /></ProtectedRoute>} />
      <Route path="/terminal/reports" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalReports /></ProtectedRoute>} />
      <Route path="/terminal/audit-log" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalAuditLog /></ProtectedRoute>} />
      <Route path="/terminal/waybills" element={<ProtectedRoute roles={['TERMINAL_ADMIN']}><TerminalWaybillMonitor /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
