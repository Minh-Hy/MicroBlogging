import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'

const deleteFakeData = async () => {
  try {
    console.log('🔍 Finding fake users...')
    const fakeUsers = await databaseService.users
      .find({ username: { $regex: '^user' } })
      .project({ _id: 1 })
      .toArray()

    const fakeUserIds = fakeUsers.map((user) => user._id)

    console.log(`🧹 Found ${fakeUserIds.length} fake users. Deleting...`)

    // Xoá user
    const userResult = await databaseService.users.deleteMany({
      _id: { $in: fakeUserIds }
    })

    // Kiểm tra kiểu user_id trong tweet
    const sampleTweet = await databaseService.tweets.findOne({
      user_id: { $in: fakeUserIds }
    })
    const isUserIdString = typeof sampleTweet?.user_id === 'string'

    const tweetCondition = {
      user_id: {
        $in: isUserIdString
          ? fakeUserIds.map((id) => id.toString())
          : fakeUserIds
      }
    }

    // Xoá tweet liên quan
    const tweetResult = await databaseService.tweets.deleteMany(tweetCondition)

    // Xoá follow liên quan
    const followResult = await databaseService.followers.deleteMany({
      $or: [
        { user_id: { $in: fakeUserIds } },
        { followed_user_id: { $in: fakeUserIds } }
      ]
    })

    console.log(`✅ Deleted ${userResult.deletedCount} users`)
    console.log(`✅ Deleted ${tweetResult.deletedCount} tweets`)
    console.log(`✅ Deleted ${followResult.deletedCount} follows`)
    console.log('🎉 Done cleaning fake data.')
  } catch (error) {
    console.error('❌ Failed to delete fake data:', error)
  }
}

deleteFakeData()
