import { Component, Input } from '@angular/core';

@Component({ selector: 'app-data-table', template: '', standalone: true })
export class DataTableStub {
  @Input() config: any;
  @Input() data: any;
  @Input() isLoading: any;
}

@Component({ selector: 'app-unit-id-field', template: '', standalone: true })
export class UnitIdFieldStub {}

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
export class PageHeaderWithBreadcrumbStub {
  @Input() config: any;
}

@Component({ selector: 'app-search-bar', template: '', standalone: true })
export class SearchBarStub {
  @Input() config: any;
}

@Component({ selector: 'app-filter-chips', template: '', standalone: true })
export class FilterChipsStub {
  @Input() chips: any;
}