import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { ResourceAvailabilityRulesService } from '../services/resource-availability-rules.service';
import {
  ResourceAvailabilitySummaryModel,
  ResourceAvailabilityRuleModel
} from '../models/resource-availability-rules.model';
import { HeaderService } from '@shared/services/header.service';

@Component({
  selector: 'app-view-resource-availability',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule
  ],
  templateUrl: './view-resource-availability.html',
  styleUrls: ['./view-resource-availability.scss']
})
export class ViewResourceAvailability implements OnInit, OnDestroy, AfterViewInit {
  @Input() selectedRow: ResourceAvailabilityRuleModel | null = null; // The row data clicked from table
  @Output() closePanel = new EventEmitter<void>();

  panelTitle = 'View Active Resources';
  weekDayName = '';
  dateDisplay = '';

  dataSource = new MatTableDataSource<ResourceAvailabilitySummaryModel>([]);
  displayedColumns = ['resource', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Dynamic column headers
  columnHeaders: { [key: string]: string } = {
    resource: 'Resource',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  @ViewChild(MatSort) sort!: MatSort;

  private chapterId = '';
  private destroy$ = new Subject<void>();

  constructor(
    private resourceAvailabilityService: ResourceAvailabilityRulesService,
    private headerService: HeaderService
  ) {
    this.chapterId = this.headerService.chapterId();
  }

  ngOnInit(): void {
    this.setHeaderDisplay();
    this.loadWeekDayHeaders();
    this.loadResourceAvailabilitySummary();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    // Custom sort accessor for resource column
    this.dataSource.sortingDataAccessor = (item, property) => {
      if (property === 'resource') {
        return item.resourceCode || '';
      }
      return (item as any)[property];
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ---------------- DATA LOADING ---------------- */

  private setHeaderDisplay(): void {
    if (this.selectedRow) {
      // Get day of week from the row
      const weekDay = this.selectedRow.weekDay || '';
      this.weekDayName = this.formatFullWeekDay(weekDay);

      // Get availability
      const availability = this.selectedRow.maxAvailable !== null && this.selectedRow.maxAvailable !== undefined
        ? this.selectedRow.maxAvailable
        : '';

      // Get effective date
      const effectiveDateValue = this.selectedRow.effectiveDate || this.selectedRow.effDate;
      const effectiveDate = effectiveDateValue
        ? moment(effectiveDateValue).format('DD-MMM-YYYY').toUpperCase()
        : '';

      // Format: MONDAY - 5 | 19-JAN-2011
      this.dateDisplay = `${this.weekDayName} - ${availability} | ${effectiveDate}`;
    }
  }

  private formatFullWeekDay(code: string): string {
    const dayMap: Record<string, string> = {
      'MON': 'MONDAY',
      'TUE': 'TUESDAY',
      'WED': 'WEDNESDAY',
      'THU': 'THURSDAY',
      'FRI': 'FRIDAY',
      'SAT': 'SATURDAY',
      'SUN': 'SUNDAY'
    };
    return dayMap[code?.toUpperCase()] || code?.toUpperCase() || '';
  }

  private loadWeekDayHeaders(): void {
    this.resourceAvailabilityService
      .getWeekDayObjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (weekDays) => {
          // Map week day objects to column headers
          weekDays.forEach(day => {
            const code = (day.weekDayCode || day.code || '').toLowerCase();
            const name = day.weekDayName || day.description || code;

            if (code === 'mon') this.columnHeaders['monday'] = name;
            else if (code === 'tue') this.columnHeaders['tuesday'] = name;
            else if (code === 'wed') this.columnHeaders['wednesday'] = name;
            else if (code === 'thu') this.columnHeaders['thursday'] = name;
            else if (code === 'fri') this.columnHeaders['friday'] = name;
            else if (code === 'sat') this.columnHeaders['saturday'] = name;
            else if (code === 'sun') this.columnHeaders['sunday'] = name;
          });
        },
        error: () => {
          // Keep default headers on error
        }
      });
  }

  private loadResourceAvailabilitySummary(): void {
    this.resourceAvailabilityService
      .getResourceAvailabilitySummary(this.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const sortedData = data.sort((a, b) => (a.sortSeq || 0) - (b.sortSeq || 0));
          this.dataSource.data = sortedData;
        },
        error: () => {
          // Error handling is managed globally via Auth Interceptor
        }
      });
  }

  /* ---------------- HELPERS ---------------- */

  getValue(value: number | null | undefined): string {
    return value !== null && value !== undefined ? value.toString() : '-';
  }

  onCancel(): void {
    this.closePanel.emit();
  }
}
