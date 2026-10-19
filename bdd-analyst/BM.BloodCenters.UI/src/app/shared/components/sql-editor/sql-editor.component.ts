import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  Input,
  forwardRef,
  signal,
  effect,
  HostBinding,
  Optional,
  Self
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { EditorView, ViewUpdate, keymap, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment, ChangeDesc, Transaction } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

// SQL Keywords to auto-capitalize
const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER',
  'DROP', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS',
  'ON', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'DISTINCT', 'UNION', 'ALL', 'LIMIT',
  'OFFSET', 'TOP', 'ASC', 'DESC', 'NULL', 'IS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'WITH', 'USING', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'CAST', 'CONVERT', 'COALESCE',
  'NULLIF', 'IFNULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE',
  'CHECK', 'DEFAULT', 'AUTO_INCREMENT', 'IDENTITY', 'CASCADE', 'RESTRICT', 'NO', 'ACTION',
  'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'TRANSACTION', 'BEGIN', 'START'
]);

@Component({
  selector: 'app-sql-editor',
  standalone: true,
  template: `
    <div class="sql-editor-wrapper"
         [class.disabled]="disabled"
         [class.focused]="focused"
         (focusin)="onFocusIn()"
         (focusout)="onFocusOut()">
      <div #editorContainer class="sql-editor-container"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .sql-editor-wrapper {
      overflow: hidden;
      background: transparent;
    }

    .sql-editor-wrapper.disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .sql-editor-container {
      min-height: 200px;
      max-height: 400px;
      overflow: auto;
    }

    :host ::ng-deep .cm-editor {
      height: 100%;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      background: transparent;
    }

    :host ::ng-deep .cm-scroller {
      overflow: auto;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: transparent;
    }

    :host ::ng-deep .cm-content {
      padding: 8px 4px;
      min-height: 200px;
      background: transparent;
    }

    :host ::ng-deep .cm-line {
      padding: 2px 0;
      line-height: 1.6;
    }

    :host ::ng-deep .cm-gutters {
      background-color: transparent;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      color: rgba(0, 0, 0, 0.38);
      min-width: 40px;
    }

    :host ::ng-deep .cm-activeLineGutter {
      background-color: rgba(34, 129, 137, 0.08);
    }

    :host ::ng-deep .cm-activeLine {
      background-color: transparent;
    }

    /* SQL Syntax Highlighting - Match client screenshot */
    :host ::ng-deep .cm-keyword {
      color: #0066cc;
      font-weight: normal;
    }

    :host ::ng-deep .cm-string {
      color: #d73a49;
    }

    :host ::ng-deep .cm-comment {
      color: #6a737d;
      font-style: italic;
    }

    :host ::ng-deep .cm-number {
      color: #005cc5;
    }

    :host ::ng-deep .cm-operator {
      color: #24292e;
    }

    :host ::ng-deep .cm-punctuation {
      color: #24292e;
    }

    :host ::ng-deep .cm-variableName,
    :host ::ng-deep .cm-typeName,
    :host ::ng-deep .cm-propertyName {
      color: #24292e;
    }

    :host ::ng-deep .cm-function {
      color: #0066cc;
    }

    /* Selection */
    :host ::ng-deep .cm-selectionBackground {
      background-color: #c8e1ff !important;
    }

    :host ::ng-deep .cm-focused .cm-selectionBackground {
      background-color: #c8e1ff !important;
    }

    /* Matching brackets */
    :host ::ng-deep .cm-matchingBracket {
      background-color: rgba(0, 0, 0, 0.05);
      outline: 1px solid rgba(0, 0, 0, 0.1);
    }

    /* Search highlighting */
    :host ::ng-deep .cm-searchMatch {
      background-color: #ffd33d;
    }

    :host ::ng-deep .cm-searchMatch-selected {
      background-color: #ffab00;
    }

    /* Cursor */
    :host ::ng-deep .cm-cursor {
      border-left-color: #24292e;
    }

    /* Focus state */
    :host ::ng-deep .cm-editor.cm-focused {
      outline: none;
    }
  `],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: SqlEditorComponent
    }
  ]
})
export class SqlEditorComponent implements OnInit, OnDestroy, ControlValueAccessor, MatFormFieldControl<string> {
  static nextId = 0;
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Input() minHeight = '200px';
  @Input() maxHeight = '400px';
  @Input() showLineNumbers = false;

  private editorView?: EditorView;
  private editableCompartment = new Compartment();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // MatFormFieldControl implementation
  stateChanges = new Subject<void>();
  focused = false;
  touched = false;
  controlType = 'app-sql-editor';
  autofilled = false;

