import { InjectionToken } from '@angular/core';

export const SERVER_URL = new InjectionToken<string>('SERVER_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000'
});

