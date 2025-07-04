/* eslint-disable @typescript-eslint/no-unused-vars */
import { hashPassword } from '~/utils/crypto';
import { checkSchema, ParamSchema } from "express-validator"
import { validate } from "~/utils/validation"
import { USERS_MESSAGES } from '~/constants/messages';
import databaseService from '~/services/database.services';
import { verifyToken } from '~/utils/jwt';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import { JsonWebTokenError } from 'jsonwebtoken';
import { capitalize } from 'lodash';
import { Request, Response } from 'express';
import usersService from '~/services/users.services';
import { ObjectId } from 'mongodb';
import { TokenPayload } from '~/models/requests/user.requests';
import { UserVerifyStatus } from '~/constants/enums';
import {NextFunction} from 'express-serve-static-core'
import { REGEX_USERNAME } from '~/constants/regex';


const passWordSchema: ParamSchema = {
    notEmpty: {
      errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
    },
    isLength: {
      options: { min: 6, max: 50 }
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
    }
}

const confirmPasswordSchema: ParamSchema = {
    notEmpty: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
    },
    isString: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
    },
    isLength: {
      options: { min: 6, max: 50 },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
    },
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error(USERS_MESSAGES.PASSWORDS_DO_NOT_MATCH);
        }
        return true;
      }
    }
}

const forgotPassWordTokenSchema: ParamSchema = {
    trim: true,
    custom: {
      options: async (value: string, { req }) => {
        if (!value) {
          return Promise.reject(new ErrorWithStatus({
            message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          }));
        }
        try {
          const decoded_forgot_password_token = await verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string })
          const {user_id} = decoded_forgot_password_token
          const user = await databaseService.users.findOne({_id: new ObjectId(user_id)})
        
          if (!user) {
            return Promise.reject(new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.UNAUTHORIZED
            }));
          }
          if(user.forgot_password_token !== value) {
            return Promise.reject(new ErrorWithStatus({
              message: USERS_MESSAGES.USED_FORGOT_PASSWORD_TOKEN_OR_NOT_EXISTS,
              status: HTTP_STATUS.UNAUTHORIZED
            }));
          }
          req.decoded_forgot_password_token = decoded_forgot_password_token
        } catch (error) {
          if (error instanceof JsonWebTokenError) {
            return Promise.reject(new ErrorWithStatus({
              message: capitalize(error.message),
              status: HTTP_STATUS.UNAUTHORIZED
            }));
          }
          return Promise.reject(error);
        }
        return true;
      }
    }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  isLength: {
    options: { min: 1, max: 100 },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  trim: true
}

const date_of_birthSchema: ParamSchema = {
  isISO8601: {
    options : {
      strict: true,
      strictSeparator: true 
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}

const user_idSchema: ParamSchema = {
  custom: {
    options : async (value, {req}) => {
      if(!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })

      if(!followed_user) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }
  }
}

const imageSchema: ParamSchema = {
  optional : true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: { min: 1, max: 400 },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH
  },
}
export const loginValidator = validate(checkSchema({
  email: {
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    trim: true,
    custom: {
      options: async (value, { req }) => {
        const user = await databaseService.users.findOne({ 
          email: value, 
          password: hashPassword(req.body.password) 
        });
        if (user === null) {
          return Promise.reject(new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)); // ✅ Dùng Promise.reject thay vì throw
        }
        req.user = user;
        return true;
      }
    }
  },
  password: passWordSchema
}, ['body']));

