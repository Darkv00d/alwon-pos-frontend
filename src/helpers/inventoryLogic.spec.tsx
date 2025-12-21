import { getProductStock, getLotsWithBalance, allocateFEFO } from './inventoryLogic';
import * as dbModule from './db';
import { DB } from './schema';

// Mock the db helper
const mockDb = {
  selectFrom: jasmine.createSpy('selectFrom'),
};

const mockQueryBuilder = {
  select: jasmine.createSpy('select'),
  where: jasmine.createSpy('where'),
  executeTakeFirst: jasmine.createSpy('executeTakeFirst'),
  innerJoin: jasmine.createSpy('innerJoin'),
  groupBy: jasmine.createSpy('groupBy'),
  having: jasmine.createSpy('having'),
  orderBy: jasmine.createSpy('orderBy'),
  execute: jasmine.createSpy('execute'),
};

describe('inventoryLogic', () => {
  beforeEach(() => {
    // Reset all spies
    jasmine.createSpy().and.stub();
    
    // Setup the mock chain
    mockDb.selectFrom.and.returnValue(mockQueryBuilder);
    mockQueryBuilder.select.and.returnValue(mockQueryBuilder);
    mockQueryBuilder.where.and.returnValue(mockQueryBuilder);
    mockQueryBuilder.innerJoin.and.returnValue(mockQueryBuilder);
    mockQueryBuilder.groupBy.and.returnValue(mockQueryBuilder);
    mockQueryBuilder.having.and.returnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.and.returnValue(mockQueryBuilder);
    
    // Mock the db module
    spyOnProperty(dbModule, 'db', 'get').and.returnValue(mockDb as unknown as import("kysely").Kysely<DB>);
  });

  describe('getProductStock', () => {
    it('should calculate stock correctly with positive and negative movements', async () => {
      const mockResult = { totalStock: '150' };
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve(mockResult));

      const result = await getProductStock('product-uuid-1');

      expect(result).toBe(150);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('stockMovements');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('productUuid', '=', 'product-uuid-1');
    });

    it('should return 0 for products with no movements', async () => {
      const mockResult = { totalStock: null };
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve(mockResult));

      const result = await getProductStock('product-uuid-2');

      expect(result).toBe(0);
    });

    it('should return 0 when no result is returned', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve(null));

      const result = await getProductStock('product-uuid-3');

      expect(result).toBe(0);
    });

    it('should handle database errors appropriately', async () => {
      const dbError = new Error('Database connection failed');
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.reject(dbError));

      try {
        await getProductStock('product-uuid-4');
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain('Failed to get stock for product product-uuid-4');
        expect(err.message).toContain('Database connection failed');
      }
    });

    it('should handle unknown errors', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.reject('Unknown error'));

      try {
        await getProductStock('product-uuid-5');
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('An unknown error occurred while getting stock for product product-uuid-5');
      }
    });
  });

  describe('getLotsWithBalance', () => {
    it('should return lots with positive balance ordered by expiration date', async () => {
      const mockLots = [
        {
          id: 'lot-1',
          lotCode: 'LOT001',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-01-15'),
          balance: 25,
        },
        {
          id: 'lot-2',
          lotCode: 'LOT002',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-02-20'),
          balance: 50,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await getLotsWithBalance('product-uuid-1');

      expect(result).toEqual(mockLots);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('productLots');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('stockMovements', 'productLots.id', 'stockMovements.lotId');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('productLots.productUuid', '=', 'product-uuid-1');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('productLots.expiresOn', 'asc');
    });

    it('should return empty array when no lots have positive balance', async () => {
      mockQueryBuilder.execute.and.returnValue(Promise.resolve([]));

      const result = await getLotsWithBalance('product-uuid-2');

      expect(result).toEqual([]);
    });

    it('should handle lots without expiration dates (FEFO ordering)', async () => {
      const mockLots = [
        {
          id: 'lot-1',
          lotCode: 'LOT001',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-01-15'),
          balance: 25,
        },
        {
          id: 'lot-2',
          lotCode: 'LOT002',
          productUuid: 'product-uuid-1',
          expiresOn: null,
          balance: 30,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await getLotsWithBalance('product-uuid-1');

      expect(result).toEqual(mockLots);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('productLots.expiresOn', 'asc');
    });

    it('should handle database errors appropriately', async () => {
      const dbError = new Error('Database query failed');
      mockQueryBuilder.execute.and.returnValue(Promise.reject(dbError));

      try {
        await getLotsWithBalance('product-uuid-error');
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain('Failed to get lots for product product-uuid-error');
        expect(err.message).toContain('Database query failed');
      }
    });
  });

  describe('allocateFEFO', () => {
    it('should allocate from single lot when sufficient stock', async () => {
      // First mock getProductStock call
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '100' }));
      
      // Then mock getLotsWithBalance call  
      const mockLots = [
        {
          id: 'lot-1',
          lotCode: 'LOT001',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-01-15'),
          balance: 100,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-uuid-1', 50);

      expect(result).toEqual([
        {
          lotId: 'lot-1',
          quantity: 50,
        },
      ]);
    });

    it('should allocate from multiple lots using FEFO logic', async () => {
      // Mock calls to return multiple lots
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '100' }));
      const mockLots = [
        {
          id: 'lot-1',
          lotCode: 'LOT001',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-01-15'),
          balance: 30,
        },
        {
          id: 'lot-2',
          lotCode: 'LOT002',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-02-20'),
          balance: 70,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-uuid-1', 80);

      expect(result).toEqual([
        {
          lotId: 'lot-1',
          quantity: 30,
        },
        {
          lotId: 'lot-2',
          quantity: 50,
        },
      ]);
    });

    it('should throw error for insufficient stock with precise numbers and message', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '85' }));

      try {
        await allocateFEFO('product-abc-123', 120);
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Insufficient stock for product product-abc-123. Requested: 120, Available: 85');
      }
    });

    it('should use FEFO logic with realistic expiration dates - oldest first', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '250' }));
      
      // Mock lots with realistic dates - expired, near expiry, and future expiry
      const mockLots = [
        {
          id: 'lot-expired',
          lotCode: 'EXP001',
          productUuid: 'product-medicine-1',
          expiresOn: new Date('2024-01-10'), // Expired
          balance: 25,
        },
        {
          id: 'lot-soon',
          lotCode: 'SOON002',
          productUuid: 'product-medicine-1',
          expiresOn: new Date('2024-03-15'), // Expires soon
          balance: 75,
        },
        {
          id: 'lot-future',
          lotCode: 'FUT003',
          productUuid: 'product-medicine-1',
          expiresOn: new Date('2024-12-31'), // Future expiry
          balance: 150,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-medicine-1', 120);

      // Should allocate from expired first, then soon-to-expire, then future
      expect(result).toEqual([
        {
          lotId: 'lot-expired',
          quantity: 25,
        },
        {
          lotId: 'lot-soon',
          quantity: 75,
        },
        {
          lotId: 'lot-future',
          quantity: 20,
        },
      ]);
    });

    it('should handle partial allocation across multiple lots with specific quantities', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '450' }));
      
      const mockLots = [
        {
          id: 'lot-dairy-1',
          lotCode: 'DAIRY001',
          productUuid: 'product-milk-1',
          expiresOn: new Date('2024-02-05'), // Expires in 3 days
          balance: 48,
        },
        {
          id: 'lot-dairy-2',
          lotCode: 'DAIRY002',
          productUuid: 'product-milk-1',
          expiresOn: new Date('2024-02-08'), // Expires in 6 days
          balance: 72,
        },
        {
          id: 'lot-dairy-3',
          lotCode: 'DAIRY003',
          productUuid: 'product-milk-1',
          expiresOn: new Date('2024-02-12'), // Expires in 10 days
          balance: 96,
        },
        {
          id: 'lot-dairy-4',
          lotCode: 'DAIRY004',
          productUuid: 'product-milk-1',
          expiresOn: new Date('2024-02-20'), // Expires in 18 days
          balance: 234,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-milk-1', 180);

      // Should consume first 3 lots completely and part of the 4th
      expect(result).toEqual([
        {
          lotId: 'lot-dairy-1',
          quantity: 48,
        },
        {
          lotId: 'lot-dairy-2',
          quantity: 72,
        },
        {
          lotId: 'lot-dairy-3',
          quantity: 60, // Only 60 from this lot (96 available)
        },
      ]);
    });

    it('should handle lots with realistic pharmaceutical expiration dates', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '500' }));
      
      // Pharmaceutical products with different expiration dates
      const mockLots = [
        {
          id: 'pharma-lot-1',
          lotCode: 'PH240115',
          productUuid: 'product-aspirin-100mg',
          expiresOn: new Date('2024-01-15'), // Already expired
          balance: 50,
        },
        {
          id: 'pharma-lot-2',
          lotCode: 'PH240315',
          productUuid: 'product-aspirin-100mg',
          expiresOn: new Date('2024-03-15'), // Expires in 2 months
          balance: 125,
        },
        {
          id: 'pharma-lot-3',
          lotCode: 'PH240715',
          productUuid: 'product-aspirin-100mg',
          expiresOn: new Date('2024-07-15'), // Expires in 6 months
          balance: 200,
        },
        {
          id: 'pharma-lot-4',
          lotCode: 'PH241215',
          productUuid: 'product-aspirin-100mg',
          expiresOn: new Date('2024-12-15'), // Expires in 1 year
          balance: 125,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-aspirin-100mg', 300);

      // Verify FEFO: expired first, then closest expiration dates
      expect(result).toEqual([
        {
          lotId: 'pharma-lot-1',
          quantity: 50,
        },
        {
          lotId: 'pharma-lot-2',
          quantity: 125,
        },
        {
          lotId: 'pharma-lot-3',
          quantity: 125, // Only 125 from this lot (200 available)
        },
      ]);
      
      // Verify we didn't touch the lot with longest expiry
      expect(result.some(allocation => allocation.lotId === 'pharma-lot-4')).toBe(false);
    });

    it('should throw error for invalid quantity', async () => {
      try {
        await allocateFEFO('product-uuid-1', 0);
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Requested quantity must be greater than zero.');
      }

      try {
        await allocateFEFO('product-uuid-1', -10);
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Requested quantity must be greater than zero.');
      }
    });

    it('should throw error for data integrity issues', async () => {
      // Mock getProductStock to return sufficient stock
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '100' }));
      
      // Mock getLotsWithBalance to return lots with insufficient actual balance
      const mockLots = [
        {
          id: 'lot-1',
          lotCode: 'LOT001',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-01-15'),
          balance: 20, // Insufficient compared to total stock
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      try {
        await allocateFEFO('product-uuid-1', 50);
        fail('Expected error to be thrown');
      } catch (error) {
        const err = error as Error;
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Stock allocation failed due to a discrepancy. Please try again.');
      }
    });

    it('should handle complete allocation from available lots', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '75' }));
      const mockLots = [
        {
          id: 'lot-1',
          lotCode: 'LOT001',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-01-15'),
          balance: 25,
        },
        {
          id: 'lot-2',
          lotCode: 'LOT002',
          productUuid: 'product-uuid-1',
          expiresOn: new Date('2024-02-20'),
          balance: 50,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-uuid-1', 75);

      expect(result).toEqual([
        {
          lotId: 'lot-1',
          quantity: 25,
        },
        {
          lotId: 'lot-2',
          quantity: 50,
        },
      ]);
    });

    it('should handle edge case with single unit requests from large lots', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '1000' }));
      const mockLots = [
        {
          id: 'warehouse-lot-1',
          lotCode: 'WH001',
          productUuid: 'product-bulk-item',
          expiresOn: new Date('2024-06-01'),
          balance: 1000,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-bulk-item', 1);

      expect(result).toEqual([
        {
          lotId: 'warehouse-lot-1',
          quantity: 1,
        },
      ]);
    });

    it('should handle exact quantity match across multiple lots', async () => {
      mockQueryBuilder.executeTakeFirst.and.returnValue(Promise.resolve({ totalStock: '100' }));
      const mockLots = [
        {
          id: 'exact-lot-1',  
          lotCode: 'EX001',
          productUuid: 'product-exact-match',
          expiresOn: new Date('2024-04-01'),
          balance: 30,
        },
        {
          id: 'exact-lot-2',
          lotCode: 'EX002', 
          productUuid: 'product-exact-match',
          expiresOn: new Date('2024-05-01'),
          balance: 70,
        },
      ];
      mockQueryBuilder.execute.and.returnValue(Promise.resolve(mockLots));

      const result = await allocateFEFO('product-exact-match', 100);

      expect(result).toEqual([
        {
          lotId: 'exact-lot-1',
          quantity: 30,
        },
        {
          lotId: 'exact-lot-2',
          quantity: 70,
        },
      ]);
    });
  });
});