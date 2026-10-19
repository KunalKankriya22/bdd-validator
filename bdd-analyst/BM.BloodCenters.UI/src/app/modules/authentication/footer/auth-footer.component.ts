import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'auth-footer',
  imports: [TranslateModule, CommonModule],
  templateUrl: './auth-footer.component.html',
  styleUrl: './auth-footer.component.scss'
})
export class AuthFooterComponent {
  // No version loading on login page for better performance
}
