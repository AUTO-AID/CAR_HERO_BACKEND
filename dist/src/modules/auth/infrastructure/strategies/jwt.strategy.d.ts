import { Model } from 'mongoose';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { IJwtPayload } from '../../../../core/interfaces';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private userModel;
    private configService;
    constructor(userModel: Model<UserDocument>, configService: ConfigService);
    validate(payload: IJwtPayload): Promise<IJwtPayload>;
}
export {};
