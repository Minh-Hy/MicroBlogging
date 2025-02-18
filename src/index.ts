import express from 'express';
import dotenv from 'dotenv';
import usersRouter from './routes/users.routes';
import databaseService from '~/services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';

// Load biến môi trường trước khi làm bất cứ thứ gì khác
dotenv.config();

const app = express();
const port = 3000;

// Middleware để parse JSON
app.use(express.json());

// Kết nối database
databaseService.connect();

// Router
app.use('/users', usersRouter);

// Middleware xử lý lỗi phải đặt sau tất cả route
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});

