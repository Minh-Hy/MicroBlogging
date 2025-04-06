import { accessTokenValidator, verifiedUserValidator } from './../middlewares/users.middlewares';
import { Router} from "express";
import { uploadImageController, uploadVideoController } from "~/controller/medias.controllers";
import { wrapRequestHandler } from "~/utils/handlers";
const mediasRouter = Router()

mediasRouter.post('/upload-image',accessTokenValidator, verifiedUserValidator,wrapRequestHandler(uploadImageController))
mediasRouter.post('/upload-video',accessTokenValidator, verifiedUserValidator,wrapRequestHandler(uploadVideoController))

export default mediasRouter