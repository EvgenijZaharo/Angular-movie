import {Component, inject, signal, computed} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputField} from '../../shared/input-field/input-field';
import {UserStore} from '../../store/user-store';
import {Router} from '@angular/router';

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

  authorizationForm = new FormGroup({
    login: new FormControl<string>('',{
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(20)
      ],
      nonNullable: true
    }),
    password: new FormControl<string>('',{
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(32),
        Validators.pattern('^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).*$')
      ],
      nonNullable: true
    }),
    email: new FormControl<string>('',{
      validators: [Validators.required, Validators.email],
      nonNullable: true
    })
  })

  isLoginView = signal(true);
  successMessage = signal<string | null>(null);
  formError = signal<string | null>(null);

  isLoading = computed(() => this.userStore.isLoading());
  serverError = computed(() => this.userStore.error()?.error || null);


  protected OnSubmitLogin(): void {
    this.userStore.clearError();
    this.formError.set(null);
    this.successMessage.set(null);

    console.log('Form valid:', this.authorizationForm.valid);
    console.log('Login control:', {
      value: this.authorizationForm.controls.login.value,
      valid: this.authorizationForm.controls.login.valid,
      errors: this.authorizationForm.controls.login.errors
    });
    console.log('Email control:', {
      value: this.authorizationForm.controls.email.value,
      valid: this.authorizationForm.controls.email.valid,
      errors: this.authorizationForm.controls.email.errors
    });
    console.log('Password control:', {
      value: this.authorizationForm.controls.password.value,
      valid: this.authorizationForm.controls.password.valid,
      errors: this.authorizationForm.controls.password.errors
    });

    if(!this.authorizationForm.valid){
      this.formError.set('Please fill in all fields correctly');
      return;
    }

    const credentials = {
      email: this.authorizationForm.controls.email.value.trim(),
      password: this.authorizationForm.controls.password.value.trim(),
    }

    this.userStore.login(credentials);
    console.log('Login request sent');
  }

  protected OnSubmitRegister(): void {
    this.userStore.clearError();
    this.formError.set(null);
    this.successMessage.set(null);

    if(!this.authorizationForm.valid){
      this.formError.set('Please fill in all fields correctly');
      return;
    }

    const newUser = {
      login: this.authorizationForm.controls.login.value.trim(),
      password: this.authorizationForm.controls.password.value.trim(),
      email: this.authorizationForm.controls.email.value.trim(),
    }

    this.userStore.register(newUser);
    console.log('Registration request sent');
    this.authorizationForm.reset();
  }

  showLogin() {
    this.isLoginView.set(true);
    this.clearMessages();
  }

  showRegister() {
    this.isLoginView.set(false);
    this.clearMessages();
  }

  private clearMessages() {
    this.userStore.clearError();
    this.formError.set(null);
    this.successMessage.set(null);
  }
}
