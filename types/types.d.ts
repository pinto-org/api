import DepositDto from '../src/repository/dto/DepositDto';
import TractorOrderDto from '../src/repository/dto/tractor/TractorOrderDto';
import TractorExecutionDto from '../src/repository/dto/tractor/TractorExecutionDto';
import SowV0OrderDto from '../src/repository/dto/tractor/SowV0OrderDto';
import SowV0ExecutionDto from '../src/repository/dto/tractor/SowV0ExecutionDto';
import { TractorOrderType } from '../src/repository/postgres/models/types/types';

export type DepositYield = {
  // Percentage growth in deposit's bdv
  bean: number;
  // Percentage growth in deposit's stalk
  stalk: number;
  // Percentage growth in the deposit's share of silo ownership
  ownership: number;
};

export type DepositYieldMap = {
  [asset: string]: DepositYield;
};

export type WindowYieldMap = {
  [window: number]: DepositYieldMap;
};

export type CalcApysResult = {
  season: number;
  yields: WindowYieldMap;
  initType: ApyInitType;
  ema: { [requestedWindow: string]: WindowEMAResult };
};

export type WindowEMAResult = {
  // The effective window (may be less than what was requested)
  effectiveWindow: number;
  // EMA number of beans earned per season
  beansPerSeason: BigInt;
};

export type Deposit = {
  // (user deposited stalk) / (user deposited bdv + user germinating bdv)
  stalkPerBdv: number;
  // [Even, Odd] germinating stalk ratio of this deposit type.
  // Each entry should be computed as: (user germinating stalk) / (user deposited bdv + user germinating bdv)
  germinating?: [number];
};

export const ApyInitType: {
  NEW: 'NEW';
  AVERAGE: 'AVERAGE';
};
export type ApyInitType = (typeof ApyInitType)[keyof typeof ApyInitType];

export type CalcApyOptions = {
  // Whether to initialize apy calculation with a new deposit or an average deposit.
  initType?: ApyInitType;
  // Initial values of a deposit starting states. Takes precedence over initType
  initUserValues?: Deposit[];
  // Override setting for the number of beans per season. The windows inside this object must match
  // the windows in the outer request's emaWindows
  ema?: WindowEMAResult[];
  // Target number of hours for a deposit's grown stalk to catch up (for gauge only)
  catchUpRate?: number;
  // The duration for which to calculate the apy (if other than 1 year)
  duration?: number;
  // Indicates whether any parameter validation should be skipped
  skipValidation?: number;
};

export type GetApyRequest = {
  season?: number;
  emaWindows?: number[];
  tokens?: string[];
  options?: CalcApyOptions;
};

export type GetApyHistoryRequest = {
  token: string;
  emaWindow: number;
  initType: ApyInitType;
  fromSeason: number;
  toSeason: number;
  // Identifies how many records to skip, i.e. pull one record for every 5 seasons
  interval?: number;
};

export type GetApyHistoryResult = {
  [season: number]: DepositYield;
};

export type SortType = 'absolute' | 'relative';
export type SortFields = 'bdv' | 'stalk' | 'seeds';
export type LambdaBdvType = 'increase' | 'decrease';

export type DepositsSortOptions = {
  type: SortType;
  field: SortFields;
};

export type GetDepositsRequest = {
  account?: string;
  token?: string;
  lambdaBdvChange?: LambdaBdvType;
  sort?: DepositsSortOptions;
  limit?: number;
  skip?: number;
};

export type GetDepositsResult = {
  // Block number
  lastUpdated: number;
  deposits: DepositDto[];
};

type SowV0OrderRequestParams = {
  orderComplete?: boolean;
};

type SowV0ExecutionRequestParams = {
  usedToken?: string;
};

// Union types for all possible blueprint-specific values
type BlueprintOrderRequestParams = SowV0OrderRequestParams;
type BlueprintOrderResponse = SowV0OrderDto;
type BlueprintExecutionRequestParams = SowV0ExecutionRequestParams;
type BlueprintExecutionResponse = SowV0ExecutionDto;

export type TractorOrderRequest = {
  orderType?: keyof TractorOrderType | 'KNOWN' | 'UKNOWN';
  blueprintHash?: string;
  publisher?: string;
  publishedBetween?: [Date, Date];
  validBetween?: [Date, Date];
  cancelled?: boolean;
  blueprintParams?: BlueprintOrderRequestParams;
  // Pagination
  limit?: number;
  skip?: number;
};

export type TractorExecutionRequest = {
  orderType?: keyof TractorOrderType | 'KNOWN' | 'UKNOWN';
  blueprintHash?: string;
  publisher?: string;
  operator?: string;
  executedBetween?: [Date, Date];
  blueprintParams?: BlueprintExecutionRequestParams;
  // Pagination
  limit?: number;
  skip?: number;
};

// Combines base order with blueprint-specific data
type TractorOrderResponse = TractorOrderDto & {
  blueprintData?: BlueprintOrderResponse;
};

// Combines base execution with blueprint-specific data
type TractorExecutionResponse = TractorExecutionDto & {
  blueprintData?: BlueprintExecutionResponse;
};

export type TractorOrdersResult = {
  // Block number
  lastUpdated: number;
  orders: TractorOrderResponse[];
  totalRecords: number;
};

export type TractorExecutionsResult = {
  // Block number
  lastUpdated: number;
  executions: TractorExecutionResponse[];
  totalRecords: number;
};