export const registerValidator = validate(
  checkSchema({
    name: nameSchema,
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value) => {
          const result = await usersService.checkEmailExist(value);
          if (result) {
            throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
          }
          return true;
        }
      }
    },
    password: passWordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: date_of_birthSchema 
  }, ['body']))

  export const accessTokenValidator = validate(checkSchema({
    Authorization: {
      custom: {
        options: async (value: string, { req }) => {
          const accessToken =(value || '').split(' ')[1];
          if (!accessToken) {
            return Promise.reject(new ErrorWithStatus({
              message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            })); // ✅ Dùng Promise.reject thay vì throw
          }
          try {
            const decoded_authorization = await verifyToken({ 
              token: accessToken, 
              secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string 
            });
            ;(req as Request).decoded_authorization = decoded_authorization;
          } catch (error) {
            return Promise.reject(new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HTTP_STATUS.UNAUTHORIZED
            })); // ✅ Dùng Promise.reject
          }
          return true;
        }
      }
    }
  }, ['headers']));
  
  export const RefreshTokenValidator = validate(checkSchema({
    refresh_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            return Promise.reject(new ErrorWithStatus({
              message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            }));
          }
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
              databaseService.RefreshTokens.findOne({ token: value })
            ]);
            if (!refresh_token) {
              return Promise.reject(new ErrorWithStatus({
                message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXISTS,
                status: HTTP_STATUS.UNAUTHORIZED
              }));
            }
            (req as Request).decoded_refresh_token = decoded_refresh_token;
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              return Promise.reject(new ErrorWithStatus({
                message: capitalize(error.message),
                status: HTTP_STATUS.UNAUTHORIZED
              }));
            }
            return Promise.reject(error);
          }
          return true;
        }
      }
    }
  }, ['body']));
  

  export const emailVerifyTokenValidator = validate(checkSchema({
    email_verify_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if(!value) {
            return Promise.reject(new ErrorWithStatus({
              message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            }));
          }
          try {
            const decoded_email_verify_token = await verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string })
            ;(req as Request).decoded_email_verify_token = decoded_email_verify_token;
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              return Promise.reject(new ErrorWithStatus({
                message: capitalize(error.message),
                status: HTTP_STATUS.UNAUTHORIZED
              }));
            }
            return Promise.reject(error);
          }
            return true
        }
      }
    }
  }, ['body']));
  
  export const forgotPasswordValidator = validate(checkSchema({
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ 
              email: value
            });
            if (user === null) {
              return Promise.reject(new Error(USERS_MESSAGES.USER_NOT_FOUND)); // ✅ Dùng Promise.reject thay vì throw
            }
            req.user = user;
            return true;
          }
        }
      },
    }, ['body']));

  export const verifyForgotPasswordTokenValidator = validate(checkSchema({
    forgot_password_token: forgotPassWordTokenSchema
  }, ['body']));

  export const resetPassWordValidator = validate(
    checkSchema({
      password: passWordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPassWordTokenSchema
    }, ['body']))

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const {verify} = req.decoded_authorization as TokenPayload
  if(verify !== UserVerifyStatus.Verified) {
    return next(new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    }))
  }
  next()
}

export const updateMeValidator = validate(checkSchema({
  name: {
    ...nameSchema,
    optional: true,
    notEmpty: undefined
  },
  date_of_birth: {
    ...date_of_birthSchema,
    optional: true
  },
  bio : {
    optional : true,
    isString: {
      errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING
    },
    trim: true,
    isLength: {
      options: { min: 1, max: 200 },
      errorMessage: USERS_MESSAGES.BIO_LENGTH
    },
  },
  location : {
    optional : true,
    isString: {
      errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING
    },
    trim: true,
    isLength: {
        options: { min: 1, max: 200 },
        errorMessage: USERS_MESSAGES.LOCATION_LENGTH
      },
  },
  website: {
    optional : true,
    isString: {
      errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING
    },
    trim: true,
      isLength: {
        options: { min: 1, max: 200 },
        errorMessage: USERS_MESSAGES.WEBSITE_LENGTH
      },
  },
  // username: {
  //   optional : true,
  //   isString: {
  //     errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING
  //   },
  //   trim: true,
  //   custom: {
  //     options : async(value, {req}) => {
  //       if(!REGEX_USERNAME.test(value)) {
  //         throw Error(USERS_MESSAGES.USERNAME_INVALID)
  //       }

  //       const user = await databaseService.users.findOne({username: value})
  //       //neu da ton tai username nay trong db thi chung ta khong cho phep update
  //       if (user) {
  //         throw Error(USERS_MESSAGES.USERNAME_EXISTED)
  //       }
  //     }
  //   }
  // },
  avatar: imageSchema,
  cover_photo: imageSchema
}, ['body']))

export const followValidator = validate(
  checkSchema({
    followed_user_id : user_idSchema
},['body']))

export const unFollowValidator = validate(
  checkSchema({
    user_id: user_idSchema
  }, ['params'])
)

export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      ...passWordSchema,
      custom: {
        options: async (value, { req }) => {
          const { user_id } = req.decoded_authorization as TokenPayload;
          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id)});
          if (!user) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            });
          }
          const {password} = user
          const isMatch = hashPassword(value) === password
          if (!isMatch) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.OLD_PASSWORD_IS_INCORRECT,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }
        }
      }
    },
    password: passWordSchema,
    confirm_password: confirmPasswordSchema
  }, ['body']))

  export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if(req.headers.authorization) {
        return middleware(req, res, next)
      } 
      next()
    } 
}