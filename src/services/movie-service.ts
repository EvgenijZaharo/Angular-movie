import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  http = inject(HttpClient);
  films: any[] = [];
  private apiUrl = 'http://localhost:3000/films';

  constructor() {
    this.getFilms().subscribe(films => {
      this.films = films;
    })
  }

  getFilms() {
    return this.http.get<any[]>(this.apiUrl);
  }
}
