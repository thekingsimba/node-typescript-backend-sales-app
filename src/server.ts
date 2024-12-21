import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'UP', timestamp: new Date() });
});

const PORT = process.env.PORT || 8082;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
