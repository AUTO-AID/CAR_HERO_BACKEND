import { Model } from 'mongoose';
import { UserDocument } from '../../database/schemas/user.schema';
export declare class ProfileService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
}
