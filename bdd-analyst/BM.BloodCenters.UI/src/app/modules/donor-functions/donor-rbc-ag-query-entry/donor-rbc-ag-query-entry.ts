import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

@Component({
  selector: 'app-donor-rbc-ag-query-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
  ],
  templateUrl: './donor-rbc-ag-query-entry.html',
  styleUrl: './donor-rbc-ag-query-entry.scss',
})
export class DonorRbcAgQueryEntryComponent implements OnInit, OnDestroy {
  // Dependencies
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // Page header configuration
  protected readonly headerConfig = signal<PageHeaderConfig>({
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Donor RBC Ag Query', link: null }
    ],
    title: 'Donor RBC Ag Query',
    subtitle: 'Enter Donor ID to view RBC antigen query results'
  });

  // Form
  protected readonly donorIdForm = new FormGroup({
    donorId: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/)]),
  });

  ngOnInit(): void {
    // Focus on donor ID input when component loads
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onSubmit(): void {
    if (this.donorIdForm.invalid) {
      this.showErrorMessage('Please enter a valid Donor ID');
      return;
    }

    const donorId = this.donorIdForm.value.donorId?.trim();
    if (!donorId) {
      this.showErrorMessage('Donor ID is required');
      return;
    }

    // Navigate to donor-rbc-ag-query with the donor ID
    const path = ROUTE_REGISTRY[RouteKey.DonorRbcAgQuery].path.replace(':donorId', donorId);
    this.router.navigate([path]);
  }

  protected onCancel(): void {
    this.router.navigate(['/home']);
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
