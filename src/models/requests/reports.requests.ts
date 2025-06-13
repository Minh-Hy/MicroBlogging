export interface CreateReportReqBody {
  content_type: 'tweet' | 'user' | 'comment';
  content_id: string;
  reason: string;
}
