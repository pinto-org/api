-- Deposit migration (indexing_ -> actual)
begin;
truncate table deposit;
insert into deposit ("id", "chain", "account", "tokenId", "stem", "depositedAmount", "depositedBdv", "currentStalk", "baseStalk", "grownStalk", "mowStem", "mowableStalk", "currentSeeds", "bdvOnLambda", "stalkOnLambda", "seedsOnLambda", "createdAt", "updatedAt") select "id", "chain", "account", "tokenId", "stem", "depositedAmount", "depositedBdv", "currentStalk", "baseStalk", "grownStalk", "mowStem", "mowableStalk", "currentSeeds", "bdvOnLambda", "stalkOnLambda", "seedsOnLambda", "createdAt", "updatedAt" from indexing_deposit;
update "ApiMeta" set "lastDepositUpdate" = (select "lastDepositUpdate" from "indexing_ApiMeta");
commit;


--- @deprecated ---
-- Field inflow migration (indexing_ -> actual)
begin;
truncate table field_inflow;
truncate table field_inflow_snapshot;
insert into field_inflow ("id", "account", "beans", "usd", "isMarket", "block", "timestamp", "txnHash", "createdAt", "updatedAt") select "id", "account", "beans", "usd", "isMarket", "block", "timestamp", "txnHash", "createdAt", "updatedAt" from indexing_field_inflow;
insert into field_inflow_snapshot ("id", "snapshotTimestamp", "snapshotBlock", "season", "cumulativeBeansNet", "cumulativeBeansIn", "cumulativeBeansOut", "deltaBeansNet", "deltaBeansIn", "deltaBeansOut", "cumulativeUsdNet", "cumulativeUsdIn", "cumulativeUsdOut", "deltaUsdNet", "deltaUsdIn", "deltaUsdOut", "createdAt", "updatedAt") select "id", "snapshotTimestamp", "snapshotBlock", "season", "cumulativeBeansNet", "cumulativeBeansIn", "cumulativeBeansOut", "deltaBeansNet", "deltaBeansIn", "deltaBeansOut", "cumulativeUsdNet", "cumulativeUsdIn", "cumulativeUsdOut", "deltaUsdNet", "deltaUsdIn", "deltaUsdOut", "createdAt", "updatedAt" from indexing_field_inflow_snapshot;
update "ApiMeta" set "lastFieldInflowUpdate" = (select "lastFieldInflowUpdate" from "indexing_ApiMeta");
commit;
-- Silo inflow migration (indexing_ -> actual)
begin;
truncate table silo_inflow;
truncate table silo_inflow_snapshot;
insert into silo_inflow ("id", "account", "token", "amount", "bdv", "usd", "isLp", "isTransfer", "isPlenty", "block", "timestamp", "txnHash", "createdAt", "updatedAt") select "id", "account", "token", "amount", "bdv", "usd", "isLp", "isTransfer", "isPlenty", "block", "timestamp", "txnHash", "createdAt", "updatedAt" from indexing_silo_inflow;
insert into silo_inflow_snapshot ("id", "snapshotTimestamp", "snapshotBlock", "season", "cumulativeBdvNet", "cumulativeBdvIn", "cumulativeBdvOut", "deltaBdvNet", "deltaBdvIn", "deltaBdvOut", "cumulativeUsdNet", "cumulativeUsdIn", "cumulativeUsdOut", "deltaUsdNet", "deltaUsdIn", "deltaUsdOut", "createdAt", "updatedAt") select "id", "snapshotTimestamp", "snapshotBlock", "season", "cumulativeBdvNet", "cumulativeBdvIn", "cumulativeBdvOut", "deltaBdvNet", "deltaBdvIn", "deltaBdvOut", "cumulativeUsdNet", "cumulativeUsdIn", "cumulativeUsdOut", "deltaUsdNet", "deltaUsdIn", "deltaUsdOut", "createdAt", "updatedAt" from indexing_silo_inflow_snapshot;
update "ApiMeta" set "lastSiloInflowUpdate" = (select "lastSiloInflowUpdate" from "indexing_ApiMeta");
commit;
-------------------

