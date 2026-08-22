import cors from 'cors';
import express from 'express';
import pool from './database/connection.js';
import authRoutes from './modules/auth/routes.js';
import donorRoutes from './modules/donors/routes.js';
import coordinatorRoutes from './modules/coordinators/routes.js';
import adminRoutes from './modules/admin/routes.js';
import receiverRoutes from './modules/receivers/routes.js';
import bloodBankAdminRoutes from './modules/blood_bank_admin/routes.js';
import authMiddleware from './middleware/auth.js';
import requireRole from './middleware/role.js';
import { queryBloodCamps, queryBloodInventory, getBloodGroups } from './modules/coordinators/repository.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/donor', authMiddleware, requireRole('DONOR'), donorRoutes);
app.use('/api/coordinator', authMiddleware, requireRole('COORDINATOR'), coordinatorRoutes);
app.use('/api/super-admin', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']), adminRoutes);
app.use('/api/receiver', authMiddleware, requireRole('RECEIVER'), receiverRoutes);
app.use('/api/blood-bank-admin', authMiddleware, requireRole('BLOOD_BANK_ADMIN'), bloodBankAdminRoutes);

app.get('/api/blood-camps', async (req, res, next) => {
  try {
    const camps = await queryBloodCamps(req.query);
    return res.status(200).json(camps);
  } catch (error) {
    next(error);
  }
});

app.get('/api/blood-availability', async (req, res, next) => {
  try {
    const availability = await queryBloodInventory(req.query);
    return res.status(200).json(availability);
  } catch (error) {
    next(error);
  }
});

app.get('/api/blood-groups', async (req, res, next) => {
  try {
    const groups = await getBloodGroups();
    return res.status(200).json(groups);
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/health/db', async (request, response) => {
	try {
		const result = await pool.query('SELECT NOW()');
		if (result.rows.length > 0) {
			response.json({
				status: 'ok',
				database: 'connected'
			});
		} else {
			throw new Error('Database did not return a timestamp');
		}
	} catch (error) {
		console.error('Database health-check failed:', error.message);
		response.status(500).json({
			status: 'error',
			message: 'Database connection failed'
		});
	}
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
	console.error('API Error:', err.message);
	const status = err.statusCode || 500;
	const message = status === 500 ? 'An unexpected server error occurred' : err.message;
	res.status(status).json({
		success: false,
		code: err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
		message
	});
});

export default app;
