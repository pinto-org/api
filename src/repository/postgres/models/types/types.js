const ApyInitType = {
  NEW: 'NEW',
  AVERAGE: 'AVERAGE'
};

const TractorOrderType = {
  SOW_V0: 'SOW_V0',
  CONVERT_UP_V0: 'CONVERT_UP_V0'
};

const TractorOrderSowBlueprintVersion = {
  V0: 'V0',
  REFERRAL: 'REFERRAL'
};

const TractorOrderConvertUpBlueprintVersion = {
  V0: 'V0'
};

const StalkModeArray = ['USE', 'OMIT', 'USE_LAST'];
const intToStalkMode = (i) => StalkModeArray[i];
const stalkModeToInt = (stalkMode) => StalkModeArray.indexOf(stalkMode);

const StalkMode = StalkModeArray.reduce((acc, value) => {
  acc[value] = value;
  return acc;
}, {});

module.exports = {
  ApyInitType,
  TractorOrderType,
  TractorOrderSowBlueprintVersion,
  TractorOrderConvertUpBlueprintVersion,
  StalkMode,
  intToStalkMode,
  stalkModeToInt
};
