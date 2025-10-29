import {Component, inject} from '@angular/core';
import {RouterModule, RouterOutlet} from '@angular/router';
import {UserStore} from '../store/user-store';
import {HeaderComponent} from '../pages/header-component/header-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App{

  userStore = inject(UserStore);
  currentUser = this.userStore.currentUser();
  isAuthentificated = this.userStore.isAuthenticated();

}
