import { TestBed } from '@angular/core/testing';

import { VexflowService } from './vexflow.service';

describe('VexflowService', () => {
  let service: VexflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VexflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
