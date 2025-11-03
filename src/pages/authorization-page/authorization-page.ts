import {Component, inject, signal, computed} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {InputField} from '../../shared/input-field/input-field';
import {UserStore} from '../../store/user-store';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';



const confirmPassword: ValidatorFn = (control: AbstractControl,): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password?.value && !confirmPassword?.value) return null;
  return password?.value !== confirmPassword?.value ? {mismatch: true} : null;
};

@Component({
  selector: 'app-authorization-page',
  imports: [
    ReactiveFormsModule,
    InputField
  ],
  templateUrl: './authorization-page.html',
  styleUrl: './authorization-page.css',
})

export class AuthorizationPage {

  userStore = inject(UserStore);
  router = inject(Router);
  route = inject(ActivatedRoute);


  private readonly emailValidators = [Validators.required, Validators.email];
  private readonly passwordValidators = [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(32),
    Validators.pattern('^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).*$')
  ];
  private readonly loginValidators = [
    Validators.required,
    Validators.minLength(5),
    Validators.maxLength(20)
  ];


  authForm = new FormGroup({
    login: new FormControl<string>('', {
      validators: this.loginValidators,
      nonNullable: true
    }),
    email: new FormControl<string>('', {
      validators: this.emailValidators,
      nonNullable: true
    }),
    password: new FormControl<string>('', {
      validators: this.passwordValidators,
      nonNullable: true
    }),
    confirmPassword: new FormControl<string>('', {
      nonNullable: true
    })
  }, { validators: confirmPassword });

  isLoginView = signal(true);
  successMessage = signal<string | null>(null);
  formError = signal<string | null>(null);

  isLoading = computed(() => this.userStore.isLoading());
  serverError = computed(() => this.userStore.error()?.error || null);

  submitButtonClass = computed(() =>
    this.isLoginView()
      ? 'w-full rounded-lg bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50'
      : 'w-full rounded-lg bg-green-600 hover:bg-green-700 focus:ring-green-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50'
  );


  protected OnSubmitLogin(): void {
    this.clearMessages();

    const emailControl = this.authForm.controls.email;
    const passwordControl = this.authForm.controls.password;

    if (!emailControl.valid || !passwordControl.valid) {
      this.formError.set('Please fill in all fields correctly');
      emailControl.markAsTouched();
      passwordControl.markAsTouched();
      return;
    } else {

      const credentials = {
        email: emailControl.value.trim(),
        password: passwordControl.value.trim(),
      };
      this.authForm.reset();
      this.userStore.login(credentials, () => {
        this.router.navigate(['']);
      });
    }
  }

  protected OnSubmitRegister(): void {
    this.clearMessages();
    console.log(this.authForm.controls.confirmPassword.value);
    if (!this.authForm.valid) {
      this.formError.set('Please fill in all fields correctly');
      this.authForm.markAllAsTouched();
      return;
    } else {

      const newUser = {
        login: this.authForm.controls.login.value.trim(),
        password: this.authForm.controls.password.value.trim(),
        email: this.authForm.controls.email.value.trim(),
      };
      this.authForm.reset();
      this.userStore.register(newUser, () => {
        this.router.navigate(['']);
      });
    }
  }

  showLogin() {
    this.isLoginView.set(true);
    this.clearMessages();
  }

  showRegister() {
    this.isLoginView.set(false);
    this.clearMessages();
  }

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const mode = params.get('mode');
        this.isLoginView.set(mode !== 'register');
        this.clearMessages();
      });
  }

  private clearMessages() {
    this.formError.set(null);
    this.successMessage.set(null);
  }
}
