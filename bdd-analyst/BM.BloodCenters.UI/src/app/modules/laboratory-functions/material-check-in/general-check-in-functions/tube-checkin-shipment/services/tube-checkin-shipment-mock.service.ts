import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import {
  SamplePackDto,
  SamplePackQueryDto,
  SamplePackTubeDto,
  CreateSamplePackRequestDto,
  UpdateSamplePackRequestDto,
  AddTubeRequestDto,
  ReturnResult,
  DestinationLab,
} from '../models/tube-checkin-shipment.model';

/**
 * Mock service for testing UI without backend
 * Replace the real service with this in the component providers
 */
@Injectable({
  providedIn: 'root',
})
export class TubeCheckinShipmentMockService {
  private mockBoxes: SamplePackDto[] = [
    {
      boxId: 'BOX001',
      collDate: new Date('2024-01-15'),
      extractType: 'B',
      extractTypeDescription: 'Both',
      donorType: 'R',
      donorTypeDescription: 'Repeat',
      destinationCode: 'LAB01',
      destinationName: 'Central Testing Laboratory',
      status: 'O',
      statusDescription: 'Open',
      chapterId: 'CH001',
      boxClosedDate: null,
      boxClosedUser: null,
      insertDate: new Date('2024-01-15T08:00:00'),
      insertUser: 'USER001',
      tubeCount: 5,
    },
    {
      boxId: 'BOX002',
      collDate: new Date('2024-01-16'),
      extractType: 'V',
      extractTypeDescription: 'Viral Marker',
      donorType: 'I',
      donorTypeDescription: 'First Time',
      destinationCode: 'LAB02',
      destinationName: 'Regional Lab - East',
      status: 'O',
      statusDescription: 'Open',
      chapterId: 'CH001',
      boxClosedDate: null,
      boxClosedUser: null,
      insertDate: new Date('2024-01-16T09:30:00'),
      insertUser: 'USER002',
      tubeCount: 12,
    },
    {
      boxId: 'BOX003',
      collDate: new Date('2024-01-17'),
      extractType: 'N',
      extractTypeDescription: 'NAT',
      donorType: 'R', // Changed from 'O' to 'R' - NAT only allows I or R
      donorTypeDescription: 'Repeat',
      destinationCode: 'LAB03',
      destinationName: 'Specialty Testing Facility',
      status: 'O',
      statusDescription: 'Open',
      chapterId: 'CH001',
      boxClosedDate: null,
      boxClosedUser: null,
      insertDate: new Date('2024-01-17T10:15:00'),
      insertUser: 'USER001',
      tubeCount: 8,
    },
  ];

  private mockTubes: { [boxId: string]: SamplePackTubeDto[] } = {
    BOX001: [
      {
        boxId: 'BOX001',
        unitId: '12345678901234',
        redTubeFlag: 'Y',
        purpleTubeFlag: 'Y',
        purpleTube2Flag: 'N',
        checkDigit: '3',
        insertDate: new Date('2024-01-15T10:00:00'),
        insertUser: 'USER001',
      },
      {
        boxId: 'BOX001',
        unitId: '12345678901235',
        redTubeFlag: 'Y',
        purpleTubeFlag: 'Y',
        purpleTube2Flag: 'N',
        checkDigit: '1',
        insertDate: new Date('2024-01-15T10:05:00'),
        insertUser: 'USER001',
      },
      {
        boxId: 'BOX001',
        unitId: '12345678901236',
        redTubeFlag: 'Y',
        purpleTubeFlag: 'Y',
        purpleTube2Flag: 'N',
        checkDigit: '8',
        insertDate: new Date('2024-01-15T10:10:00'),
        insertUser: 'USER001',
      },
      {
        boxId: 'BOX001',
        unitId: '12345678901237',
        redTubeFlag: 'Y',
        purpleTubeFlag: 'Y',
        purpleTube2Flag: 'N',
        checkDigit: '6',
        insertDate: new Date('2024-01-15T10:15:00'),
        insertUser: 'USER001',
      },
      {
        boxId: 'BOX001',
        unitId: '12345678901238',
        redTubeFlag: 'Y',
        purpleTubeFlag: 'Y',
        purpleTube2Flag: 'N',
        checkDigit: '4',
        insertDate: new Date('2024-01-15T10:20:00'),
        insertUser: 'USER001',
      },
    ],
    BOX002: [
      {
        boxId: 'BOX002',
        unitId: '98765432109876',
        redTubeFlag: 'Y',
        purpleTubeFlag: 'Y',
        purpleTube2Flag: 'N',
        checkDigit: '2',
        insertDate: new Date('2024-01-16T11:00:00'),
        insertUser: 'USER002',
      },
    ],
    BOX003: [],
  };

