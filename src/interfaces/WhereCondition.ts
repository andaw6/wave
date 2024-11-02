export interface WhereCondition {
    OR?: Array<Record<string, any>>;
    createdAt?: Record<string, Date>;
    [key: string]: any;
}
