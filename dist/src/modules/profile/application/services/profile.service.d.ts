import { Model } from 'mongoose';
import { UserDocument } from '../../../../modules/users/infrastructure/persistence/mongoose/schemas/user.schema';
export declare class ProfileService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
}
