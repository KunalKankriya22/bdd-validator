import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { SpAntigenGroupsComponent } from '../sp-antigen-groups/sp-antigen-groups.component';
import { SpAntigenRaritiesComponent } from '../sp-antigen-rarities/sp-antigen-rarities.component';

/**
 * Special Processing Antigen Grouping and Rarity Container Component
 * Mnemonic: ANTGGRP
 * Contains two tabs: Antigen Groups and Antigen Rarities
 */
@Component({
  selector: 'app-special-processing-antigen-grouping-and-rarity',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    SpAntigenGroupsComponent,
    SpAntigenRaritiesComponent,
  ],
  templateUrl: './special-processing-antigen-grouping-and-rarity.html',
  styleUrls: ['./special-processing-antigen-grouping-and-rarity.scss'],
})
export class SpecialProcessingAntigenGroupingAndRarityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly selectedTabIndex = signal(0);

  readonly tabs = [
    { id: 'groups', label: 'Antigen Groups' },
    { id: 'rarities', label: 'Antigen Rarities' },
  ];

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: "SP' Antigen Grouping and Rarity", link: null },
    ],
  };

  ngOnInit(): void {
    // Determine tab based on URL path
    const urlPath = this.route.snapshot.url.map(segment => segment.path).join('/');

    if (urlPath.includes('groups')) {
      this.selectedTabIndex.set(0); // Antigen Groups tab
      this.pageHeaderConfig.breadcrumbs[1].label = "SP' Antigen Groups";
    } else if (urlPath.includes('rarities')) {
      this.selectedTabIndex.set(1); // Antigen Rarities tab
      this.pageHeaderConfig.breadcrumbs[1].label = "SP' Antigen Rarities";
    } else {
      // Fallback to query params if no specific path
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          const tab = Number(params['tab']);
          if (!isNaN(tab) && (tab === 0 || tab === 1)) {
            this.selectedTabIndex.set(tab);
          } else {
            this.selectedTabIndex.set(0); // Default to Antigen Groups tab
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
    const basePath = '/laboratory-functions/component-production/special-processing-antigen-grouping-and-rarity';

    if (tab.id === 'groups') {
      this.router.navigate([`${basePath}/groups`]);
    } else if (tab.id === 'rarities') {
      this.router.navigate([`${basePath}/rarities`]);
    }
  }
}
