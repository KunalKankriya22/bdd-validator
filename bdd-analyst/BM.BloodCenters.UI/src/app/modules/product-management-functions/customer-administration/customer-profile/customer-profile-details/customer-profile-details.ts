import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import { CustomerProfileListStateService } from '../services/customer-profile-list-state.service';
import { CustomerProfileDto } from '../models/customer-profile.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { RouteKey } from '@core/constants/route-keys';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { CustomerContractDetailsComponent } from '../../customer-contract-details/customer-contract-details.component';
import { CustomerPayeeDetailsComponent } from '../../customer-payee-details/customer-payee-details.component';
import { ConsigneeDetailsTabComponent } from '../../consignee-details/consignee-details-tab';
import { CustomerDataForConsignee } from '../../consignee-details/models/consignee.model';
import { CustomerContactDetailsComponent } from '../../customer-contact-details/customer-contact-details.component';
import { EditCustomerProfileDialog, EditCustomerProfileDialogData } from '../edit-customer-profile-dialog/edit-customer-profile-dialog';

@Component({
  selector: 'app-customer-profile-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    PageHeaderWithBreadcrumb,
    CustomerContractDetailsComponent,
    CustomerPayeeDetailsComponent,
    ConsigneeDetailsTabComponent,
    CustomerContactDetailsComponent
  ],
  templateUrl: './customer-profile-details.html',
  styleUrls: ['./customer-profile-details.scss']
})
export class CustomerProfileDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageHeaderService = inject(PageHeaderService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly apiService = inject(CustomerProfileApiService);
  private readonly dialog = inject(MatDialog);
  private readonly headerService = inject(HeaderService);
  private readonly listStateService = inject(CustomerProfileListStateService);
  private readonly destroy$ = new Subject<void>();

  customerId = signal<string>('');
  customerProfile = signal<CustomerProfileDto | null>(null);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  selectedTabIndex = signal<number>(0);
  activePayeeCount = signal<number>(0);
  activeConsigneeCount = signal<number>(0);
  activeContactCount = signal<number>(0);
  activeContractCount = signal<number>(0);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/' },
      { label: 'Manage Customer Details', link: ROUTE_REGISTRY[RouteKey.CustomerProfile].path }
    ],
    title: '',
    subtitle: '',
    showBackButton: true,
    onBackClick: () => this.navigateToList()
  };

  // Computed values
  isActive = computed(() => {
    const profile = this.customerProfile();
    if (!profile || !profile.termDate) return true;
    const termDate = moment(profile.termDate);
    return termDate.isAfter(moment());
  });

  statusClass = computed(() => this.isActive() ? 'status-active' : 'status-terminated');
  statusText = computed(() => this.isActive() ? 'Active' : 'Terminated');

  // Customer data for consignee "Same as customer" feature
  customerDataForConsignee = computed<CustomerDataForConsignee | null>(() => {
    const profile = this.customerProfile();
    if (!profile) return null;
    return {
      customerId: profile.customerId,
      name: profile.name,
      shortName: profile.shortName,
      intFlag: profile.intFlag || null,
      address1: profile.address1,
      address2: profile.address2 || null,
      address3: profile.address3 || null,
      city: profile.city,
      state: profile.state || null,
      zip: profile.zip,
      country: profile.country,
      phoneNo: profile.phoneNo || null,
      faxNo: profile.faxNo || null,
      intPhone: profile.intPhone || null,
      telexNo: profile.telexNo || null
    };
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const customerId = params.get('customerId');
        if (customerId) {
          this.customerId.set(customerId);
          this.loadCustomerProfile(customerId);
        } else {
          this.navigateToList();
        }
      });
    this.subscribeToChapterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToChapterChanges(): void {
    this.headerService.chapterChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dialog.closeAll();
        this.listStateService.clear();
        this.navigateToList();
      });
  }

  private showErrorAndAutoDismiss(message: string): void {
    this.snackbarService.showError(message);
    setTimeout(() => this.snackBar.dismiss(), 5000);
  }

  private loadCustomerProfile(customerId: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.apiService.getCustomerProfileById(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.customerProfile.set(profile);
          this.updatePageHeader(profile);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.hasError.set(true);
          this.errorMessage.set(error?.error?.message || 'Failed to load customer profile');
          this.showErrorAndAutoDismiss(this.errorMessage());
          this.isLoading.set(false);
        }
      });
  }

  onPayeeLinked(payeeId: string): void {
    const profile = this.customerProfile();
    if (profile) {
      this.customerProfile.set({ ...profile, payeeId });
    }
  }

  onConsigneeSaved(): void {
    // Count is updated via @Output from child component
  }

  private updatePageHeader(profile: CustomerProfileDto): void {
    this.headerConfig = {
      ...this.headerConfig,
      breadcrumbs: [
        { label: 'Home', link: '/' },
        { label: 'Manage Customer Details', link: ROUTE_REGISTRY[RouteKey.CustomerProfile].path },
        { label: profile.name, link: '' }
      ],
      title: profile.name
    };
  }

  navigateToList(): void {
    this.router.navigate([ROUTE_REGISTRY[RouteKey.CustomerProfile].path]);
  }

  onEdit(): void {
    const profile = this.customerProfile();
    if (!profile) return;

    const dialogData: EditCustomerProfileDialogData = {
      customerProfile: { ...profile }
    };

    const dialogRef = this.dialog.open(EditCustomerProfileDialog, {
      width: '800px',
      maxWidth: '95vw',
      height: 'calc(100vh - 64px)',
      position: { right: '0', top: '64px' },
      disableClose: false,
      data: dialogData,
      panelClass: 'right-side-dialog',
      backdropClass: 'right-side-dialog-backdrop'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: CustomerProfileDto | null) => {
        (document.activeElement as HTMLElement)?.blur();
        if (result) {
          this.customerProfile.set(result);
          this.updatePageHeader(result);
        }
      });
  }

  retryLoad(): void {
    const customerId = this.route.snapshot.paramMap.get('customerId');
    if (customerId) {
      this.loadCustomerProfile(customerId);
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const m = moment(dateString);
    return m.isValid() ? m.format('DD-MMM-YYYY').toUpperCase() : dateString;
  }

  formatPhoneNumber(phoneNo: string | null | undefined, ext: string | null | undefined): string {
    if (!phoneNo) return '-';
    return ext ? `${phoneNo} ext. ${ext}` : phoneNo;
  }

  formatYesNo(flag: string | null | undefined): string {
    if (!flag) return '-';
    return flag === 'Y' ? 'Yes' : 'No';
  }

  formatReturnAccepted(flag: string | null | undefined): string {
    if (!flag) return '-';
    if (flag === 'Y') return 'Yes';
    if (flag === 'N') return 'No';
    return 'Quarantine';
  }
}
