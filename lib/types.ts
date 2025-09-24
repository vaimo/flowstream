export type Project = {
  id: string;
  name: string;
  url: string;
  description?: string;
  tags?: string[];
  jiraKey?: string;
  updatedAt: string;
};

export type FlowMetrics = {
  month: string;           // YYYY-MM
  throughputRatio: number; // 0..1
  wipRatio: number;        // 0..1
  qualitySpecial: number;  // 0..1
  cycleTimeP50: number;    // days
  cycleTimeP85: number;    // days
  cycleTimeP95: number;    // days
  // Raw counts for display
  wipCount?: number;       // Actual number of items in WIP
  throughputCount?: number; // Actual number of items completed
  totalItemsCount?: number; // Total number of items processed
  qualityIssuesCount?: number; // Number of quality issues
  qualityWindowStart?: string; // ISO timestamp for start of quality lookback window
  qualityWindowEnd?: string;   // ISO timestamp for end of quality lookback window
};

export type CoreWebVitals = {
  lcp: number;   // Largest Contentful Paint (seconds)
  cls: number;   // Cumulative Layout Shift (score 0-1)
  inp: number;   // Interaction to Next Paint (milliseconds)
};

export type PerfMetrics = {
  month: string;
  coreWebVitals: CoreWebVitals;
  accessibility: number; // 0..1
  bestPractices: number; // 0..1
  seo: number;           // 0..1
};

export type ProjectMetrics = {
  projectId: string;
  month: string;
  perf: {
    coreWebVitals: CoreWebVitals;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  flow: Omit<FlowMetrics, 'month'>;
};

export type Suggestion = {
  id: string;
  text: string;
  rationale: string;
  source: 'ai' | 'rule';
  status: 'new' | 'done' | 'irrelevant';
  createdAt: string;
  updatedAt: string;
};

export type QualityIncident = {
  projectId: string;
  key: string;
  category: string;
  status: 'open' | 'resolved';
  detectedAt: string;
  resolvedAt?: string;
};

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type ChartSeries = {
  name: string;
  data: ChartDataPoint[];
  color?: string;
};
