/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import adminService from "~/services/admin.services";

export const getAllUsersController = async (req: Request, res: Response) => {
  const users = await adminService.getAllUsers();
  res.json(users);
};

export const banUserController = async (req: Request<ParamsDictionary>, res: Response) => {
  const { userId } = req.params;
  await adminService.banUser(userId);
  res.json({ message: 'User banned successfully' });
};

export const unbanUserController = async (req: Request<ParamsDictionary>, res: Response) => {
  const { userId } = req.params;
  await adminService.unbanUser(userId);
  res.json({ message: 'User unbanned successfully' });
};

export const deleteUserController = async (req: Request<ParamsDictionary>, res: Response) => {
  const { userId } = req.params;
  await adminService.deleteUser(userId);
  res.json({ message: 'User deleted successfully' });
};

export const getAllTweetsController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;

  const result = await adminService.getAllTweets(limit, page);
  res.json({
    message: 'Get all tweets successfully',
    result: {
      tweets: result.tweets,
      total: result.total,
      page,
      limit,
      total_page: Math.ceil(result.total / limit)
    }
  });
};

export const deleteTweetController = async (req: Request<ParamsDictionary>, res: Response) => {
  const { tweetId } = req.params;
  await adminService.deleteTweet(tweetId);
  res.json({ message: 'Tweet deleted successfully' });
};

export const getAllReportsController = async (req: Request, res: Response) => {
  const reports = await adminService.getAllReports();
  res.json(reports);
};

export const updateReportStatusController = async (req: Request<ParamsDictionary>, res: Response) => {
  const { reportId } = req.params;
  const { status } = req.body;
  await adminService.updateReportStatus(reportId, status);
  res.json({ message: 'Report updated successfully' });
};

export const dashboardController = async (req: Request, res: Response) => {
  const result = await adminService.dashboard();
  res.json(result);
};
