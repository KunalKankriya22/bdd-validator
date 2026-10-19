import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DrawQueryFooterData {
  recordCount: number;
  goal: number;
  numberOfDrives: number;
  projectedShow: number;
  projectedDraw: number;
  projectedDeferral: number;
  deferralPercent: string;
  actualDraw: number;
  actualDeferral: number;
  actualDeferralPercent: string;
  prelab: number;
  rnft: number;
  veni03: number;
  veni04: number;
  veni05: number;
  veni06: number;
  veni07: number;
  veniTotal: number;
}

@Component({
  selector: 'app-draw-query-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './draw-query-footer.html',
  styleUrls: ['./draw-query-footer.scss']
})
export class DrawQueryFooter {
  @Input() data: DrawQueryFooterData | null = null;
  @Input() driveTypeDescription: string = '';
}
