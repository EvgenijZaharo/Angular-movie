import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-main-page',
  imports: [FormsModule],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainPage {
  router = inject(Router);

  searchQuery = signal('');

  onSearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.router.navigate(['/catalog', query]);
    }
  }
}
