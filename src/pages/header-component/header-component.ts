import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {UserStore} from '../../store/user-store';

@Component({
  selector: 'app-header-component',
  imports: [
    RouterLink,
  ],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  userStore = inject(UserStore);
  currentUser = this.userStore.currentUser();
  isAuthentificated = this.userStore.isAuthenticated();

}