  private mockLabs: DestinationLab[] = [
    {
      testingLabId: 'LAB01',
      testingLabName: 'Central Testing Laboratory',
      chapterId: 'CH001',
      effDate: new Date('2020-01-01'),
      termDate: null,
    },
    {
      testingLabId: 'LAB02',
      testingLabName: 'Regional Lab - East',
      chapterId: 'CH001',
      effDate: new Date('2020-01-01'),
      termDate: null,
    },
    {
      testingLabId: 'LAB03',
      testingLabName: 'Specialty Testing Facility',
      chapterId: 'CH001',
      effDate: new Date('2020-01-01'),
      termDate: null,
    },
    {
      testingLabId: 'LAB04',
      testingLabName: 'Advanced Diagnostics Center',
      chapterId: 'CH001',
      effDate: new Date('2020-01-01'),
      termDate: null,
    },
  ];

  private mockPlateCapacity = 88;

  /**
   * Get all sample packs with optional filtering
   */
  getAll(take: number, skip: number, query: SamplePackQueryDto): Observable<ReturnResult<SamplePackDto>> {
    let filtered = [...this.mockBoxes];

    // Apply filters
    if (query.status) {
      filtered = filtered.filter(b => b.status === query.status);
    }
    if (query.boxId) {
      filtered = filtered.filter(b => b.boxId.includes(query.boxId!));
    }
    if (query.extractType) {
      filtered = filtered.filter(b => b.extractType === query.extractType);
    }

    const paged = filtered.slice(skip, skip + take);

    return of({
      success: true,
      message: 'Success',
      statusCode: 200,
      data: paged,
      totalRecords: filtered.length,
    }).pipe(delay(300)); // Simulate network delay
  }

  /**
   * Get sample pack by box ID
   */
  getById(boxId: string): Observable<SamplePackDto | null> {
    const box = this.mockBoxes.find(b => b.boxId === boxId);
    return of(box || null).pipe(delay(200));
  }

  /**
   * Get box header (alias for getById)
   */
  getBoxHeader(boxId: string, chapterId: string): Observable<SamplePackDto | null> {
    return this.getById(boxId);
  }

