
import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody, UpdateMeReqBody } from "~/models/requests/user.requests"
import { hashPassword } from "~/utils/crypto"
import { signToken } from "~/utils/jwt"
import { TokenType, UserVerifyStatus } from "~/constants/enums"
import RefreshToken from '~/models/schemas/RefreshToken.schemas';
import { ObjectId } from 'mongodb';
import { config } from "dotenv"
import { USERS_MESSAGES } from "~/constants/messages"
import Follower from "~/models/schemas/Followers.schemas"
config()


class UsersService {
  private signAccessToken ({user_id, verify}: {user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      }, 
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options : {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }
  private signRefreshToken ({user_id, verify}: {user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options : {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signEmailVerifyToken ({user_id, verify}: {user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options : {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }

  private signForgotPasswordToken ({user_id, verify}: {user_id: string, verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options : {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  private signAccessAndRefreshToken ({user_id, verify}: {user_id: string, verify: UserVerifyStatus }) {
    return Promise.all([
      this.signAccessToken({user_id, verify}),
      this.signRefreshToken({user_id, verify})
    ])
  }
  async register(payload : RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({user_id: user_id.toString(), verify: UserVerifyStatus.Unverified})
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({user_id: user_id.toString(), verify: UserVerifyStatus.Unverified})
    await databaseService.RefreshTokens.insertOne(new RefreshToken({user_id: new ObjectId(user_id), token: refresh_token}))
    console.log('email_verify_token: ',email_verify_token)
    return {
      access_token,
      refresh_token
    }
  }

  async checkEmailExist(email : string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async login ({user_id, verify} : {user_id: string, verify: UserVerifyStatus}) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    })
    await databaseService.RefreshTokens.insertOne(new RefreshToken({user_id: new ObjectId(user_id), token: refresh_token}))
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token : string) {
    await databaseService.RefreshTokens.deleteOne({token: refresh_token})
    return {message: USERS_MESSAGES.LOGOUT_SUCCESS}
  }

  async verifyEmail(user_id : string) { 
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({user_id, verify: UserVerifyStatus.Verified}),
      await databaseService.users.updateOne({
        _id: new ObjectId(user_id)
      }, [{
        $set: {
          email_verify_token: '',
          verify: 'verified',
          updated_at: "$$NOW"
        },
      }])
    ])
    const [access_token, refresh_token] = token
    return {
      access_token,
      refresh_token
    }
  }
  
  async resendVerifyEmail(user_id : string) {
    //Gia bo gui email
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })
    console.log('resend verify email: ', email_verify_token)

    // cap nhat lai gia tri email_verify_token trong document user
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token,
        },
        $currentDate: { updated_at: true }
      }
    )
    return {message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS}
  }
  async forgotPassword({user_id, verify} : {user_id: string, verify: UserVerifyStatus}) {
    const forgot_password_token = await this.signForgotPasswordToken({user_id, verify})
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: { updated_at: true }
      }
    )
    // gui email kem duong link den email nguoi dung : https://twitter.com/reset-password?token=<forgot_password_token>
    console.log('forgot_password_token: ', forgot_password_token)
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
  async resetPassword(user_id : string, password : string) {
    databaseService.users.updateOne(
      {_id: new ObjectId(user_id)},
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password),
        },
        $currentDate: { updated_at: true }
      }
    )
    return {message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS}
  }

  async getProfile(user_id : string) {
    const user = await databaseService.users.findOne({_id: new ObjectId(user_id)}, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    })
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? {...payload, date_of_birth: new Date(payload.date_of_birth)} : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
      _id : new ObjectId(user_id)
      },{
        $set: {
          ...(_payload as UpdateMeReqBody & {date_of_birth ?: Date}) 
        },
        $currentDate :{
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection : {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user
  }

  async follow (user_id: string, followed_user_id: string){
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    
    if (follower === null) {
      await databaseService.followers.insertOne(new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      }))
  
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      }
    }

    return {
      message: USERS_MESSAGES.FOLLOWED
    }
   
  }

  async unFollow (user_id: string, followed_user_id: string){
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    
    if (follower === null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED
      }
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    }
   
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      {_id: new ObjectId(user_id)},
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: { updated_at: true }
      }
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }

}


const usersService = new UsersService()
export default usersService