-- Inflow migration (indexing_ -> actual)
begin;
truncate table silo_inflow, field_inflow, silo_inflow_snapshot, field_inflow_snapshot;
insert into silo_inflow ("id", "account", "token", "amount", "bdv", "usd", "isLp", "isTransfer", "isPlenty", "accountFieldNegationBdv", "accountFieldNegationUsd", "protocolFieldNegationBdv", "protocolFieldNegationUsd", "block", "timestamp", "txnHash", "createdAt", "updatedAt") select "id", "account", "token", "amount", "bdv", "usd", "isLp", "isTransfer", "isPlenty", "accountFieldNegationBdv", "accountFieldNegationUsd", "protocolFieldNegationBdv", "protocolFieldNegationUsd", "block", "timestamp", "txnHash", "createdAt", "updatedAt" from indexing_silo_inflow;
insert into field_inflow ("id", "account", "beans", "usd", "isMarket", "accountSiloNegationBdv", "accountSiloNegationUsd", "protocolSiloNegationBdv", "protocolSiloNegationUsd", "block", "timestamp", "txnHash", "createdAt", "updatedAt") select "id", "account", "beans", "usd", "isMarket", "accountSiloNegationBdv", "accountSiloNegationUsd", "protocolSiloNegationBdv", "protocolSiloNegationUsd", "block", "timestamp", "txnHash", "createdAt", "updatedAt" from indexing_field_inflow;
// TODO: Snapshots will need to be updated
commit;

-- Tractor migration (indexing_ -> actual)
-- Column names need to be explicit if new properties are added (since the order will differ between the env)
begin;
truncate table tractor_snapshot_sow_v0, tractor_snapshot_convert_up_v0, tractor_execution_sow_v0, tractor_execution_convert_up_v0, tractor_order_sow_v0, tractor_order_convert_up_v0, tractor_execution, tractor_order;
insert into tractor_order ("blueprintHash", "orderType", "publisher", "data", "operatorPasteInstrs", "maxNonce", "startTime", "endTime", "signature", "publishedTimestamp", "publishedBlock", "beanTip", "cancelled", "lastExecutableSeason", "createdAt", "updatedAt") select "blueprintHash", "orderType"::text::public."enum_tractor_order_orderType", "publisher", "data", "operatorPasteInstrs", "maxNonce", "startTime", "endTime", "signature", "publishedTimestamp", "publishedBlock", "beanTip", "cancelled", "lastExecutableSeason", "createdAt", "updatedAt" from indexing_tractor_order;
insert into tractor_execution select * from indexing_tractor_execution;
insert into tractor_order_sow_v0 select * from indexing_tractor_order_sow_v0;
insert into tractor_order_convert_up_v0 ("blueprintHash", "lastExecutedTimestamp", "beansLeftToConvert", "orderComplete", "amountFunded", "cascadeAmountFunded", "sourceTokenIndices", "totalBeanAmountToConvert", "minBeansConvertPerExecution", "maxBeansConvertPerExecution", "capAmountToBonusCapacity", "minTimeBetweenConverts", "minConvertBonusCapacity", "maxGrownStalkPerBdv", "grownStalkPerBdvBonusBid", "maxPriceToConvertUp", "minPriceToConvertUp", "seedDifference", "maxGrownStalkPerBdvPenalty", "slippageRatio", "lowStalkDeposits", "createdAt", "updatedAt") select "blueprintHash", "lastExecutedTimestamp", "beansLeftToConvert", "orderComplete", "amountFunded", "cascadeAmountFunded", "sourceTokenIndices", "totalBeanAmountToConvert", "minBeansConvertPerExecution", "maxBeansConvertPerExecution", "capAmountToBonusCapacity", "minTimeBetweenConverts", "minConvertBonusCapacity", "maxGrownStalkPerBdv", "grownStalkPerBdvBonusBid", "maxPriceToConvertUp", "minPriceToConvertUp", "seedDifference", "maxGrownStalkPerBdvPenalty", "slippageRatio", "lowStalkDeposits"::text::public."enum_tractor_order_convert_up_v0_lowStalkDeposits", "createdAt", "updatedAt" from indexing_tractor_order_convert_up_v0;
insert into tractor_execution_sow_v0 ("id", "blueprintHash", "index", "beans", "pods", "placeInLine", "usedTokenIndices", "usedGrownStalkPerBdv", "createdAt", "updatedAt") select "id", "blueprintHash", "index", "beans", "pods", "placeInLine", "usedTokenIndices", "usedGrownStalkPerBdv", "createdAt", "updatedAt" from indexing_tractor_execution_sow_v0;
insert into tractor_execution_convert_up_v0 ("id", "blueprintHash", "usedTokenIndices", "tokenFromAmounts", "tokenToAmounts", "beansConverted", "beanPriceBefore", "beanPriceAfter", "gsBonusStalk", "gsBonusBdv", "gsPenaltyStalk", "gsPenaltyBdv", "createdAt", "updatedAt") select "id", "blueprintHash", "usedTokenIndices", "tokenFromAmounts", "tokenToAmounts", "beansConverted", "beanPriceBefore", "beanPriceAfter", "gsBonusStalk", "gsBonusBdv", "gsPenaltyStalk", "gsPenaltyBdv", "createdAt", "updatedAt" from indexing_tractor_execution_convert_up_v0;
insert into tractor_snapshot_sow_v0 ("id", "snapshotTimestamp", "snapshotBlock", "totalPintoSown", "totalPodsMinted", "totalCascadeFundedBelowTemp", "totalCascadeFundedAnyTemp", "totalTipsPaid", "currentMaxTip", "totalExecutions", "createdAt", "updatedAt", "season", "maxSowThisSeason", "uniquePublishers") select "id", "snapshotTimestamp", "snapshotBlock", "totalPintoSown", "totalPodsMinted", "totalCascadeFundedBelowTemp", "totalCascadeFundedAnyTemp", "totalTipsPaid", "currentMaxTip", "totalExecutions", "createdAt", "updatedAt", "season", "maxSowThisSeason", "uniquePublishers" from indexing_tractor_snapshot_sow_v0;
insert into tractor_snapshot_convert_up_v0 ("id", "snapshotTimestamp", "snapshotBlock", "season", "totalBeansConverted", "totalGsBonusStalk", "totalGsBonusBdv", "totalGsPenaltyStalk", "totalGsPenaltyBdv", "totalCascadeFunded", "totalCascadeFundedExecutable", "totalTipsPaid", "currentMaxTip", "totalExecutions", "uniquePublishers", "createdAt", "updatedAt") select "id", "snapshotTimestamp", "snapshotBlock", "season", "totalBeansConverted", "totalGsBonusStalk", "totalGsBonusBdv", "totalGsPenaltyStalk", "totalGsPenaltyBdv", "totalCascadeFunded", "totalCascadeFundedExecutable", "totalTipsPaid", "currentMaxTip", "totalExecutions", "uniquePublishers", "createdAt", "updatedAt" from indexing_tractor_snapshot_convert_up_v0;
update "ApiMeta" set "lastTractorUpdate" = (select "lastTractorUpdate" from "indexing_ApiMeta");
commit;


