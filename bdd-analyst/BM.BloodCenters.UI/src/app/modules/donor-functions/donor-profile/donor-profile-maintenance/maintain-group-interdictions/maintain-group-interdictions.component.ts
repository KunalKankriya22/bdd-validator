import { Component, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DonationsTabComponent } from './components/donations-tab/donations-tab.component';
import { DonorsTabComponent } from './components/donors-tab/donors-tab.component';

@Component({
  selector: 'app-maintain-group-interdictions',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    PageHeaderWithBreadcrumb,
    DonationsTabComponent,
    DonorsTabComponent
  ],
  templateUrl: './maintain-group-interdictions.component.html',
  styleUrls: ['./maintain-group-interdictions.component.scss']
})
export class MaintainGroupInterdictionsComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly pageHeaderService = inject(PageHeaderService);

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  selectedTabIndex = signal<number>(0);
  currentTab = computed(() => this.selectedTabIndex() === 0 ? 'Donors' : 'Donations');

  constructor() {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title || 'Maintain Group Interdictions', link: null }
          ],
          title: pageData.title || 'Maintain Group Interdictions',
          subtitle: pageData.subtitle || 'Place or remove interdictions for groups of donors or donations based on selected criteria.'
        };
      } else {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: 'Maintain Group Interdictions', link: null }
          ],
          title: 'Maintain Group Interdictions',
          subtitle: 'Place or remove interdictions for groups of donors or donations based on selected criteria.'
        };
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
