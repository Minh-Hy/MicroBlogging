import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import usersRouter from './routes/users.routes';
import databaseService from '~/services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';
import mediasRouter from './routes/medias.routes';
import { initFolder } from './utils/file';
import argv from 'minimist'
import { UPLOAD_VIDEO_DIR } from './constants/dir';
import staticRouter from './routes/static.routes';
// Load biến môi trường trước khi làm bất cứ thứ gì khác
dotenv.config();
const options = argv(process.argv.slice(2))
console.log(options);
const app = express();
const port = process.env.PORT || 4000;

// Middleware CORS
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép tất cả các origin
    callback(null, true);
  },
}));

//tao folder uploads

initFolder();

// Middleware để parse JSON
app.use(express.json());

// Kết nối database
databaseService.connect();

// Router
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
// Middleware xử lý lỗi phải đặt sau tất cả route
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});

