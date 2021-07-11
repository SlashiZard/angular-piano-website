import { TestBed } from '@angular/core/testing';

import { MidiConversionService } from './midi-conversion.service';

describe('MidiConversionService', () => {
  let service: MidiConversionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MidiConversionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
