export enum UserVerifyStatus {
  Unverified = "unverified",
  Verified = "verified",
  Banned = "banned"
}

export enum TokenType {
  AccessToken = "access_token",
  RefreshToken = "refresh_token",
  ForgotPasswordToken = "forgot_password_token",
  EmailVerifyToken = "email_verify_token"
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaTypeQuery {
  Image = 'image',
  Video = 'video',
}

export enum EncodingStatus {
  Pending,
  Processing,
  Success,
  Failed
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet,
}

export enum TweetAudience {
  Everyone,
  TwitterCircle,
 }

 export enum PeopleFollow {
  Anyone = '0',
  Following = '1',
 }