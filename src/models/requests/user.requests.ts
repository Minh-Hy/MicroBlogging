
import { JwtPayload } from "jsonwebtoken"
import { TokenType, UserVerifyStatus } from "~/constants/enums"
import {ParamsDictionary} from "express-serve-static-core"

export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  avatar?: string
  username?: string
  cover_photo?: string
}

export interface FollowReqBody{
  followed_user_id: string
}

export interface LoginReqBody {
  email: string
  password: string
}
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
  role?:"user"
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  role: 'admin' | 'user' // Thêm trường role
  exp: number
  iat: number
}

export interface LogoutReqBody {
  refresh_token: string
}

export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface VerifyEmailTokenReqBody {
  email_verify_token: string
}

export interface ForgotPasswordReqBody {
  email: string
}

export interface VerifyForgotPasswordReqBody {
  forgot_password_token: string
}

export interface ResetPasswordReqBody {
  password: string
  confirmPassword: string
  forgot_password_token: string
}

export interface changePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}

export interface GetProfileReqParams extends ParamsDictionary{
  username: string
}

export interface UnFollowReqParams extends ParamsDictionary {
  user_id: string
}