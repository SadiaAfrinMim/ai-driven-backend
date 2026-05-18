import { JwtPayload } from "jsonwebtoken";
import { TUser } from "./user.interface";

declare global {
  namespace Express {
    interface Request {
      user: TUser;
    }
  }
}