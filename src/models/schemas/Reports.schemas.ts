import { ObjectId } from 'mongodb';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';
export type ReportContentType = 'tweet' | 'user' | 'comment';

export interface ReportType {
  _id?: ObjectId;
  content_type: ReportContentType;
  content_id: ObjectId;
  reporter_id: ObjectId;
  reason: string;
  created_at?: Date;
  status: ReportStatus;
}

export default class Report {
  _id?: ObjectId;
  content_type: ReportContentType;
  content_id: ObjectId;
  reporter_id: ObjectId;
  reason: string;
  created_at: Date;
  status: ReportStatus;

  constructor(report: ReportType) {
    this._id = report._id;
    this.content_type = report.content_type;
    this.content_id = report.content_id;
    this.reporter_id = report.reporter_id;
    this.reason = report.reason;
    this.created_at = report.created_at || new Date();
    this.status = report.status || 'pending';
  }
}
