/* eslint-disable @typescript-eslint/no-unused-vars */
import {faker} from '@faker-js/faker';
import { ObjectId } from 'mongodb';
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums';
import { TweetRequestBody } from '~/models/requests/tweets.requests';
import { RegisterReqBody } from '~/models/requests/user.requests';
import Follower from '~/models/schemas/Followers.schemas';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/database.services';
import tweetsService from '~/services/tweets.services';
import { hashPassword } from '~/utils/crypto';

// Mật khẩu cho các user giả
const PASSWORD = 'Hy081104@';
// ID của tài khoản của mình, dùng để follow người khác
const MYID = new ObjectId('681b7ce3c04accd5b1544a48');
// Số lượng user được tạo, mỗi user sẽ mặc định tweet 2 cái
const USER_COUNT = 100;

const createRandomUser = () => {
  const user : RegisterReqBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm_password: PASSWORD,
    date_of_birth: faker.date.past().toISOString(),
  }
  return user 
}
const createRandomTweet = () => {
    const tweet : TweetRequestBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 160
    }),
    hashtags: [],
    mentions: [],
    medias: [],
    parent_id: null,
    }
    return tweet
}

const user: RegisterReqBody[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT,
});

const insertMultipleUsers = async (users : RegisterReqBody[]) => {
  console.log('Creating users...');
  const result = await Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId();
      await databaseService.users.insertOne(
        new User({
          ...user,
          username: `user${user_id.toString()}`,
          password: await hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified,
          role: 'user',
        })
      )
      return user_id
    })
  )
  console.log(`Created ${result.length} users`)
  return result
}

const followMultipleUsers = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
  console.log('Following users...');
  const result = await Promise.all(
    followed_user_ids.map(async (followed_user_id) => {
      databaseService.followers.insertOne(
        new Follower({
          user_id,
          followed_user_id: new ObjectId(followed_user_id),
        })
      )
    })
  )
  console.log(`Followed ${result.length} users`)
}

const inserMultipleTweets = async (ids: ObjectId[]) => {
  console.log('Creating tweets...');
  console.log('Counting...')
  let count = 0
  const result = await Promise.all(
    ids.map(async (id, index) => {
      await Promise.all([
        tweetsService.createTweet(id.toString(), createRandomTweet()),
        tweetsService.createTweet(id.toString(), createRandomTweet())
      ])
      count += 2
      console.log(`Created ${count} tweets`)
    })
  )
  return result
}

insertMultipleUsers(user).then((ids) => {
  followMultipleUsers(new ObjectId(MYID), ids)
  inserMultipleTweets(ids)
})


