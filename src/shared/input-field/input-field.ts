import {Component, forwardRef, output, input, OnInit, DestroyRef, inject} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {onChangeFn, onTouchFn} from '../../app/interfaces';

@Component({
  selector: 'input-field',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './input-field.html',
  styleUrl: './input-field.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputField),
      multi: true
    },
  ],
  host: {
    '[class.has-error]': 'hasError()'
  }
})
export class InputField implements ControlValueAccessor, OnInit {

  private destroyRef = inject(DestroyRef);
  readonly hasValidationError = input<boolean>(false);

  ngOnInit() {
    this.taskControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.onChange(value || ''));
  }

  readonly focusChange = output<boolean>();

  private onChange: onChangeFn<string> = () => {
  };
  private onTouch: onTouchFn = () => {
  };
  taskControl = new FormControl<string>('');

  protected hasError(): boolean {
    return this.hasValidationError();
  }

  writeValue(value: string): void {
    this.taskControl.setValue(value);
  }

  registerOnChange(fn: onChangeFn<string>): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: onTouchFn): void {
    this.onTouch = fn;
  }

  onFocus(): void {
    this.focusChange.emit(true);
  }

  onBlur(): void {
    this.onTouch();
    this.focusChange.emit(false);
  }

}

