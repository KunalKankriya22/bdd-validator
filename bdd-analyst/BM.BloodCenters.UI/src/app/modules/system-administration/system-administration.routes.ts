import { Routes } from '@angular/router';
import { PasswordConfigurationComponent } from './password-configuration/password-configuration';
import { ManageGroupComponent } from './groups/manage-group/manage-group.component';
import { ListUserAccountComponent } from './user-list-account/list-user-account/list-user-account';
import { ReportFormComponent } from './report-admin/reports/report-form';
import { ViewWarehouseComponent } from './warehouse/view-warehouse/view-warehouse';
import { MaintainReportParameters } from './maintain-report-parameters/maintain-report-parameters';
import { AssignUserWarehouseChapterComponent } from './warehouse/assign-user-warehouse-chapter/assign-user-warehouse-chapter';

import { ChangePasswordComponent } from './change-password/change-password';
import { AddUserComponent } from './manage-users/add-user/add-user';
import { EditUserComponent } from './manage-users/edit-user/edit-user';

import { ApplicationSequenceNumbersComponent } from './application-sequence-numbers/application-sequence-numbers.component';
import { ManageMenuItemsComponent } from './manage-menu-items/manage-menu-items.component';
import { UnsavedChangesGuard } from './manage-menu-items/guards/unsaved-changes.guard';

import { ReportMasterTable } from './maintain-report-master-table/report-master-table/report-master-table';
import { ChangeChapterComponent } from './change-chapter/change-chapter';
import { DefineAccessClassComponent } from './define-access-class/define-access-class/define-access-class';
import { UserAccessMenusInterdiction } from './user-access-menus-interdiction/user-access-menus-interdiction/user-access-menus-interdiction';
import { DefineUserAccess } from './user-admin/donor-user-admin/define-user-access/define-user-access';
import { LabUserAccessComponent } from './user-admin/lab-dist-user-admin/lab-user-access/lab-user-access/lab-user-access';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';
import { RouteKey } from '../../core/constants/route-keys';
import { removePathPrefix } from '../../core/utils/route-utils';

const accessClassByInterCodePath = removePathPrefix(
  ROUTE_REGISTRY[RouteKey.AccessClassByInterCode].path,
  '/system-administration/user-admin/donor-user-admin'
);
export const SYSTEM_ADMINISTRATION_ROUTES: Routes = [
  { path: '', redirectTo: 'password-configuration', pathMatch: 'full' },

  { path: 'password-configuration', component: PasswordConfigurationComponent },

  {
    path: 'manage-groups',
    component: ManageGroupComponent,
  },

  {
    path: 'application-sequence-numbers',
    component: ApplicationSequenceNumbersComponent,
  },

  {
    path: 'report-admin',
    children: [
      {
        path: 'master-table',
        component: ReportMasterTable
      },
      {
        path: 'parameters',
        component: MaintainReportParameters
      },
      {
        path: 'reports',
        component: ReportFormComponent
      },
      {
        path: 'report-submission',
        loadComponent: () =>
          import('./report-admin/report-submission/report-submission').then(
            (m) => m.ReportSubmissionComponent,
          ),
      },
    ]
  },

  {
    path: 'menu-admin',
    children: [
      {
        path: 'manage-menu-items',
        component: ManageMenuItemsComponent,
        canDeactivate: [UnsavedChangesGuard],
      },
      {
        path: 'restricted',
        children: [
          {
            path: 'add-functions',
            loadComponent: () => import('./menu-admin/add-functions/add-functions').then(m => m.AddFunctionsComponent),
            title: 'Add Functions'
          }
        ]
      }
    ]
  },

  {
    path: 'user-admin',
    children: [
      {
        path: 'manage-users',
        component: ListUserAccountComponent,
      },
      {
        path: 'user-warehouse',
        component: ViewWarehouseComponent,
        children: [
          {
            path: 'assign-user-warehouse',
            component: AssignUserWarehouseChapterComponent,
          },
        ],
      },
      {
        path: 'donor-user-admin',
        children: [
          {
            path: 'define-access-class',
            component: DefineAccessClassComponent
          },
          {
            path: 'user-access-menus-interdiction',
            component: UserAccessMenusInterdiction
          },
          {
            path: 'define-user-access',
            component: DefineUserAccess
          },
          {
            path: accessClassByInterCodePath,
            loadComponent: ROUTE_REGISTRY[RouteKey.AccessClassByInterCode].loadComponent,
          },
        ],
      },
      {
        path: 'lab-dist-user-admin',
        children: [
          {
            path: 'lab-user-access',
            component: LabUserAccessComponent
          },
          {
            path: 'user-utilities',
            children: [
              {
                path: 'report-actions',
                loadChildren: () =>
                  import('./user-admin/lab-dist-user-admin/user-utilities/report-actions/report-actions.routes').then(
                    m => m.REPORT_ACTIONS_ROUTES
                  )
              },
              {
                path: 'document-library',
                loadComponent: () =>
                  import('./user-admin/lab-dist-user-admin/user-utilities/document-library/document-library').then(
                    m => m.DocumentLibraryComponent
                  )
              }
            ]
          }
        ]
      }
    ],
  },

  { path: 'change-password', component: ChangePasswordComponent },
  { path: 'manage-users/add-user', component: AddUserComponent },
  { path: 'manage-users/edit-user/:userId', component: EditUserComponent },
  { path: 'manage-users', component: ListUserAccountComponent },
  { path: 'change-chapter', component: ChangeChapterComponent },

];
