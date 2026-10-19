import { Directive, ElementRef, HostListener, Input } from '@angular/core';

/**
 * Highlights an element on hover with specified color
 * 
 * Usage: <div appHighlight [highlightColor]="'yellow'">Hover me</div>
 */
@Directive({
    selector: '[appHighlight]',
    standalone: true
})
export class HighlightDirective {
    @Input() highlightColor: string = 'yellow';

    constructor(private el: ElementRef) { }

    @HostListener('mouseenter') onMouseEnter() {
        this.highlight(this.highlightColor);
    }

    @HostListener('mouseleave') onMouseLeave() {
        this.highlight('');
    }

    private highlight(color: string) {
        this.el.nativeElement.style.backgroundColor = color;
    }
}
