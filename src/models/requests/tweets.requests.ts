
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { TweetAudience, TweetType } from "~/constants/enums"
import { Media } from "../other"

export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string // chi null khi tweet gốc, không thì là tweet_id cha dạng string
  hashtags: string[] // tên của hashtag dạng ['javascript', 'reactjs']
  mentions: string[] // user_id[]
  medias: Media[]
}

export interface TweetParam extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery extends Query, Pagination{

  tweet_type: string
}

export interface Pagination {
    limit: string
    page: string
}

export interface DeleteTweetReqParams {
  tweet_id: string;
}
