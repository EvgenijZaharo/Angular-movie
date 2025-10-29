import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutorizationPage } from './authorization-page';

describe('AutorizationPage', () => {
  let component: AutorizationPage;
  let fixture: ComponentFixture<AutorizationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutorizationPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutorizationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
