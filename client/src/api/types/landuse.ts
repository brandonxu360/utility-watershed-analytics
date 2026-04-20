export type LanduseEntry = {
  desc: string;
  color: string;
};

export type LanduseMap = Record<number, LanduseEntry>;

export type FetchLanduseOptions = {
  runId: string;
  include_schema?: boolean;
  include_sql?: boolean;
  limit?: number;
  scenario?: string;
};
