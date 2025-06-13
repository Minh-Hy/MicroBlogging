import { ObjectId } from 'mongodb';
import databaseService from '~/services/database.services';
import { CreateReportReqBody } from '~/models/requests/reports.requests';
import { ReportStatus } from '~/models/schemas/Reports.schemas';

class ReportsServices {
  async createReport(reporter_id: string, payload: CreateReportReqBody) {
    const report = {
      reporter_id: new ObjectId(reporter_id),
      content_type: payload.content_type,
      content_id: new ObjectId(payload.content_id),
      reason: payload.reason,
      status: 'pending'as ReportStatus,
      created_at: new Date()
    };

    const result = await databaseService.reports.insertOne(report);
    return { ...report, _id: result.insertedId };
  }
}

const reportsServices = new ReportsServices();
export default reportsServices;
