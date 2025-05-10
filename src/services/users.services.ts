
import User from "~/models/schemas/User.schema"
import databaseService from "./database.services"
import { RegisterReqBody, UpdateMeReqBody } from "~/models/requests/user.requests"
import { hashPassword } from "~/utils/crypto"
import { signToken, verifyToken } from "~/utils/jwt"
import { TokenType, UserVerifyStatus } from "~/constants/enums"
import RefreshToken from '~/models/schemas/RefreshToken.schemas';
import { ObjectId } from 'mongodb';
import { config } from "dotenv"
import { USERS_MESSAGES } from "~/constants/messages"
import Follower from "~/models/schemas/Followers.schemas"
import ms from 'ms'
import axios from "axios"
import { ErrorWithStatus } from "~/models/Errors"
import HTTP_STATUS from "~/constants/httpStatus"
import { sendMail } from "./mailer.services"

config()


class UsersService {
  private signAccessToken({
    user_id,
    verify,
    role // Thêm trường role
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    role: "admin" | "user"; // Thêm kiểu dữ liệu cho role
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify,
        role // Thêm role vào payload
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as ms.StringValue
      }
    });
  }
  private signRefreshToken({
    user_id,
    verify,
    role, // Thêm trường role
    exp
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    role: "admin" | "user"; // Thêm kiểu dữ liệu cho role
    exp ?: number; // Thêm kiểu dữ liệu cho exp
  }) {
    if(exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          role, // Thêm role vào payload
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      
      });
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify,
        role // Thêm role vào payload
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as ms.StringValue
      }
    });
  }

  private signEmailVerifyToken({
    user_id,
    verify,
    role // Thêm trường role
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    role: "admin" | "user"; // Thêm kiểu dữ liệu cho role
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify,
        role // Thêm role vào payload
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as ms.StringValue
      }
    });
  }
  
  private signForgotPasswordToken({
    user_id,
    verify,
    role // Thêm trường role
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    role: "admin" | "user"; // Thêm kiểu dữ liệu cho role
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify,
        role // Thêm role vào payload
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as ms.StringValue
      }
    });
  }

  private signAccessAndRefreshToken({
    user_id,
    verify,
    role // Thêm trường role
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    role: "admin" | "user"; // Thêm kiểu dữ liệu cho role
  }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify, role }), // Truyền role vào signAccessToken
      this.signRefreshToken({ user_id, verify, role }) // Truyền role vào signRefreshToken
    ]);
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  })}


  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId();
  
    // Tự động generate username từ email hoặc chuỗi ngẫu nhiên
    const baseUsername = `user${user_id.toString()}`; // vd: "john" từ "john@gmail.com"
    let generatedUsername = baseUsername;
    let count = 0;
  
    // Đảm bảo username là duy nhất
    while (await databaseService.users.findOne({ username: generatedUsername })) {
      count++;
      generatedUsername = `${baseUsername}${count}`; // john1, john2, v.v.
    }
  
    // Tạo token xác thực email
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
      role: "user"
    });
  
    // Thêm tài khoản người dùng vào database
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: generatedUsername,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        role: "user"
      })
    );
  
    // Tạo access token và refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
      role: "user"
    });
  
    // Lưu refresh token vào database
    const { iat, exp } = await this.decodeRefreshToken(refresh_token);
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
    
    //Flow gui mail xac thuc
    // 1. server gui mail xac thuc den email
    // 2. client nhan mail va click vao link xac thuc
    // 3. client gui request xac thuc den server with email_verify_token
    // 4. server kiem tra email_verify_token va cap nhat trang thai xac thuc cho user
    // 5. Client rececive access_token va refresh_token

    console.log('email_verify_token: ', email_verify_token);
    await sendMail(
      payload.email,
      'Xác minh email của bạn',
      `
        <h2>Chào mừng bạn đến với ứng dụng của chúng tôi!</h2>
        <p>Vui lòng nhấn vào liên kết bên dưới để xác minh địa chỉ email của bạn:</p>
        <a href="${process.env.CLIENT_URL}/verify-email?token=${email_verify_token}">Xác minh email</a>
        <p>Liên kết sẽ hết hạn sau 24 giờ.</p>
      `
    )
    return {
      access_token,
      refresh_token,
    };
  }
  
  async checkEmailExist(email : string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async login({
    user_id,
    verify,
    role // Nhận role từ controller
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    role: "admin" | "user"// Thêm role vào tham số
  }) {
    // Tạo access token và refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify,
      role // Thêm role vào tham số
    });
  
    // Lưu refresh token vào database
    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
  
    // Trả về kết quả bao gồm role
    return {
      access_token,
      refresh_token,
      role, // Thêm role vào kết quả
    };
  }

  private async getOauthGooglToken (code : string) {
    const body = {
      code, 
      client_id : process.env.GOOGLE_CLIENT_ID,
      client_secret : process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri : process.env.GOOGLE_REDIRECT_URI,
      grant_type : 'authorization_code'
    }
    const {data} = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
      'Content-Type' : 'application/x-www-form-urlencoded'
      }
    }) 
    return data as {
      access_token : string,
      id_token : string
    }
  }
  
  private async getGoogleUserInfo (access_token: string, id_token: string) {
    const {data} = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params : {
        access_token,
        alt : 'json'
      },
      headers : {
        Authorization : `Bearer ${id_token}`
      }
    } )

    return data as {
      id: string,
      email: string,
      verified_email: boolean,
      name: string,
      given_name: string,
      family_name: string,
      picture: string,
      locale: string
    }
  }
  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGooglToken(code);
    const userInfo = await this.getGoogleUserInfo(access_token, id_token);
  
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }
  
    // Kiểm tra email đã được đăng ký hay chưa
    const user = await databaseService.users.findOne({ email: userInfo.email });
  
    // Nếu tồn tại thì login
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify,
        role: user.role // Truyền role từ tài liệu hiện tại
      });
      const {iat, exp} = await this.decodeRefreshToken(refresh_token)
      await databaseService.RefreshTokens.insertOne(
        new RefreshToken({ user_id: user._id, token: refresh_token, iat, exp })
      );
  
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      };
    } else {
      // Nếu không thì tạo mới
      const password = Math.random().toString(36).slice(-8);
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password,
        role: "user" // Mặc định role là 'user'
      });
  
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified };
    }
  }

  async logout(refresh_token : string) {
    await databaseService.RefreshTokens.deleteOne({token: refresh_token})
    return {message: USERS_MESSAGES.LOGOUT_SUCCESS}
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    role, // Thêm role vào tham số
    exp 
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    refresh_token: string;
    role: "admin" | "user"; // Thêm kiểu dữ liệu cho role
    exp : number; // Thêm kiểu dữ liệu cho exp
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify, role }), // Truyền role vào signAccessToken
      this.signRefreshToken({ user_id, verify, role, exp }), // Truyền role vào signRefreshToken
      databaseService.RefreshTokens.deleteOne({ token: refresh_token })
    ]);
    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token)
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token, iat: decoded_refresh_token.iat, exp: decoded_refresh_token.exp })
    );
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    };
  }

  async verifyEmail(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({
        user_id,
        verify: UserVerifyStatus.Verified,
        role: user?.role || "user" // Lấy role từ tài liệu hiện tại hoặc mặc định là 'user'
      }),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        [
          {
            $set: {
              email_verify_token: "",
              verify: UserVerifyStatus.Verified,
              updated_at: "$$NOW"
            }
          }
        ]
      )
    ]);
  
    const [access_token, refresh_token] = token;
  
    const {iat, exp} = await this.decodeRefreshToken(refresh_token)
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    );
  
    return {
      access_token,
      refresh_token
    };
  }
  
  async resendVerifyEmail(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified,
      role: user?.role || "user" // Lấy role từ tài liệu hiện tại hoặc mặc định là 'user'
    });
  
    console.log("resend verify email: ", email_verify_token);
  
    // Cập nhật lại giá trị email_verify_token trong document user
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: { updated_at: true }
      }
    );
  
    return { message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS };
  }
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    if (!user) throw new Error('User not found') // nên xử lý rõ ràng
  
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id,
      verify,
      role: user?.role || "user" // Lấy role từ tài liệu hiện tại hoặc mặc định là 'user'
    });
  
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: { updated_at: true }
      }
    );
  
    // Giả sử gửi email kèm đường link đến email người dùng
    console.log("forgot_password_token: ", forgot_password_token);
      // Gửi email chứa link reset
    const resetLink = `${process.env.CLIENT_URL}/forgot-password?token=${forgot_password_token}`
    const emailContent = `
    <h2>Yêu cầu đặt lại mật khẩu</h2>
    <p>Nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn:</p>
    <a href="${resetLink}">resetLink</a>
    <p>Liên kết sẽ hết hạn sau 24 giờ.</p>`

  await sendMail(user.email, 'Đặt lại mật khẩu', emailContent)
  
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    };
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