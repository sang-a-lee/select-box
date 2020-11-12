import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DualSelectorComponent } from './dual-selector.component';

describe('DualSelectorComponent', () => {
  let component: DualSelectorComponent;
  let fixture: ComponentFixture<DualSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DualSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DualSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
