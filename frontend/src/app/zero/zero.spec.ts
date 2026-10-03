import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Zero } from './zero';

describe('Zero', () => {
  let component: Zero;
  let fixture: ComponentFixture<Zero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Zero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Zero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
