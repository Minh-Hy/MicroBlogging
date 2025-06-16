import { Router } from "express";
import { wrapRequestHandler } from "~/utils/handlers";
import {
  getMyTweetsController,
  getMyLikesController,
  getMyCommentsController
} from "~/controller/myActivity.controllers";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";

const myActivityRouter = Router();

myActivityRouter.get("/tweets", accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getMyTweetsController));
myActivityRouter.get("/likes", accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getMyLikesController));
myActivityRouter.get("/comments", accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getMyCommentsController));

export default myActivityRouter;
