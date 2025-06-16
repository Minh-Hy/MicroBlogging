import { ObjectId } from 'mongodb';

export type FindOneAndUpdateResult<T> = {
  value?: T | null;
  lastErrorObject?: {
    updatedExisting?: boolean;
    upserted?: ObjectId;
  };
  ok?: number;
};
// Chuẩn hóa ModifyResult cho findOneAndUpdate
export type ModifyResult<T> = {
  value: T | null
  lastErrorObject?: {
    updatedExisting?: boolean
    upserted?: ObjectId
  }
  ok?: number
}