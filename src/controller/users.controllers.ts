/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response} from "express"
import usersService from "~/services/users.services"
import {NextFunction, ParamsDictionary} from 'express-serve-static-core'
import { changePasswordReqBody, FollowReqBody, ForgotPasswordReqBody, GetProfileReqParams, LoginReqBody, LogoutReqBody, RefreshTokenReqBody, RegisterReqBody, ResetPasswordReqBody, TokenPayload, UnFollowReqParams, UpdateMeReqBody, VerifyEmailTokenReqBody, VerifyForgotPasswordReqBody } from "~/models/requests/user.requests"
import { ObjectId } from "mongodb"
import User from "~/models/schemas/User.schema"
import { USERS_MESSAGES } from "~/constants/messages"
import databaseService from '~/services/database.services';
import HTTP_STATUS from '~/constants/httpStatus';
import { UserVerifyStatus } from "~/constants/enums"
import { config } from "dotenv"
import { sendMail } from "~/services/mailer.services"
config()
export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response
) => {
  const user = req.user as User; // Lấy thông tin người dùng từ request
  const user_id = user._id as ObjectId;

  // Gọi service để xử lý đăng nhập
  const result = await usersService.login({
    user_id: user_id.toString(),
    verify: user.verify,
    role: user.role // Thêm trường role vào kết quả
  });

  // Trả về token và role
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result: {
      ...result,
      role: user.role // Bao gồm role trong phản hồi
    }
  });
};

export const registerController = async (
  req : Request<ParamsDictionary, any, RegisterReqBody>,
  res : Response, 
  next : NextFunction) => {
  try {
    const result = await usersService.register(req.body)
    res.json({
      message : USERS_MESSAGES.REGISTER_SUCCESS,
      result
    })  
  } catch (error) {
    next(error)
  }
 

}

export const logoutController = async (req : Request<ParamsDictionary, any, LogoutReqBody>, res : Response) => {
  const {refresh_token} = req.body
  await usersService.logout(refresh_token)
  res.json({ 
    message : USERS_MESSAGES.LOGOUT_SUCCESS,
  })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  // Lấy refresh token từ request body
  const { refresh_token } = req.body;

  // Giải mã refresh token để lấy user_id, verify, và role
  const { user_id, verify, role, exp } = req.decoded_refresh_token as TokenPayload;

  // Gọi service để tạo token mới
  const result = await usersService.refreshToken({
    user_id,
    verify,
    refresh_token,
    role,
    exp // Truyền role vào service
  });

  // Trả về kết quả
  res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  });
};
export const verifyEmailController = async (req : Request<ParamsDictionary, any, VerifyEmailTokenReqBody>, res : Response, next : NextFunction) => {
  const {user_id} = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id),
  })
  if(!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
    return
  }
  // da verify roi thi ko bao loi 
  //tra ve status OK voi message la email da duoc verify
  if(user.email_verify_token === '') {
    res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
    return
  }
  const result = await usersService.verifyEmail(user_id)
  res.json({
    message: USERS_MESSAGES.EMAIL_VERIFIED,
    result
  })
  return
}
export const resendVerifyEmailController = async (req : Request, res : Response, next: NextFunction) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({_id: new ObjectId(user_id)})
  if(!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
    return
  }
  if(user.verify === UserVerifyStatus.Verified) {
    res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
    return 
  }
  const result = await usersService.resendVerifyEmail(user_id)
  res.json(result)
  return
}

export const forgotPasswordController = async (req : Request<ParamsDictionary, any, ForgotPasswordReqBody>, res : Response, next : NextFunction) => {
  const {_id, verify} = req.user as User
  const result = await usersService.forgotPassword({user_id : (_id as ObjectId).toString(), verify} )
  res.json(result)
  return
}

export const verifyForgotPasswordController = async (req : Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>, res: Response, next: NextFunction) => {
  res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  });
  return
};

export const resetPasswordController = async (req : Request<ParamsDictionary, any, ResetPasswordReqBody>, res: Response, next: NextFunction) => {
  const {user_id} = req.decoded_forgot_password_token as TokenPayload
  const {password} = req.body
  const result = await usersService.resetPassword(user_id, password)
  res.json(result)
  return
}

export const getProfileController = async (req : Request<ParamsDictionary, any, GetProfileReqParams>, res : Response, next: NextFunction) => {
  const {user_id} = req.params
  const user = await usersService.getProfile(user_id)
  res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result : user
  })
  return
}

// export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response, next: NextFunction) {
//   const {username} = req.params
//   const user = await usersService.getProfile(username)
//   return res.json({
//     message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
//     result: user
//   })
// }

export const updateMeController = async (req : Request<ParamsDictionary, any, UpdateMeReqBody>, res : Response, next: NextFunction) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const {body} = req
  const user = await usersService.updateMe(user_id, body)
  res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  })
  return
}

export const followController = async (req : Request<ParamsDictionary, any, FollowReqBody>, res : Response, next: NextFunction) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const {followed_user_id} = req.body
  const result = await usersService.follow(user_id,followed_user_id)
  res.json(result)
  return
}

export const unFollowController = async (req : Request<ParamsDictionary, any, UnFollowReqParams>, res : Response, next: NextFunction) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const {user_id: followed_user_id} = req.params
  const result = await usersService.unFollow(user_id,followed_user_id)
  res.json(result)
  return
}

export const changePasswordController = async (req : Request<ParamsDictionary, any, changePasswordReqBody>, res : Response, next: NextFunction) => {
  const {user_id} = req.decoded_authorization as TokenPayload
  const {password} = req.body
  const result = await usersService.changePassword(user_id, password)
  res.json(result)
  return
}

export const oauthController = async (req : Request, res : Response) => {
  const {code} = req.query
  const result = await usersService.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK as string}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  res.redirect(urlRedirect)
 
}


