import cors from 'cors';
import express from 'express';
import pool from './database/connection.js';
import authRoutes from './modules/auth/routes.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);

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
		status: 'error',
		message
	});
});

export default app;
