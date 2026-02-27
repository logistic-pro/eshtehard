import 'dotenv/config';
import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import terminalRoutes from './modules/terminals/terminals.routes';
import hallRoutes from './modules/halls/halls.routes';
import cargoRoutes from './modules/cargo/cargo.routes';
import announcementRoutes from './modules/announcements/announcements.routes';
import appointmentRoutes from './modules/appointments/appointments.routes';
import waybillRoutes from './modules/waybills/waybills.routes';
import driverRoutes from './modules/drivers/drivers.routes';
import fleetRoutes from './modules/fleet/fleet.routes';
import reportRoutes from './modules/reports/reports.routes';
import ticketRoutes from './modules/tickets/tickets.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import auditRoutes from './modules/audit/audit.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) ?? [])
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/terminals', terminalRoutes);
app.use('/api/v1/halls', hallRoutes);
app.use('/api/v1/cargo', cargoRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/waybills', waybillRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/fleet', fleetRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

app.get('/api/v1/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;
