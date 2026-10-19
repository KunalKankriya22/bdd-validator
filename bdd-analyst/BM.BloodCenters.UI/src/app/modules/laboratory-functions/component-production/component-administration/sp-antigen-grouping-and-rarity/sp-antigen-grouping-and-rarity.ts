import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { AntigenGroupComponent } from './antigen-group/antigen-group';
import { AntigenRarityComponent } from './antigen-rarity/antigen-rarity';

@Component({
  selector: 'app-sp-antigen-grouping-and-rarity',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    AntigenGroupComponent,
    AntigenRarityComponent,
  ],
  templateUrl: './sp-antigen-grouping-and-rarity.html',
  styleUrls: ['./sp-antigen-grouping-and-rarity.scss'],
})
export class SpAntigenGroupingAndRarityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly selectedTabIndex = signal(0);

  readonly tabs = [
    { id: 'antigen-group', label: 'Antigen Group' },
    { id: 'antigen-rarity', label: 'Antigen Rarity' },
  ];

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Special Processing Antigen Grouping and Rarity', link: null },
    ],
    title: 'Special Processing Antigen Grouping and Rarity',
    subtitle: 'Define antigen combinations and rarity criteria for product classification and search.',
  };

  ngOnInit(): void {
    const urlPath = this.route.snapshot.url.map(segment => segment.path).join('/');

    if (urlPath.includes('antigen-rarity')) {
      this.selectedTabIndex.set(1);
    } else if (urlPath.includes('antigen-group')) {
      this.selectedTabIndex.set(0);
    } else {
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          const tab = Number(params['tab']);
          if (!isNaN(tab) && (tab === 0 || tab === 1)) {
            this.selectedTabIndex.set(tab);
          } else {
            this.selectedTabIndex.set(0);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(event: MatTabChangeEvent): void {
    const tab = this.tabs[event.index];
    const basePath = '/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity';

    this.router.navigate([`${basePath}/${tab.id}`]);
  }
}
