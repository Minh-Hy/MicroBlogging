/* eslint-disable @typescript-eslint/no-unused-vars */

import { TokenPayload } from '~/models/requests/user.requests'
import User from '~/models/schemas/User.schema'
import Tweet from '~/models/schemas/Tweet.schemas'

declare module 'express-serve-static-core' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
    tweet?: Tweet
  }
}
