/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import reportsServices from '~/services/reports.services';
import { CreateReportReqBody } from '~/models/requests/reports.requests';
import { TokenPayload } from '~/models/requests/user.requests';
import { REPORT_MESSAGES } from '~/constants/messages';
class ReportsController {
  async createReport(req: Request<any, any, CreateReportReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const { content_type, content_id, reason } = req.body;

    const report = await reportsServices.createReport(user_id, {
      content_type, content_id, reason
    });

    res.json({
      message: REPORT_MESSAGES.REPORT_SUCCESS,
      result: report
    });
  }
}

const reportsController = new ReportsController();
export default reportsController;
