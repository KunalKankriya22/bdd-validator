/**
 * Service to handle scroll-based section navigation
 */
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SectionId, SECTION_IDS } from '../models/user.model';

@Injectable()
export class ScrollHandlerService implements OnDestroy {
  private activeSection$ = new BehaviorSubject<SectionId>('personal-info');
  private scrollContainer: HTMLElement | null = null;
  private scrollTimeout: any;
  private boundOnScroll: ((event: Event) => void) | null = null;
  private boundOnFocusIn: ((event: FocusEvent) => void) | null = null;

  getActiveSection(): Observable<SectionId> {
    return this.activeSection$.asObservable();
  }

  getCurrentSection(): SectionId {
    return this.activeSection$.value;
  }

  /**
   * Initialize scroll listener
   */
  initialize(containerSelector: string = '.page-content'): void {
    this.scrollContainer = document.querySelector(containerSelector);
    
    if (this.scrollContainer) {
      this.boundOnScroll = this.onScroll.bind(this);
      this.scrollContainer.addEventListener('scroll', this.boundOnScroll);

      // Listen for focus events to detect which section the user is editing
      this.boundOnFocusIn = this.onFocusIn.bind(this);
      this.scrollContainer.addEventListener('focusin', this.boundOnFocusIn);
    }
    
    // Initial check for active section
    setTimeout(() => this.updateActiveSection(), 100);
  }

  /**
   * Clean up scroll listener
   */
  cleanup(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    if (this.scrollContainer) {
      if (this.boundOnScroll) {
        this.scrollContainer.removeEventListener('scroll', this.boundOnScroll);
        this.boundOnScroll = null;
      }
      if (this.boundOnFocusIn) {
        this.scrollContainer.removeEventListener('focusin', this.boundOnFocusIn);
        this.boundOnFocusIn = null;
      }
    }
  }

  /**
   * Scroll to specific section
   */
  scrollToSection(sectionId: SectionId, headerOffset: number = 100): void {
    const element = document.getElementById(sectionId);
    
    if (element && this.scrollContainer) {
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
      
      this.scrollContainer.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active section immediately for better UX
      setTimeout(() => {
        this.activeSection$.next(sectionId);
      }, 100);
    }
  }

  private onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Walk up the DOM to find the closest section with a known id
    const allSectionIds = [...SECTION_IDS, 'warehouse-chapters'];
    const section = target.closest<HTMLElement>(allSectionIds.map(id => `#${id}`).join(','));
    if (section) {
      // Map warehouse-chapters to warehouse in the sidebar
      const sectionId = section.id === 'warehouse-chapters' ? 'warehouse' : section.id;
      if (SECTION_IDS.includes(sectionId as any)) {
        this.activeSection$.next(sectionId as SectionId);
      }
    }
  }

  private onScroll(): void {
    // Debounce scroll event
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.scrollTimeout = setTimeout(() => {
      this.updateActiveSection();
    }, 50);
  }

  private updateActiveSection(): void {
    if (!this.scrollContainer) return;

    const scrollPosition = this.scrollContainer.scrollTop + 250;

    // Check if scrolled to the bottom — activate the last section
    const isAtBottom = this.scrollContainer.scrollTop + this.scrollContainer.clientHeight >= this.scrollContainer.scrollHeight - 50;

    // Find all sections
    const sections = SECTION_IDS.map(id => {
      const element = document.getElementById(id);
      return {
        id,
        element,
        offsetTop: element ? element.offsetTop : 0
      };
    }).filter(section => section.element !== null);

    if (isAtBottom && sections.length > 0) {
      this.activeSection$.next(sections[sections.length - 1].id as SectionId);
      return;
    }

    // Find the current section based on scroll position
    let currentSection: SectionId = sections[0]?.id || 'personal-info';

    for (const section of sections) {
      if (scrollPosition >= section.offsetTop) {
        currentSection = section.id as SectionId;
      }
    }

    this.activeSection$.next(currentSection);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}