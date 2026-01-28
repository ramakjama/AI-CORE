export interface IAccountingEntry {
  id: string;
  description: string;
  date: Date;
  reference?: string;
  status: 'pending' | 'approved' | 'rejected';
  lines: IAccountingLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAccountingLine {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface IJournalEntry {
  id: string;
  description: string;
  date: Date;
  reference?: string;
  lines: IAccountingLine[];
  balanced: boolean;
  totalDebit: number;
  totalCredit: number;
  createdAt: Date;
}

export interface IReconciliation {
  id: string;
  accountId: string;
  date: Date;
  status: 'in_progress' | 'completed' | 'failed';
  statementBalance: number;
  systemBalance: number;
  difference: number;
  matchedTransactions: string[];
  unmatchedTransactions: string[];
  startedAt: Date;
  completedAt?: Date;
}

export interface IBalanceSheet {
  asOfDate: Date;
  assets: {
    current: any;
    fixed: any;
    total: number;
  };
  liabilities: {
    current: any;
    longTerm: any;
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}
