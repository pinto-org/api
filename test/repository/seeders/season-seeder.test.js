const AlchemyUtil = require('../../../src/datasources/alchemy');
const FilterLogs = require('../../../src/datasources/events/filter-logs');
const SeasonRepository = require('../../../src/repository/postgres/queries/season-repository');
const SeasonSeeder = require('../../../src/repository/postgres/startup-seeders/season-seeder');
const SeasonService = require('../../../src/service/season-service');

describe('SeasonSeeder', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Fetches missing sunrise events with one bounded getLogs call', async () => {
    const season2 = { args: { season: 2 }, rawLog: { blockNumber: 101 } };
    const season3 = { args: { season: 3 }, rawLog: { blockNumber: 201 } };
    jest.spyOn(SeasonService, 'findMissingSeasons').mockResolvedValue([2, 3]);
    jest.spyOn(SeasonRepository, 'getMaxSeasonBlock').mockResolvedValue(100);
    jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue({
      getBlock: jest.fn().mockResolvedValue({ number: 300 })
    });
    jest.spyOn(FilterLogs, 'getBeanstalkEvents').mockResolvedValue([season2, season3]);
    const handleSpy = jest.spyOn(SeasonService, 'handleSunrise').mockResolvedValue();
    const insertSpy = jest.spyOn(SeasonService, 'insertSeason').mockResolvedValue();

    await SeasonSeeder.run();

    expect(FilterLogs.getBeanstalkEvents).toHaveBeenCalledTimes(1);
    expect(FilterLogs.getBeanstalkEvents).toHaveBeenCalledWith(['Sunrise'], {
      fromBlock: 101,
      toBlock: 300
    });
    expect(handleSpy).toHaveBeenCalledTimes(2);
    expect(handleSpy).toHaveBeenNthCalledWith(1, season2);
    expect(handleSpy).toHaveBeenNthCalledWith(2, season3);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  test('Chunks large sunrise ranges below FilterLogs max range', async () => {
    jest.spyOn(AlchemyUtil, 'providerForChain').mockReturnValue({
      getBlock: jest.fn().mockResolvedValue({ number: 1200100 })
    });
    jest.spyOn(FilterLogs, 'getBeanstalkEvents').mockResolvedValue([]);

    await SeasonSeeder.getSunriseEvents(100);

    expect(FilterLogs.getBeanstalkEvents).toHaveBeenCalledTimes(3);
    expect(FilterLogs.getBeanstalkEvents).toHaveBeenNthCalledWith(1, ['Sunrise'], {
      fromBlock: 100,
      toBlock: 500100
    });
    expect(FilterLogs.getBeanstalkEvents).toHaveBeenNthCalledWith(2, ['Sunrise'], {
      fromBlock: 500101,
      toBlock: 1000101
    });
    expect(FilterLogs.getBeanstalkEvents).toHaveBeenNthCalledWith(3, ['Sunrise'], {
      fromBlock: 1000102,
      toBlock: 1200100
    });
  });
});
