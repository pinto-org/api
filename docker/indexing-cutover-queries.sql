-- Deposit migration (indexing_ -> actual)
begin;
truncate table deposit;
insert into deposit ("id", "chain", "account", "tokenId", "stem", "depositedAmount", "depositedBdv", "currentStalk", "baseStalk", "grownStalk", "mowStem", "mowableStalk", "currentSeeds", "bdvOnLambda", "stalkOnLambda", "seedsOnLambda", "createdAt", "updatedAt") select "id", "chain", "account", "tokenId", "stem", "depositedAmount", "depositedBdv", "currentStalk", "baseStalk", "grownStalk", "mowStem", "mowableStalk", "currentSeeds", "bdvOnLambda", "stalkOnLambda", "seedsOnLambda", "createdAt", "updatedAt" from indexing_deposit;
update "ApiMeta" set "lastDepositUpdate" = (select "lastDepositUpdate" from "indexing_ApiMeta");
commit;


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


-- Tractor migration (indexing_ -> actual)
begin;
truncate table tractor_snapshot_sow_v0, tractor_execution_sow_v0, tractor_order_sow_v0, tractor_execution, tractor_order;
insert into tractor_order ("blueprintHash", "orderType", "publisher", "data", "operatorPasteInstrs", "maxNonce", "startTime", "endTime", "signature", "publishedTimestamp", "publishedBlock", "beanTip", "cancelled", "createdAt", "updatedAt") select "blueprintHash", "orderType"::text::public."enum_tractor_order_orderType", "publisher", "data", "operatorPasteInstrs", "maxNonce", "startTime", "endTime", "signature", "publishedTimestamp", "publishedBlock", "beanTip", "cancelled", "createdAt", "updatedAt" from indexing_tractor_order;
insert into tractor_execution select * from indexing_tractor_execution;
insert into tractor_order_sow_v0 select * from indexing_tractor_order_sow_v0;
insert into tractor_execution_sow_v0 ("id", "blueprintHash", "index", "beans", "pods", "placeInLine", "usedTokenIndices", "usedGrownStalkPerBdv", "createdAt", "updatedAt") select "id", "blueprintHash", "index", "beans", "pods", "placeInLine", "usedTokenIndices", "usedGrownStalkPerBdv", "createdAt", "updatedAt" from indexing_tractor_execution_sow_v0;
insert into tractor_snapshot_sow_v0 ("id", "snapshotTimestamp", "snapshotBlock", "totalPintoSown", "totalPodsMinted", "totalCascadeFundedBelowTemp", "totalCascadeFundedAnyTemp", "totalTipsPaid", "currentMaxTip", "totalExecutions", "createdAt", "updatedAt", "season", "maxSowThisSeason", "uniquePublishers") select "id", "snapshotTimestamp", "snapshotBlock", "totalPintoSown", "totalPodsMinted", "totalCascadeFundedBelowTemp", "totalCascadeFundedAnyTemp", "totalTipsPaid", "currentMaxTip", "totalExecutions", "createdAt", "updatedAt", "season", "maxSowThisSeason", "uniquePublishers" from indexing_tractor_snapshot_sow_v0;
update "ApiMeta" set "lastTractorUpdate" = (select "lastTractorUpdate" from "indexing_ApiMeta");
commit;


-- Deposit cleanup
begin;
drop table indexing_deposit;
update "indexing_ApiMeta" set "lastDepositUpdate" = null, "lastLambdaBdvs" = null;
commit;


-- Field Inflow cleanup
begin;
drop table indexing_field_inflow;
drop table indexing_field_inflow_snapshot;
update "indexing_ApiMeta" set "lastFieldInflowUpdate" = null;
commit;


-- Silo Inflow cleanup
begin;
drop table indexing_silo_inflow;
drop table indexing_silo_inflow_snapshot;
update "indexing_ApiMeta" set "lastSiloInflowUpdate" = null;
commit;


-- Tractor cleanup
begin;
drop table indexing_tractor_snapshot_sow_v0;
drop table indexing_tractor_execution_sow_v0;
drop table indexing_tractor_order_sow_v0;
drop table indexing_tractor_execution;
drop table indexing_tractor_order;
update "indexing_ApiMeta" set "lastTractorUpdate" = null;
commit;
