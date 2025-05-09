/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { MediaType, TweetAudience, UserVerifyStatus } from './../constants/enums';
import { checkSchema } from "express-validator";
import { isEmpty } from 'lodash';
import { ObjectId } from 'mongodb';
import { TweetType } from "~/constants/enums";
import HTTP_STATUS from '~/constants/httpStatus';
import { TWEET_MESSAGES, USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import databaseService from '~/services/database.services';
import { numberEnumToArray } from "~/utils/commons";
import { validate } from "~/utils/validation";
import Tweet from '~/models/schemas/Tweet.schemas';
import { wrapRequestHandler } from '~/utils/handlers';


const tweetTypes = numberEnumToArray(TweetType)
const TweetAudiences = numberEnumToArray(TweetAudience)
const mediasTypes = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn : {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_TYPE
        }
      },
      audience: {
        isIn : {
          options: [TweetAudiences],
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            // Neu 'type' la retweet, comment, quotetweet thi 'parent_id' phai la 'tweet_id' cua tweet cha
            if([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
                throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_TWEET_ID)
            }
            //Neu 'type' la tweet thi 'parent_id' phai la null
            if(type === TweetType.Tweet && value !== null) {
                throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL)
            }
            return true
          }
        }
      },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          //Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng.
          if([TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && isEmpty(hashtags) && isEmpty(mentions) && value === '') {
            throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_STRING)
          }
          //Nếu `type` là retweet thì `content` phải là `''`.
          if(type === TweetType.Retweet && value !== '') {
              throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, {req}) => {
          //Yeu cau moi phan tu trong array phai la string
          if(value.some((item: any) => typeof item !== 'string')) {
            throw new Error(TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRINGS)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, {req}) => {
          //Yeu cau moi phan tu trong array phai la user_id
          if(value.some((item: any) => !ObjectId.isValid(item))) {
            throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_IDS)
          }
          return true
        }
      }
    },
    medias : {
      isArray: true,
      custom: {
        options: (value, {req}) => {
          //Yeu cau moi phan tu trong array phai la Media Object
          if(value.some((item: any) => {
            return typeof item.url !== 'string' || !mediasTypes.includes(item.type)
          }) ){
            throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECTS)
          }
          return true
        }
      }
    }

  })
)

export const tweetIdValidator = validate(
  checkSchema({
    tweet_id : { 
      custom : {
        options: async (value, { req }) => {
          if(!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.BAD_REQUEST,
              message: TWEET_MESSAGES.INVALID_TWEET_ID
            })
          }


          const [tweet] = await databaseService.tweets.aggregate<Tweet>(
            [
              {
                '$match': {
                  '_id': new ObjectId(value)
                }
              }, {
                '$lookup': {
                  'from': 'hashtags', 
                  'localField': 'hashtags', 
                  'foreignField': '_id', 
                  'as': 'hashtags'
                }
              }, {
                '$lookup': {
                  'from': 'users', 
                  'localField': 'mentions', 
                  'foreignField': '_id', 
                  'as': 'mentions'
                }
              }, {
                '$addFields': {
                  'mentions': {
                    '$map': {
                      'input': '$mentions', 
                      'as': 'mention', 
                      'in': {
                        '_id': '$$mention._id', 
                        'name': '$$mention.name', 
                        'username': '$$mention.username', 
                        'email': '$$mention.email'
                      }
                    }
                  }
                }
              }, {
                '$lookup': {
                  'from': 'bookmarks', 
                  'localField': '_id', 
                  'foreignField': 'tweet_id', 
                  'as': 'bookmarks'
                }
              }, {
                '$lookup': {
                  'from': 'likes', 
                  'localField': '_id', 
                  'foreignField': 'tweet_id', 
                  'as': 'likes'
                }
              }, {
                '$lookup': {
                  'from': 'tweets', 
                  'localField': '_id', 
                  'foreignField': 'parent_id', 
                  'as': 'tweet_children'
                }
              }, {
                '$addFields': {
                  'bookmarks': {
                    '$size': '$bookmarks'
                  }, 
                  'likes': {
                    '$size': '$likes'
                  }, 
                  'retweet_count': {
                    '$size': {
                      '$filter': {
                        'input': '$tweet_children', 
                        'as': 'item', 
                        'cond': {
                          '$eq': [
                            '$$item.type', TweetType.Retweet
                          ]
                        }
                      }
                    }
                  }, 
                  'commetn_count': {
                    '$size': {
                      '$filter': {
                        'input': '$tweet_children', 
                        'as': 'item', 
                        'cond': {
                          '$eq': [
                            '$$item.type', TweetType.Comment
                          ]
                        }
                      }
                    }
                  }, 
                  'quote_count': {
                    '$size': {
                      '$filter': {
                        'input': '$tweet_children', 
                        'as': 'item', 
                        'cond': {
                          '$eq': [
                            '$$item.type', TweetType.QuoteTweet
                          ]
                        }
                      }
                    }
                  }, 
                  'view': {
                    '$add': [
                      '$user_views', '$guest_views'
                    ]
                  }
                }
              }, {
                '$project': {
                  'tweet_children': 0
                }
              }
            ]
          ).toArray()
          if(!tweet) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: TWEET_MESSAGES.TWEET_NOT_FOUND
            })
          }
          ;(req as Request).tweet = tweet
          return true

        }

      }
    }
  },['params', 'body']
  ))
//Muon su dung async await trong handler express thi phai co try catch hoac wrapRequestHandler
  export const audienceValidator = wrapRequestHandler( async (req: Request, res: Response, next: NextFunction) => {
    const tweet = req.tweet as Tweet
    if(tweet.audience === TweetAudience.TwitterCircle) {
      if(!req.decoded_authorization) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        })

      }
      //Kiem tra tai khoan tac gia co bi ban hoac xoa hay khong
      const author = await databaseService.users.findOne({ 
        _id: new ObjectId(tweet.user_id),
      })
      if(!author || author.verify === UserVerifyStatus.Banned) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: USERS_MESSAGES.USER_NOT_FOUND
        })
      }
      //Kiem tra nguoi xem tweet nay co trong Twitter Circle cua tac gia khong
      const { user_id } = req.decoded_authorization 
   
      const isInTwitterCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id))
      if(!isInTwitterCircle && !author._id.equals(user_id)) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.FORBIDDEN,
          message: TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC
        })
      }
    }
    next()
  })
  export const getTweetChildrenValidator = validate(
    checkSchema({
      tweet_type: {
        isIn : {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_TYPE
        }
      },
      limit: {
        isNumeric: true,
         custom: {
          options: async (value, { req }) => {
           const num = Number(value)
           if (num > 100 || num < 1) {
            throw new Error(TWEET_MESSAGES.LIMIT_MUST_BE_LESS_THAN_100_AND_GREATER_THAN_0)
           }
           return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
           const num = Number(value)
           if (num < 1) {
            throw new Error(TWEET_MESSAGES.PAGE_MUST_BE_GREATER_THAN_0)
           }
           return true
          }
        }
      }
    },['query'])
  )
