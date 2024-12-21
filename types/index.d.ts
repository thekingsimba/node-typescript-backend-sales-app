
interface IUser {
  user: {
    _id: Schema.Types.ObjectId;
    email: string;
    role: Schema.Types.ObjectId;
  }
  
}

declare namespace Express {
  interface Request {
    user: IUser["user"]
  }
}

