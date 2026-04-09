export declare enum ReminderType {
    OIL_CHANGE = "oil_change",
    FILTER_CHANGE = "filter_change",
    TIRE_ROTATION = "tire_rotation",
    BRAKE_CHECK = "brake_check",
    BATTERY_CHECK = "battery_check",
    GENERAL_INSPECTION = "general_inspection",
    CUSTOM = "custom"
}
export declare enum ReminderFrequency {
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    SEMI_ANNUAL = "semi_annual",
    ANNUAL = "annual",
    CUSTOM_KM = "custom_km"
}
export declare class VehicleReminderEntity {
    readonly id: string;
    readonly vehicleId: string;
    readonly userId: string;
    readonly type: ReminderType;
    readonly title: string;
    readonly description?: string | undefined;
    readonly reminderDate?: Date | undefined;
    readonly mileageThreshold?: number | undefined;
    readonly currentMileage?: number | undefined;
    readonly frequency?: ReminderFrequency | undefined;
    readonly isActive?: boolean | undefined;
    readonly isRecurring?: boolean | undefined;
    readonly lastTriggeredAt?: Date | undefined;
    readonly notes?: string | undefined;
    readonly createdAt?: Date | undefined;
    readonly updatedAt?: Date | undefined;
    constructor(id: string, vehicleId: string, userId: string, type: ReminderType, title: string, description?: string | undefined, reminderDate?: Date | undefined, mileageThreshold?: number | undefined, currentMileage?: number | undefined, frequency?: ReminderFrequency | undefined, isActive?: boolean | undefined, isRecurring?: boolean | undefined, lastTriggeredAt?: Date | undefined, notes?: string | undefined, createdAt?: Date | undefined, updatedAt?: Date | undefined);
    shouldTriggerByMileage(): boolean;
    isOverdue(): boolean;
    getDisplayLabel(): string;
}
