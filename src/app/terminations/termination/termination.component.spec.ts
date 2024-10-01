import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminationComponent } from './termination.component';

describe('TerminationComponent', () => {
  let component: TerminationComponent;
  let fixture: ComponentFixture<TerminationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
