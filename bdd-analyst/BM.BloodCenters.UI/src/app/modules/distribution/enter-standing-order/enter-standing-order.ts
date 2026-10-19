import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Enter Standing Order - Root Component
 * Container for standing order list and item views
 */
@Component({
  selector: 'app-enter-standing-order',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; height: 100%; }']
})
export class EnterStandingOrderComponent {}
