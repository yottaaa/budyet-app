import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import userRoutes from './routes/userRoute.js';
import incomeRoutes from './routes/incomeRoute.js';
import expenseRoute from './routes/expenseRoute.js';
import balanceRoute from './routes/balanceRoute.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import connectDB from './config/db.js';
import { corsMiddleware } from './middlewares/corsMiddleware.js';

dotenv.config();

const port = process.env.PORT || 3001;

connectDB();

const app = express();

// middleware
app.use(helmet());
app.use(corsMiddleware)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// routes
app.get('/', (req, res) => res.send('Hello World!'));
app.use('/api/users', userRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoute);
app.use('/api/balances', balanceRoute);

// error handler middleware
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server is running ${process.env.NODE_ENV} on port ${port}`));