import { Model } from 'mongoose';
import { UserDocument } from '../../users/infrastructure/persistence/mongoose/schemas/user.schema';
import { PendingRegistrationDocument } from '../schemas/pending-registration.schema';
import { WhatsAppWebService } from '../../whatsapp/services/whatsapp-web.service';
import { IOtpResponse } from '../../../../core/interfaces';
export declare class OtpService {
    private userModel;
    private pendingRegistrationModel;
    private whatsAppService;
    private readonly logger;
    constructor(userModel: Model<UserDocument>, pendingRegistrationModel: Model<PendingRegistrationDocument>, whatsAppService: WhatsAppWebService);
    generateAndSave(phoneNumber: string): Promise<void>;
    private buildOTPMessage;
    createResponse(phoneNumber: string): IOtpResponse;
    generateAndSaveForPending(phoneNumber: string): Promise<void>;
    checkWhatsAppConnection(): Promise<boolean>;
}