-- Misc cleanup
begin;
drop table if exists indexing_deposit;
drop table if exists indexing_season;
drop table if exists indexing_yield;
drop type if exists "enum_indexing_yield_initType";
drop table if exists indexing_token;
commit;


-- Deposit cleanup
begin;
drop table if exists indexing_deposit;
update "indexing_ApiMeta" set "lastDepositUpdate" = null, "lastLambdaBdvs" = null;
commit;


-- Field Inflow cleanup
begin;
drop table if exists indexing_field_inflow;
drop table if exists indexing_field_inflow_snapshot;
update "indexing_ApiMeta" set "lastFieldInflowUpdate" = null;
commit;


-- Silo Inflow cleanup
begin;
drop table if exists indexing_silo_inflow;
drop table if exists indexing_silo_inflow_snapshot;
update "indexing_ApiMeta" set "lastSiloInflowUpdate" = null;
commit;


-- Tractor cleanup
begin;
drop table if exists indexing_tractor_snapshot_sow_v0;
drop table if exists indexing_tractor_snapshot_convert_up_v0;
drop table if exists indexing_tractor_execution_sow_v0;
drop table if exists indexing_tractor_execution_convert_up_v0;
drop table if exists indexing_tractor_order_sow_v0;
drop table if exists indexing_tractor_order_convert_up_v0;
drop table if exists indexing_tractor_execution;
drop table if exists indexing_tractor_order;
drop type if exists "enum_indexing_tractor_order_orderType";
drop type if exists "enum_indexing_tractor_order_convert_up_v0_lowStalkDeposits";
update "indexing_ApiMeta" set "lastTractorUpdate" = null;
commit;