  @HostBinding() id = `sql-editor-${SqlEditorComponent.nextId++}`;
  @HostBinding('attr.aria-describedby') describedBy = '';

  private _placeholder = '';
  private _required = false;
  private _disabled = false;

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  get value(): string {
    return this._value;
  }
  set value(val: string) {
    this._value = val;
    this.stateChanges.next();
  }

  private _value = '';

  get empty(): boolean {
    return !this._value;
  }

  @HostBinding('class.floating')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  get errorState(): boolean {
    return !!(this.ngControl?.invalid && this.touched);
  }

  constructor(
    private _elementRef: ElementRef,
    private _focusMonitor: FocusMonitor,
    @Optional() @Self() public ngControl: NgControl
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      const container = this.editorContainer?.nativeElement;
      if (container && this.minHeight) {
        container.style.minHeight = this.minHeight;
      }
      if (container && this.maxHeight) {
        container.style.maxHeight = this.maxHeight;
      }
    });
  }

  ngOnInit(): void {
    this.initializeEditor();
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
    this.editorView?.destroy();
  }

  onFocusIn(): void {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(): void {
    if (this.focused) {
      this.focused = false;
      this.touched = true;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  setDescribedByIds(ids: string[]): void {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(): void {
    if (this.editorView) {
      this.editorView.focus();
    }
  }

  private initializeEditor(): void {
    const extensions = [
      history(),
      indentOnInput(),
      bracketMatching(),
      autocompletion(),
      highlightSelectionMatches(),
      syntaxHighlighting(defaultHighlightStyle),
      sql(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap
      ]),
      // Auto-capitalize SQL keywords
      EditorState.transactionFilter.of((tr: Transaction) => {
        if (!tr.docChanged || tr.annotation(Transaction.userEvent) !== 'input.type') {
          return tr;
        }

        const changes: any[] = [];
        tr.changes.iterChanges((fromA: number, toA: number, fromB: number, toB: number, inserted: any) => {
          const insertedText = inserted.toString();

          // Only process single character or space inputs
          if (insertedText.length === 1 && insertedText === ' ') {
            // Get the word just typed (before the space)
            const doc = tr.newDoc;
            let wordStart = fromB - 1;

            // Find the start of the word
            while (wordStart > 0) {
              const char = doc.sliceString(wordStart - 1, wordStart);
              if (!/[a-zA-Z_]/.test(char)) break;
              wordStart--;
            }

            const word = doc.sliceString(wordStart, fromB);
            const upperWord = word.toUpperCase();

            // Check if it's a SQL keyword and needs capitalization
            if (word !== upperWord && SQL_KEYWORDS.has(upperWord)) {
              changes.push({
                from: wordStart,
                to: fromB,
                insert: upperWord
              });
            }
          }
        });

        if (changes.length > 0) {
          return [tr, { changes }];
        }
        return tr;
      }),
      EditorView.updateListener.of((update: ViewUpdate) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          this._value = newValue;
          this.onChange(newValue);
          this.stateChanges.next();
        }
        if (update.focusChanged) {
          if (update.view.hasFocus) {
            this.onFocusIn();
          }
        }
      }),
      this.editableCompartment.of(EditorView.editable.of(!this._disabled)),
      // Prevent leading spaces
      keymap.of([
        {
          key: 'Space',
          run: (view) => {
            const state = view.state;
            const selection = state.selection.main;
            const cursorPos = selection.from;
            const doc = state.doc;

            // Check if cursor is at position 0 (beginning of document)
            if (cursorPos === 0) {
              return true; // Prevent space
            }

            // Check if cursor is at the beginning of a line
            const line = doc.lineAt(cursorPos);
            if (cursorPos === line.from) {
              return true; // Prevent leading space on line
            }

            return false; // Allow space
          }
        }
      ])
    ];

    // Add line numbers only if enabled
    if (this.showLineNumbers) {
      extensions.unshift(lineNumbers(), highlightActiveLineGutter());
    }

    const startState = EditorState.create({
      doc: this._value || '',
      extensions
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.editorContainer.nativeElement
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this._value = value || '';

    if (this.editorView) {
      const currentValue = this.editorView.state.doc.toString();
      if (currentValue !== (value || '')) {
        this.editorView.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value || ''
          }
        });
      }
    }
    this.stateChanges.next();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
    this.stateChanges.next();

    if (this.editorView) {
      this.editorView.dispatch({
        effects: this.editableCompartment.reconfigure(EditorView.editable.of(!isDisabled))
      });
    }
  }
}
