import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

import { RbcAgGroupsComponent } from './components/rbc-ag-groups/rbc-ag-groups';
import { SerMolConfirmatoryRulesComponent } from './ser-mol-confirmatory-rules/ser-mol-confirmatory-rules';
import { DefineExternalFileMappingComponent } from '../rbc-antigen-manager-configuration/define-external-file-mapping/define-external-file-mapping';
import { WellskyTransfusionStatusLogComponent } from '../rbc-antigen-manager-configuration/wellsky-transfusion-status-log/wellsky-transfusion-status-log';
import { DonorRbcAgQueryComponent } from '../donor-rbc-ag-query/donor-rbc-ag-query';

type TabId = 'rbc-ag-groups' | 'ser-mol-confirmatory-rules' | 'external-file-mapping' | 'transfusion-status-log' | 'donor-rbc-antigen-query';

interface Tab {
  id: TabId;
  label: string;
}

@Component({
  selector: 'app-rbc-antigen-manager-config',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    RbcAgGroupsComponent,
    SerMolConfirmatoryRulesComponent,
    DefineExternalFileMappingComponent,
    WellskyTransfusionStatusLogComponent,
    DonorRbcAgQueryComponent,
  ],
  templateUrl: './rbc-antigen-manager-config.html',
  styleUrls: ['./rbc-antigen-manager-config.scss'],
})
export class RbcAntigenManagerConfigComponent {
  private readonly pageHeaderService = inject(PageHeaderService);

  readonly headerConfig = computed<PageHeaderConfig>(() => ({
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: this.pageHeaderService.getTitle() ?? '', link: null },
    ],
  }));

  selectedTabIndex = signal(0);

  readonly tabs: Tab[] = [
    { id: 'rbc-ag-groups', label: 'RBC Ag Groups' },
    { id: 'ser-mol-confirmatory-rules', label: 'Ser/Mol Confirmatory Rules' },
    { id: 'external-file-mapping', label: 'External File Mapping' },
    { id: 'transfusion-status-log', label: 'Transfusion Status Log' },
    { id: 'donor-rbc-antigen-query', label: 'Donor RBC Antigen Query' },
  ];

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex.set(event.index);
  }

  get activeTabId(): TabId {
    return this.tabs[this.selectedTabIndex()].id;
  }
}
