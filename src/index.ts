
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import dotenv from 'dotenv';
import usersRouter from './routes/users.routes';
import databaseService from '~/services/database.services';
import { defaultErrorHandler } from './middlewares/errors.middlewares';
import mediasRouter from './routes/medias.routes';
import { initFolder } from './utils/file';
import { UPLOAD_VIDEO_DIR } from './constants/dir';
import staticRouter from './routes/static.routes';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import tweetsRouter from './routes/tweets.routes';
import bookmarksRouter from './routes/bookmarks.routes';
import likesRouter from './routes/likes.routes';
// import'~/utils/fake'
// Load biến môi trường trước khi làm bất cứ thứ gì khác
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
app.use(cors())
//tao folder uploads

initFolder();

// Middleware để parse JSON
app.use(express.json());

// Kết nối database
databaseService.connect().then(() => {
  databaseService.indexUser();
  databaseService.indexRefreshToken();
  databaseService.indexVideoStatus();
  databaseService.indexFollowers();
})

// Router
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/tweets', tweetsRouter);
app.use('/bookmarks',bookmarksRouter);
app.use('/likes', likesRouter);
app.use('/static', staticRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
// Middleware xử lý lỗi phải đặt sau tất cả route
// ép kiểu rõ ràng để TS hiểu là error middleware
app.use(defaultErrorHandler as (err: any, req: Request, res: Response, next: NextFunction) => void);


app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});

