
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
import searchRouter from './routes/search.routes';
import { createServer } from "http";
import messagesRouter from './routes/messages.routes';
import { initSocketIO } from './socket';
import adminRouter from './routes/admin.routes';
import notificationRouter from './routes/notification.routes'

// import'~/utils/fake'
// import '~/utils/deleteFakeData'
// Load biến môi trường trước khi làm bất cứ thứ gì khác
dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4000;
app.use(cors())
//tao folder uploads

initFolder();



// Kết nối database
databaseService.connect().then(() => {
  databaseService.indexUser();
  databaseService.indexRefreshToken();
  databaseService.indexVideoStatus();
  databaseService.indexFollowers();
  databaseService.indexTweets();
})

app.use(express.json());
// Router
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/tweets', tweetsRouter);
app.use('/bookmarks',bookmarksRouter);
app.use('/likes', likesRouter);
app.use('/static', staticRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use('/search', searchRouter)
app.use('/messages', messagesRouter)
app.use('/admin', adminRouter);
app.use('/notifications', notificationRouter)

// Middleware xử lý lỗi phải đặt sau tất cả route
// ép kiểu rõ ràng để TS hiểu là error middleware
app.use(defaultErrorHandler as (err: any, req: Request, res: Response, next: NextFunction) => void);


// Khởi tạo socket riêng biệt
initSocketIO(httpServer);

httpServer.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});