  /**
   * Create new sample pack
   */
  create(request: CreateSamplePackRequestDto): Observable<ReturnResult<any>> {
    // Validate required fields (boxId can be empty for auto-generation)
    if (!request.collDate || !request.extractType || !request.donorType || !request.destinationCode) {
      return of({
        success: false,
        message: 'Field must be entered',
        statusCode: 400,
        errorCode: '0080',
      }).pipe(delay(200));
    }

    // Validate extract type
    if (!['V', 'N', 'B'].includes(request.extractType)) {
      return of({
        success: false,
        message: 'Extract type must be V (Viral), N (NAT), or B (Both)',
        statusCode: 400,
        errorCode: '0253',
      }).pipe(delay(200));
    }

    // Validate donor type
    if (!['I', 'R', 'O'].includes(request.donorType)) {
      return of({
        success: false,
        message: 'Donor type must be I (First Time), R (Repeat), or O (Others)',
        statusCode: 400,
        errorCode: '0252',
      }).pipe(delay(200));
    }

    // Validate donor type based on extract type (FMB requirement)
    // If extract type is N (NAT), only allow I (First Time) or R (Repeat)
    if (request.extractType === 'N' && request.donorType === 'O') {
      return of({
        success: false,
        message: 'NAT extract type only allows First Time (I) or Repeat (R) donor types',
        statusCode: 400,
        errorCode: '0252',
      }).pipe(delay(200));
    }

    // Generate box ID if not provided
    let boxId = request.boxId?.trim();
    if (!boxId) {
      // Auto-generate box ID: BOX + timestamp
      const timestamp = Date.now().toString().slice(-6);
      boxId = `BOX${timestamp}`;
    }

    // Check if box already exists
    if (this.mockBoxes.find(b => b.boxId === boxId)) {
      return of({
        success: false,
        message: 'Box ID already exists',
        statusCode: 400,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    // Check if lab is valid
    if (!this.mockLabs.find(l => l.testingLabId === request.destinationCode)) {
      return of({
        success: false,
        message: 'Invalid or inactive testing laboratory',
        statusCode: 400,
        errorCode: '1811',
      }).pipe(delay(200));
    }

    // Create new box
    const newBox: SamplePackDto = {
      boxId,
      collDate: request.collDate,
      extractType: request.extractType,
      extractTypeDescription: request.extractType === 'V' ? 'Viral Marker' : request.extractType === 'N' ? 'NAT' : 'Both',
      donorType: request.donorType,
      donorTypeDescription: request.donorType === 'I' ? 'First Time' : request.donorType === 'R' ? 'Repeat' : 'Others',
      destinationCode: request.destinationCode,
      destinationName: this.mockLabs.find(l => l.testingLabId === request.destinationCode)?.testingLabName || null,
      status: 'O',
      statusDescription: 'Open',
      chapterId: 'CH001',
      boxClosedDate: null,
      boxClosedUser: null,
      insertDate: new Date(),
      insertUser: 'MOCKUSER',
      tubeCount: 0,
    };

    this.mockBoxes.push(newBox);
    this.mockTubes[newBox.boxId] = [];

    return of({
      success: true,
      message: 'Box created successfully',
      statusCode: 200,
      data: [newBox],
    }).pipe(delay(300));
  }

  /**
   * Create box (alias for create for backward compatibility)
   */
  createBox(request: CreateSamplePackRequestDto): Observable<ReturnResult<any>> {
    return this.create(request);
  }

  /**
   * Update sample pack header
   */
  update(boxId: string, request: UpdateSamplePackRequestDto): Observable<ReturnResult<any>> {
    const box = this.mockBoxes.find(b => b.boxId === boxId);

    if (!box) {
      return of({
        success: false,
        message: 'Box not found',
        statusCode: 404,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    if (box.status === 'C') {
      return of({
        success: false,
        message: 'Box is closed and cannot be modified',
        statusCode: 400,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    // Update box properties
    box.collDate = request.collDate;
    box.extractType = request.extractType;
    box.extractTypeDescription = request.extractType === 'V' ? 'Viral Marker' : request.extractType === 'N' ? 'NAT' : 'Both';
    box.donorType = request.donorType;
    box.donorTypeDescription = request.donorType === 'I' ? 'First Time' : request.donorType === 'R' ? 'Repeat' : 'Others';
    box.destinationCode = request.destinationCode;
    box.destinationName = this.mockLabs.find(l => l.testingLabId === request.destinationCode)?.testingLabName || null;

    return of({
      success: true,
      message: 'Box updated successfully',
      statusCode: 200,
      data: [box],
    }).pipe(delay(300));
  }

  /**
   * Close sample pack for shipment
   */
  close(boxId: string): Observable<ReturnResult<any>> {
    const box = this.mockBoxes.find(b => b.boxId === boxId);

    if (!box) {
      return of({
        success: false,
        message: 'Box not found',
        statusCode: 404,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    if (box.status === 'C') {
      return of({
        success: false,
        message: 'Box is already closed',
        statusCode: 400,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    box.status = 'C';
    box.statusDescription = 'Closed';
    box.boxClosedDate = new Date();
    box.boxClosedUser = 'MOCKUSER';

    return of({
      success: true,
      message: 'Box closed successfully',
      statusCode: 200,
      data: [box],
    }).pipe(delay(300));
  }

  /**
   * Close box (alias for close)
   */
  closeBox(request: { boxId: string; printPackList: boolean }): Observable<ReturnResult<any>> {
    return this.close(request.boxId);
  }

  /**
   * Get all tubes in a sample pack
   */
  getTubes(boxId: string): Observable<ReturnResult<SamplePackTubeDto>> {
    const tubes = this.mockTubes[boxId] || [];

    return of({
      success: true,
      message: 'Success',
      statusCode: 200,
      data: tubes,
      totalRecords: tubes.length,
    }).pipe(delay(200));
  }

  /**
   * Get box units/tubes (alias for getTubes)
   */
  getBoxUnits(boxId: string, chapterId: string): Observable<SamplePackTubeDto[]> {
    return this.getTubes(boxId).pipe(
      map(result => result.data || [])
    );
  }

  /**
   * Add tube to sample pack
   */
  addTube(boxId: string, request: AddTubeRequestDto): Observable<ReturnResult<any>> {
    const box = this.mockBoxes.find(b => b.boxId === boxId);

    if (!box) {
      return of({
        success: false,
        message: 'Box not found',
        statusCode: 404,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    if (box.status === 'C') {
      return of({
        success: false,
        message: 'Box is closed and cannot be modified',
        statusCode: 400,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    const tubes = this.mockTubes[boxId] || [];

    // Check plate capacity
    if (tubes.length >= this.mockPlateCapacity) {
      return of({
        success: false,
        message: `Plate capacity of ${this.mockPlateCapacity} has been reached`,
        statusCode: 400,
        errorCode: '0020',
      }).pipe(delay(200));
    }

    // Check for duplicate
    if (tubes.find(t => t.unitId === request.unitId)) {
      return of({
        success: false,
        message: 'Unit ID already exists in this box',
        statusCode: 400,
        errorCode: '0150',
      }).pipe(delay(200));
    }

    // Calculate check digit (simple mod-10)
    const digits = request.unitId.replace(/\D/g, '');
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (alternate) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      alternate = !alternate;
    }
    const checkDigit = ((10 - (sum % 10)) % 10).toString();

    // Add new tube
    const newTube: SamplePackTubeDto = {
      boxId,
      unitId: request.unitId,
      redTubeFlag: request.redTubeFlag || 'N',
      purpleTubeFlag: request.purpleTubeFlag || 'N',
      purpleTube2Flag: request.purpleTube2Flag || 'N',
      checkDigit,
      insertDate: new Date(),
      insertUser: 'MOCKUSER',
    };

    tubes.push(newTube);
    this.mockTubes[boxId] = tubes;
    box.tubeCount = tubes.length;

    return of({
      success: true,
      message: 'Tube added successfully',
      statusCode: 200,
      data: [newTube],
    }).pipe(delay(300));
  }

  /**
   * Remove tube from sample pack
   */
  removeTube(boxId: string, unitId: string): Observable<ReturnResult<any>> {
    const box = this.mockBoxes.find(b => b.boxId === boxId);

    if (!box) {
      return of({
        success: false,
        message: 'Box not found',
        statusCode: 404,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    if (box.status === 'C') {
      return of({
        success: false,
        message: 'Box is closed and cannot be modified',
        statusCode: 400,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    const tubes = this.mockTubes[boxId] || [];
    const index = tubes.findIndex(t => t.unitId === unitId);

    if (index === -1) {
      return of({
        success: false,
        message: 'Tube not found in box',
        statusCode: 404,
        errorCode: '0254',
      }).pipe(delay(200));
    }

    tubes.splice(index, 1);
    this.mockTubes[boxId] = tubes;
    box.tubeCount = tubes.length;

    return of({
      success: true,
      message: 'Tube removed successfully',
      statusCode: 200,
    }).pipe(delay(300));
  }

  /**
   * Get open boxes with full details for dropdown
   */
  getOpenBoxesDetailed(chapterId: string): Observable<SamplePackDto[]> {
    const openBoxes = this.mockBoxes.filter(b => b.status === 'O');
    return of(openBoxes).pipe(delay(200));
  }

  /**
   * Get open boxes (backward compatibility)
   */
  getOpenBoxes(chapterId: string): Observable<string[]> {
    return this.getOpenBoxesDetailed(chapterId).pipe(
      map(boxes => boxes.map(box => box.boxId))
    );
  }

  /**
   * Get active testing laboratories for dropdown
   */
  getDestinationLabs(chapterId: string): Observable<DestinationLab[]> {
    return of(this.mockLabs).pipe(delay(200));
  }

  /**
   * Get plate capacity from master codes
   */
  getPlateCapacity(): Observable<number> {
    return of(this.mockPlateCapacity).pipe(delay(100));
  }

  /**
   * View units in box (for dialog)
   */
  viewUnitsInBox(boxId: string, chapterId: string): Observable<{ tubes: SamplePackTubeDto[]; unitCount: number; tubeCount: number }> {
    return this.getTubes(boxId).pipe(
      map(result => {
        const tubes = result.data || [];
        const unitCount = new Set(tubes.map(t => t.unitId)).size;
        return {
          tubes,
          unitCount,
          tubeCount: tubes.length
        };
      })
    );
  }
}
