import { Request, Response } from 'express';
import adminService from '~/services/admin.services';
import { ParamsDictionary } from 'express-serve-static-core';

class AdminController {
  async getAllUsers(req: Request, res: Response) {
    const users = await adminService.getAllUsers();
    res.json(users);
  }

  async banUser(req: Request<ParamsDictionary>, res: Response) {
    const { userId } = req.params;
    await adminService.banUser(userId);
    res.json({ message: 'User banned successfully' });
  }

  async deleteUser(req: Request<ParamsDictionary>, res: Response) {
  const { userId } = req.params;
  await adminService.deleteUser(userId);
  res.json({ message: 'User deleted successfully' });
}

async getAllTweets(req: Request, res: Response) {
  const tweets = await adminService.getAllTweets();
  res.json(tweets);
}

async deleteTweet(req: Request<ParamsDictionary>, res: Response) {
  const { tweetId } = req.params;
  await adminService.deleteTweet(tweetId);
  res.json({ message: 'Tweet deleted successfully' });
}

async getAllReports(req: Request, res: Response) {
  const reports = await adminService.getAllReports();
  res.json(reports);
}

async updateReportStatus(req: Request<ParamsDictionary>, res: Response) {
  const { reportId } = req.params;
  const { status } = req.body;
  await adminService.updateReportStatus(reportId, status);
  res.json({ message: 'Report updated successfully' });
}

async dashboard(req: Request, res: Response) {
  const result = await adminService.dashboard();
  res.json(result);
}


}

export default new AdminController();
