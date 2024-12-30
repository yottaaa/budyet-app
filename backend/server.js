import path from 'path';
import { fileURLToPath } from 'url';
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

dotenv.config();

const port = process.env.PORT || 3001;

connectDB();

const app = express();

// middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP if it conflicts with your setup
}));
const corsOptions = {
  origin: process.env.CLIENT_URL || '*', // Add allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies if needed
  exposeHeaders: ['set-cookie'],
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// routes
app.use('/api/users', userRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoute);
app.use('/api/balances', balanceRoute);

// static frontend
if (process.env.NODE_ENV === 'production') {
  // Get the directory name of the current module file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  console.log(__dirname); // Debug: logs the backend directory

  // Serve static files from the `client/dist` directory
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // For any other route, send the `index.html` file
  app.get('*', (req, res) => 
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  );
} else {
  app.get('/', (req, res) => res.send('Hello World!'));
}

// error handler middleware
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server is running ${process.env.NODE_ENV} on port ${port}`));