import databaseService from '~/services/database.services';
import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '~/constants/enums';

class AdminService {
  async getAllUsers() {
    return await databaseService.users.find({}, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    }).toArray();
  }

  async banUser(userId: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verify: UserVerifyStatus.Banned } } // Ví dụ: gán verify = 3 là banned
    );
  }

  async deleteUser(userId: string) {
  await databaseService.users.deleteOne({ _id: new ObjectId(userId) });
}

async getAllTweets() {
  return await databaseService.tweets.find().sort({ created_at: -1 }).toArray();
}

async deleteTweet(tweetId: string) {
  await databaseService.tweets.deleteOne({ _id: new ObjectId(tweetId) });
}

async getAllReports() {
  return await databaseService.reports.find().sort({ created_at: -1 }).toArray();
}

async updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved') {
  await databaseService.reports.updateOne(
    { _id: new ObjectId(reportId) },
    { $set: { status } }
  );
}

async dashboard() {
  const [userCount, tweetCount, reportCount] = await Promise.all([
    databaseService.users.countDocuments(),
    databaseService.tweets.countDocuments(),
    databaseService.reports.countDocuments()
  ]);

  return {
    userCount,
    tweetCount,
    reportCount
  };
}

}

export default new AdminService();
