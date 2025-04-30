const Contracts = require('../../src/datasources/contracts/contracts');
const FieldService = require('../../src/service/field-service');
const { toBigInt } = require('../../src/utils/number');
const { mockBeanstalkSG } = require('../util/mock-sg');

describe('FieldService', () => {
  describe('Plot summary', () => {
    beforeEach(async () => {
      jest.restoreAllMocks();
      const allPlots = require('../mock-responses/service/field/allPlots.json');
      jest.spyOn(mockBeanstalkSG, 'request').mockResolvedValueOnce(allPlots);
      jest.spyOn(Contracts, 'getBeanstalk').mockReturnValue({
        harvestableIndex: jest.fn().mockResolvedValue(5000)
      });
    });

    it('Small plots overlapping 2 buckets', async () => {
      const result = await FieldService.getAggregatePlotSummary(10000);

      expect(result.length).toBe(3);
      expect(result[0].startIndex).toBe(0n);
      expect(result[0].endIndex).toBe(toBigInt(10000, 6));
      expect(result[0].startSeason).toBe(2);
      expect(result[0].endSeason).toBe(5);
      expect(result[0].numPlots).toBe(2);
      expect(result[2].endIndex).toBe(toBigInt(23500, 6));

      expect(result[0].avgSownBeansPerPod).toBeCloseTo(0.525, 3);
      expect(result[1].avgSownBeansPerPod).toBeCloseTo(0.3, 3);
      expect(result[2].avgSownBeansPerPod).toBeCloseTo(0.2, 3);

      expect(result.map((x) => x.avgAPR)).toMatchSnapshot();
    });

    it('Small plots starting/ending at bucket boundaries', async () => {
      const result = await FieldService.getAggregatePlotSummary(7500);

      expect(result.length).toBe(4);
      expect(result[0].startIndex).toBe(0n);
      expect(result[0].endIndex).toBe(toBigInt(7500, 6));
      expect(result[0].startSeason).toBe(2);
      expect(result[0].endSeason).toBe(2);
      expect(result[0].numPlots).toBe(1);
      expect(result[1].startSeason).toBe(5);
      expect(result[1].numPlots).toBe(2);
      expect(result[3].endIndex).toBe(toBigInt(23500, 6));

      expect(result[0].avgSownBeansPerPod).toBeCloseTo(0.5, 3);
      expect(result[1].avgSownBeansPerPod).toBeCloseTo(0.467, 3);
      expect(result[2].avgSownBeansPerPod).toBeCloseTo(0.2, 3);
      expect(result[3].avgSownBeansPerPod).toBeCloseTo(0.2, 3);

      expect(result.map((x) => x.avgAPR)).toMatchSnapshot();
    });

    it('Large plots filling entire buckets', async () => {
      const result = await FieldService.getAggregatePlotSummary(3000);

      expect(result.length).toBe(8);
      expect(result[0].numPlots).toBe(1);
      expect(result[1].numPlots).toBe(1);
      expect(result[2].numPlots).toBe(2);

      expect(result[0].avgSownBeansPerPod).toBeCloseTo(0.5, 3);
      expect(result[1].avgSownBeansPerPod).toBeCloseTo(0.5, 3);
      expect(result[2].avgSownBeansPerPod).toBeCloseTo(0.55, 3);

      expect(result.map((x) => x.avgAPR)).toMatchSnapshot();
    });

    describe('Cache/time manipulation', () => {
      beforeAll(() => {
        jest.useFakeTimers();
      });

      afterAll(() => {
        jest.useRealTimers();
      });

      it('Uses cached values when available', async () => {
        const timestamp = new Date();
        jest.spyOn(FieldService, 'cache', 'get').mockReturnValue({
          10000: {
            timestamp,
            result: 'result'
          }
        });
        const sgSpy = jest.spyOn(mockBeanstalkSG, 'request');

        const result = await FieldService.getAggregatePlotSummary(10000);

        expect(result).toBe('result');
        expect(sgSpy).not.toHaveBeenCalled();
      });

      it('Cache miss due to stale timestamp', async () => {
        jest.spyOn(FieldService, 'cache', 'get').mockReturnValue({
          10000: {
            timestamp: new Date(Date.now() - 1000 * 60 * 300 - 1),
            result: 'result'
          }
        });
        const sgSpy = jest.spyOn(mockBeanstalkSG, 'request');

        jest.setSystemTime(Date.now() + 1000 * 60 * 300 + 1);
        const result = await FieldService.getAggregatePlotSummary(10000);

        expect(result).not.toBe('result');
        expect(sgSpy).toHaveBeenCalled();
      });

      it('Does not cache values for random bucket sizes', async () => {
        await FieldService.getAggregatePlotSummary(12345);

        expect(FieldService.cache[12345]).toBeUndefined();
      });
    });
  });
});
