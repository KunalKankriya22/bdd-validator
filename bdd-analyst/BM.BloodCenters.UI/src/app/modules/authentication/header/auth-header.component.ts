import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ROUTES } from '../../../core/constants/route.constants';

@Component({
  standalone: true,
  selector: 'auth-header',
  imports: [RouterLink, TranslateModule],
  templateUrl: './auth-header.component.html',
  styleUrl: './auth-header.component.scss'
})
export class AuthHeaderComponent {
  readonly ROUTES = ROUTES;
}
