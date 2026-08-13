import cors from 'cors';
import express from 'express';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/api/health', (request, response) => {
	response.json({ status: 'ok' });
});

export default app;
