import { TestBed } from '@angular/core/testing';
import { TubeCheckinShipmentMockService } from './tube-checkin-shipment-mock.service';

describe('TubeCheckinShipmentMockService', () => {
  let service: TubeCheckinShipmentMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TubeCheckinShipmentMockService]
    });

    service = TestBed.inject(TubeCheckinShipmentMockService);
  });

  describe('Get All Sample Packs', () => {
    it('should return paginated results', (done) => {
      service.getAll(10, 0, {} as any).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.totalRecords).toBeDefined();
        done();
      });
    });

    it('should filter by status', (done) => {
      service.getAll(10, 0, { status: 'O' } as any).subscribe((result) => {
        result.data.forEach(box => expect(box.status).toBe('O'));
        done();
      });
    });

    it('should filter by boxId substring', (done) => {
      service.getAll(10, 0, { boxId: 'BOX001' } as any).subscribe((result) => {
        result.data.forEach(box => expect(box.boxId).toContain('BOX001'));
        done();
      });
    });

    it('should filter by extractType', (done) => {
      service.getAll(10, 0, { extractType: 'V' } as any).subscribe((result) => {
        result.data.forEach(box => expect(box.extractType).toBe('V'));
        done();
      });
    });

    it('should apply pagination with skip and take', (done) => {
      service.getAll(1, 0, {} as any).subscribe((result) => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBeGreaterThan(1);
        done();
      });
    });
  });

  describe('Get By ID', () => {
    it('should return box for existing ID', (done) => {
      service.getById('BOX001').subscribe((result) => {
        expect(result).toBeDefined();
        expect(result!.boxId).toBe('BOX001');
        done();
      });
    });

    it('should return null for non-existent ID', (done) => {
      service.getById('NONEXISTENT').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('Get Box Header', () => {
    it('should return box header (alias for getById)', (done) => {
      service.getBoxHeader('BOX001', 'CH001').subscribe((result) => {
        expect(result).toBeDefined();
        expect(result!.boxId).toBe('BOX001');
        done();
      });
    });
  });

  describe('Create Sample Pack', () => {
    it('should create a new box with valid data', (done) => {
      const request = {
        boxId: 'NEWBOX1',
        collDate: new Date('2024-02-01'),
        extractType: 'V',
        donorType: 'I',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should auto-generate boxId when empty', (done) => {
      const request = {
        boxId: '',
        collDate: new Date('2024-02-01'),
        extractType: 'B',
        donorType: 'R',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data[0].boxId).toContain('BOX');
        done();
      });
    });

    it('should auto-generate boxId when not provided', (done) => {
      const request = {
        collDate: new Date('2024-02-01'),
        extractType: 'N',
        donorType: 'I',
        destinationCode: 'LAB02'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should reject missing required fields', (done) => {
      service.create({ boxId: 'X' } as any).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('0080');
        done();
      });
    });

    it('should reject invalid extract type', (done) => {
      const request = {
        boxId: 'NEWBOX2',
        collDate: new Date(),
        extractType: 'Z',
        donorType: 'I',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('0253');
        done();
      });
    });

    it('should reject invalid donor type', (done) => {
      const request = {
        boxId: 'NEWBOX2B',
        collDate: new Date(),
        extractType: 'V',
        donorType: 'X',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('0252');
        done();
      });
    });

    it('should reject NAT extract type with Others donor type', (done) => {
      const request = {
        boxId: 'NEWBOX3',
        collDate: new Date(),
        extractType: 'N',
        donorType: 'O',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('0252');
        done();
      });
    });

    it('should reject duplicate box ID', (done) => {
      const request = {
        boxId: 'BOX001',
        collDate: new Date(),
        extractType: 'V',
        donorType: 'I',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('0254');
        done();
      });
    });

    it('should reject invalid destination lab', (done) => {
      const request = {
        boxId: 'NEWBOX4',
        collDate: new Date(),
        extractType: 'V',
        donorType: 'I',
        destinationCode: 'INVALID_LAB'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('1811');
        done();
      });
    });

    it('should set correct type descriptions for each extract type', (done) => {
      const request = {
        boxId: 'NEWBOX_N',
        collDate: new Date(),
        extractType: 'N',
        donorType: 'I',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.data[0].extractTypeDescription).toBe('NAT');
        expect(result.data[0].donorTypeDescription).toBe('First Time');
        done();
      });
    });

    it('should set Others donor type description', (done) => {
      const request = {
        boxId: 'NEWBOX_O',
        collDate: new Date(),
        extractType: 'V',
        donorType: 'O',
        destinationCode: 'LAB01'
      } as any;

      service.create(request).subscribe((result) => {
        expect(result.data[0].donorTypeDescription).toBe('Others');
        done();
      });
    });
  });

  describe('Create Box Alias', () => {
    it('should delegate to create method', (done) => {
      const request = {
        boxId: 'ALIASBOX',
        collDate: new Date(),
        extractType: 'B',
        donorType: 'R',
        destinationCode: 'LAB01'
      } as any;

      service.createBox(request).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });
    });
  });

  describe('Update Sample Pack', () => {
    it('should update an existing open box', (done) => {
      const request = {
        collDate: new Date(),
        extractType: 'B',
        donorType: 'R',
        destinationCode: 'LAB02'
      } as any;

      service.update('BOX001', request).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data[0].extractTypeDescription).toBe('Both');
        expect(result.data[0].donorTypeDescription).toBe('Repeat');
        done();
      });
    });

    it('should reject update for non-existent box', (done) => {
      service.update('NONEXISTENT', {} as any).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
        done();
      });
    });

    it('should reject update for closed box', (done) => {
      service.close('BOX001').subscribe(() => {
        service.update('BOX001', {} as any).subscribe((result) => {
          expect(result.success).toBe(false);
          expect(result.message).toContain('closed');
          done();
        });
      });
    });

    it('should set NAT extract type description on update', (done) => {
      const request = {
        collDate: new Date(),
        extractType: 'N',
        donorType: 'I',
        destinationCode: 'LAB01'
      } as any;

      service.update('BOX002', request).subscribe((result) => {
        expect(result.data[0].extractTypeDescription).toBe('NAT');
        expect(result.data[0].donorTypeDescription).toBe('First Time');
        done();
      });
    });

    it('should set Others donor type description on update', (done) => {
      const request = {
        collDate: new Date(),
        extractType: 'V',
        donorType: 'O',
        destinationCode: 'LAB01'
      } as any;

      service.update('BOX003', request).subscribe((result) => {
        expect(result.data[0].donorTypeDescription).toBe('Others');
        done();
      });
    });
  });

  describe('Close Sample Pack', () => {
    it('should close an open box and set closed status', (done) => {
      service.close('BOX001').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data[0].status).toBe('C');
        expect(result.data[0].statusDescription).toBe('Closed');
        expect(result.data[0].boxClosedDate).toBeDefined();
        expect(result.data[0].boxClosedUser).toBe('MOCKUSER');
        done();
      });
    });

    it('should reject closing a non-existent box', (done) => {
      service.close('NONEXISTENT').subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
        done();
      });
    });

    it('should reject closing an already closed box', (done) => {
      service.close('BOX002').subscribe(() => {
        service.close('BOX002').subscribe((result) => {
          expect(result.success).toBe(false);
          expect(result.message).toContain('already closed');
          done();
        });
      });
    });
  });

  describe('Close Box Alias', () => {
    it('should delegate to close method', (done) => {
      service.closeBox({ boxId: 'BOX003', printPackList: true }).subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });
    });
  });

  describe('Tube Management', () => {
    it('should return tubes for a box', (done) => {
      service.getTubes('BOX001').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data.length).toBe(5);
        done();
      });
    });

    it('should return empty tubes for box with no tubes', (done) => {
      service.getTubes('BOX003').subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data.length).toBe(0);
        done();
      });
    });

    it('should return empty for unknown box', (done) => {
      service.getTubes('UNKNOWN').subscribe((result) => {
        expect(result.data.length).toBe(0);
        done();
      });
    });

    it('should add a tube to an open box', (done) => {
      service.addTube('BOX001', { unitId: '99999999999999' } as any).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(result.data[0].checkDigit).toBeDefined();
        done();
      });
    });

    it('should reject adding to non-existent box', (done) => {
      service.addTube('NONEXISTENT', { unitId: '99999' } as any).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
        done();
      });
    });

    it('should reject adding to a closed box', (done) => {
      service.close('BOX002').subscribe(() => {
        service.addTube('BOX002', { unitId: '99999' } as any).subscribe((result) => {
          expect(result.success).toBe(false);
          expect(result.message).toContain('closed');
          done();
        });
      });
    });

    it('should reject adding duplicate unit ID', (done) => {
      service.addTube('BOX001', { unitId: '12345678901234' } as any).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('0150');
        done();
      });
    });

    it('should set default tube flags when not provided', (done) => {
      service.addTube('BOX003', { unitId: '11111111111111' } as any).subscribe((result) => {
        expect(result.data[0].redTubeFlag).toBe('N');
        expect(result.data[0].purpleTubeFlag).toBe('N');
        expect(result.data[0].purpleTube2Flag).toBe('N');
        done();
      });
    });

    it('should set provided tube flags', (done) => {
      service.addTube('BOX003', {
        unitId: '22222222222222',
        redTubeFlag: 'Y',
        purpleTubeFlag: 'Y',
        purpleTube2Flag: 'N'
      } as any).subscribe((result) => {
        expect(result.data[0].redTubeFlag).toBe('Y');
        expect(result.data[0].purpleTubeFlag).toBe('Y');
        done();
      });
    });

    it('should remove a tube from an open box', (done) => {
      service.removeTube('BOX001', '12345678901234').subscribe((result) => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should reject removing from non-existent box', (done) => {
      service.removeTube('NONEXISTENT', '12345').subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
        done();
      });
    });

    it('should reject removing from closed box', (done) => {
      service.close('BOX002').subscribe(() => {
        service.removeTube('BOX002', '98765432109876').subscribe((result) => {
          expect(result.success).toBe(false);
          expect(result.message).toContain('closed');
          done();
        });
      });
    });

    it('should reject removing non-existent tube', (done) => {
      service.removeTube('BOX001', 'NONEXISTENT').subscribe((result) => {
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(404);
        done();
      });
    });
  });

  describe('Get Box Units', () => {
    it('should return tubes array via getBoxUnits alias', (done) => {
      service.getBoxUnits('BOX001', 'CH001').subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(5);
        done();
      });
    });
  });

  describe('Lookups', () => {
    it('should return open boxes as box IDs', (done) => {
      service.getOpenBoxes('CH001').subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        result.forEach(id => expect(typeof id).toBe('string'));
        done();
      });
    });

    it('should return open boxes with full details', (done) => {
      service.getOpenBoxesDetailed('CH001').subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        result.forEach(box => expect(box.status).toBe('O'));
        done();
      });
    });

    it('should return destination labs', (done) => {
      service.getDestinationLabs('CH001').subscribe((result) => {
        expect(result.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return plate capacity', (done) => {
      service.getPlateCapacity().subscribe((result) => {
        expect(result).toBe(88);
        done();
      });
    });
  });

  describe('View Units In Box', () => {
    it('should return tubes with unit and tube counts', (done) => {
      service.viewUnitsInBox('BOX001', 'CH001').subscribe((result) => {
        expect(result.tubes.length).toBeGreaterThan(0);
        expect(result.unitCount).toBeGreaterThan(0);
        expect(result.tubeCount).toBe(result.tubes.length);
        done();
      });
    });

    it('should return zero counts for empty box', (done) => {
      service.viewUnitsInBox('BOX003', 'CH001').subscribe((result) => {
        expect(result.tubes.length).toBe(0);
        expect(result.unitCount).toBe(0);
        expect(result.tubeCount).toBe(0);
        done();
      });
    });
  });
});
