import { ObjectId } from "mongodb";
import { UserVerifyStatus } from "~/constants/enums";

// Thêm trường 'role' vào interface UserType
interface UserType {
  _id?: ObjectId;
  name: string;
  email: string;
  date_of_birth: Date;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  email_verify_token?: string;
  forgot_password_token?: string;
  verify?: UserVerifyStatus;
  twitter_circle?: ObjectId[]; // danh sach id cua nhung nguoi user add vao twitter circle
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  cover_photo?: string;
  role?: "admin" | "user"; // Thêm trường role với kiểu dữ liệu là 'admin' hoặc 'user'
}

export default class User {
  _id?: ObjectId;
  name: string;
  email: string;
  date_of_birth: Date;
  password: string;
  created_at: Date;
  updated_at: Date;
  email_verify_token: string;
  forgot_password_token: string;
  verify: UserVerifyStatus;
  twitter_circle: ObjectId[]
  bio: string;
  location: string;
  website: string;
  username: string;
  avatar: string;
  cover_photo: string;
  role: "admin" | "user"; // Thêm trường role

  constructor(user: UserType) {
    const date = new Date();
    this._id = user._id;
    this.name = user.name || "";
    this.email = user.email;
    this.date_of_birth = user.date_of_birth || new Date();
    this.password = user.password;
    this.created_at = user.created_at || date;
    this.updated_at = user.updated_at || date;
    this.email_verify_token = user.email_verify_token || "";
    this.forgot_password_token = user.forgot_password_token || "";
    this.verify = user.verify || UserVerifyStatus.Unverified;
    this.twitter_circle = user.twitter_circle || [];
    this.bio = user.bio || "";
    this.location = user.location || "";
    this.website = user.website || "";
    this.username = user.username || "";
    this.avatar = user.avatar || "";
    this.cover_photo = user.cover_photo || "";
    this.role = user.role || "user"; // Giá trị mặc định là 'user'
  }
}