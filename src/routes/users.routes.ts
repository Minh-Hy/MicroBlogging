import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  RefreshTokenValidator,
  registerValidator,
  resetPassWordValidator,
  unFollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from './../middlewares/users.middlewares'
import { Router } from 'express'
import { loginValidator } from '~/middlewares/users.middlewares'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  updateMeController,
  followController,
  unFollowController,
  changePasswordController,
  getProfileController,
  oauthController,
  refreshTokenController,
  getUserProfileController,
  getFollowersController,
  getFollowingController,
  addToTwitterCircleController,
  removeFromTwitterCircleController
} from '~/controller/users.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
import { filterMiddlewares } from '~/middlewares/common.middlewares'
import { UpdateMeReqBody } from '~/models/requests/user.requests'
import reportsController from '~/controller/reports.controllers'

const usersRouter = Router()
/**
 * Descript  : Login user
 * Path : /login
 * Method : POST
 * Body : {email : string, password : string}
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
/**
 * Descript  : Login user
 * Path : /oauth/google
 * Method : GET
 * Body : {email : string, password : string}
 */
usersRouter.get('/oauth/google', wrapRequestHandler(oauthController))
/**
 * Descript  : Register new user
 * Path : /register
 * Method : POST
 * Body : {name : string, email : string, password : string, confirm_password : string, date_of_birth : ISO8601}
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
/**
 * Descript  : logout user
 * Path : /logoutlogout
 * Method : POST
 * Header : {Authorization: Bearer <access token>}
 * Body : {refresh_token : string}
 */
usersRouter.post('/logout', accessTokenValidator, RefreshTokenValidator, wrapRequestHandler(logoutController))
/**
 * Descript  : Refresh token
 * Path : /refresh-token
 * Method : POST
 * Body : {refresh_token : string}
 */
usersRouter.post('/refresh-token', RefreshTokenValidator, wrapRequestHandler(refreshTokenController))
/**
 * Descript  : verify email when user click on the link in email
 * Path : /verify-email
 * Method : POST
 * Body : {email_verify_token : string}
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))
/**
 * Descript  : resend verify email
 * Path : /resend-verify-email
 * Method : POST
 * Header : {Authorization: Bearer <access token>}
 * Body : {}
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))
/**
 * Descript  : submit email to get reset password link
 * Path : /resend-verify-email
 * Method : POST
 * Body : {email: string}
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
/**
 * Descript  : verify link in email to reset password
 * Path : /forgot password
 * Method : POST
 * Body : {forgot_password_token: string}
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)
/**
 * Descript  : Reset password
 * Path : /verify-forgot-password
 * Method : POST
 * Body : {forgot_password_token: string, password: string, confirm_password: string}
 */
usersRouter.post('/reset-password', resetPassWordValidator, wrapRequestHandler(resetPasswordController))
/**
 * Descript  : Get my profile
 * Path : /me
 * Method : GET
 * Header : {Authorization: Bearer <access token>}
 */
usersRouter.get('/me', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getProfileController))

usersRouter.get('/:username', wrapRequestHandler(getUserProfileController))
/**
 * Descript  : Update my profile
 * Path : /me
 * Method : PATCH
 * Header : {Authorization: Bearer <access token>}
 * Body : UserSchema
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddlewares<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
)
/**
 * Descript  : Follow someone
 * Path : /follow
 * Method : POST
 * Header : {Authorization: Bearer <access token>}
 * Body : {followed_user_id: string}
 */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)
/**
 * Descript  : unFollow someone
 * Path : /follow/user_id
 * Method : DELETE
 * Header : {Authorization: Bearer <access token>}
 * Body : {followed_user_id: string}
 */
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unFollowValidator,
  wrapRequestHandler(unFollowController)
)
/**
 * Descript  : Get followers list of user
 * Path : /followers/:user_id
 * Method : GET
 * Query : ?limit=20&page=1
 */
usersRouter.get(
  '/followers/:user_id',
  wrapRequestHandler(getFollowersController)
);

/**
 * Descript  : Get following list of user
 * Path : /following/:user_id
 * Method : GET
 * Query : ?limit=20&page=1
 */
usersRouter.get(
  '/following/:user_id',
  wrapRequestHandler(getFollowingController)
);
/**
 * Descript  : Change password
 * Path : /change-password
 * Method : PUT
 * Header : {Authorization: Bearer <access token>}
 * Body : {old-password: string, password: string, confirm-password: string}
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)
/**
 * Descript  : Report
 * Path : /report
 * Method : POST
 * Header : {Authorization: Bearer <access token>}
 * Body : {reason: string, report_id: string, report_type: 'tweet' | 'user' | 'comment'}
 */
usersRouter.post(
  '/report',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(reportsController.createReport)
)
/**
 * Descript  : Add user to Twitter Circle
 * Path : /twitter-circle/:user_id    
 */
usersRouter.post(
  '/twitter-circle/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(addToTwitterCircleController)
)
/**
 * Descript  : Remove user from Twitter Circle
 * Path : /twitter-circle/:user_id
 */
usersRouter.delete(
  '/twitter-circle/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(removeFromTwitterCircleController)
)


export default usersRouter
