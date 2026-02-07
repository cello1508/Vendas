export interface Sale {
  id: string;
  amount: number;
  date: string; // ISO Date string
  description: string;
  status: 'paid' | 'pending';
  receipt?: string;
}

export interface MonthGoal {
  id: string; // Format: "YYYY-MM"
  revenue: number;
  count: number;
}

export interface Insight {
  title: string;
  message: string;
  type: 'positive' | 'neutral' | 'negative';
}

export interface Call {
  id: string;
  date: string;
}
