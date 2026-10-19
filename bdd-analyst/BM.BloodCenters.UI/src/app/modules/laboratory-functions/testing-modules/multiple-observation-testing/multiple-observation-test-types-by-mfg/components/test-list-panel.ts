import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  output,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SearchBar, SearchBarConfig } from '@shared/components/search-bar/search-bar';
import { TestTypesApiService } from '../services/test-types-api.service';
import { TestLookupDto } from '../models/test-types.model';

@Component({
  selector: 'app-test-list-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    SearchBar
  ],
  templateUrl: './test-list-panel.html',
  styleUrl: './test-list-panel.scss'
})
export class TestListPanelComponent implements OnInit, OnDestroy {
  private readonly testTypesApiService = inject(TestTypesApiService);
  private readonly destroy$ = new Subject<void>();

  readonly selectedTestId = input<string | null>(null);
  readonly testSelected = output<TestLookupDto>();

  searchConfig: SearchBarConfig = {
    placeholder: 'Search by test ID or description',
    minLength: 1,
    ariaLabel: 'Search tests',
    debounceTime: 300,
    searchOnEnterOnly: false,
    alwaysShowTooltip: true
  };

  protected readonly allTests = signal<TestLookupDto[]>([]);
  protected readonly filteredTests = signal<TestLookupDto[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  protected readonly hasTests = computed(() => this.filteredTests().length > 0);
  protected readonly isEmpty = computed(() =>
    !this.loading() && this.filteredTests().length === 0 && !this.error()
  );

  ngOnInit(): void {
    this.loadTests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTests(): void {
    this.loading.set(true);
    this.error.set(null);

    this.testTypesApiService
      .getTestsLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tests) => {
          this.allTests.set(tests);
          this.filteredTests.set(tests);
          this.loading.set(false);

          if (tests.length > 0 && !this.selectedTestId()) {
            this.testSelected.emit(tests[0]);
          }
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load tests');
          this.loading.set(false);
        }
      });
  }

  onSearch(searchText: string): void {
    if (!searchText) {
      this.filteredTests.set(this.allTests());
      return;
    }

    const term = searchText.toLowerCase();
    const filtered = this.allTests().filter(test =>
      test.testId.toLowerCase().includes(term) ||
      test.testDesc.toLowerCase().includes(term)
    );
    this.filteredTests.set(filtered);
  }

  onTestSelected(test: TestLookupDto): void {
    this.testSelected.emit(test);
  }

  isSelected(test: TestLookupDto): boolean {
    return this.selectedTestId() === test.testId;
  }

  retry(): void {
    this.loadTests();
  }
}
