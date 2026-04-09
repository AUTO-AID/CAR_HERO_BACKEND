export class Wallet {
  constructor(
    public readonly ownerId: string,
    public readonly ownerType: 'user' | 'provider' | 'system',
    public balance: number = 0,
    public pendingBalance: number = 0,
    public loyaltyPoints: number = 0,
    public currency: string = 'SAR',
    public isActive: boolean = true,
    public readonly id?: string,
    public metadata: Record<string, any> = {},
  ) {}

  public hasSufficientBalance(amount: number): boolean {
    return this.balance >= amount;
  }

  public deposit(amount: number): void {
    if (amount <= 0) throw new Error('Deposit amount must be positive');
    this.balance += amount;
  }

  public withdraw(amount: number): void {
    if (amount <= 0) throw new Error('Withdrawal amount must be positive');
    if (!this.hasSufficientBalance(amount)) throw new Error('Insufficient balance');
    this.balance -= amount;
  }

  public addPendingBalance(amount: number): void {
    this.pendingBalance += amount;
  }

  public confirmPendingBalance(amount: number): void {
    if (this.pendingBalance < amount) throw new Error('Insufficient pending balance');
    this.pendingBalance -= amount;
    this.balance += amount;
  }
}
