import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthHeaderComponent } from '../header/auth-header.component';
import { AuthFooterComponent } from '../footer/auth-footer.component';

@Component({
  standalone: true,
  selector: 'auth-layout',
  imports: [RouterOutlet, AuthHeaderComponent, AuthFooterComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent {}
