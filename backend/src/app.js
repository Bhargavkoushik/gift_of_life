import cors from 'cors';
import express from 'express';
import pool from './database/connection.js';

const app = express();

app.use(express.json());
app.use(cors());

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

export default app;
