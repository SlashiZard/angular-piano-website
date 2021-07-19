import { TestBed } from '@angular/core/testing';

import { MIDIService } from './midi.service';

describe('MIDIService', () => {
  let service: MIDIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MIDIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
