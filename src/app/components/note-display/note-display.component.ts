import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalsService } from 'src/app/services/globals.service';
import { MIDIService } from 'src/app/services/midi.service';
import { VexflowService } from 'src/app/services/vexflow.service';

@Component({
  selector: 'app-note-display',
  templateUrl: './note-display.component.html',
  styleUrls: ['./note-display.component.css']
})
export class NoteDisplayComponent implements OnInit {
  midiAccessEntries: any[] = [];
  scaleNames: any[] = [];
  scaleTypes: string[];
  selectedScale = 'C';
  selectedScaleType = 'sharps';
  selectedDeviceIndex = 0;

  constructor(private midiService: MIDIService,
              private globalsService: GlobalsService,
              private changeDetectorRef: ChangeDetectorRef)
  {
    this.scaleTypes = this.globalsService.scaleTypes;
  }

  updateScaleNames(): void {
    if (this.globalsService.scaleType == "sharps") {
      this.scaleNames = this.globalsService.sharpScalesNames;
    } else {
      this.scaleNames = this.globalsService.flatScalesNames;
    }
  }

  ngOnInit(): void {
    this.updateScaleNames();
  }

  ngAfterViewInit(): void {
    let width = document.querySelector<HTMLElement>(".base")!.offsetWidth;
    this.midiService.connect_first_device();
    this.midiAccessEntries = this.midiService.getMidiAccessEntries();
    this.midiService.setBaseWidth(width);
    this.midiService.setupStaves();
    this.changeDetectorRef.detectChanges();
    console.log("midi", this.midiAccessEntries);
  }

  setScaleType(scaleType: string): void {
    console.log("new scale type is " + scaleType);
    this.globalsService.reset();
    this.globalsService.setScale(scaleType, 0);
    this.updateScaleNames();
    this.midiService.setupStaves();
  }

  setScale(keySignature: string): void {
    console.log("new keySignature is " + keySignature);
  
    let scaleIndex = this.scaleNames.indexOf(keySignature);

    this.globalsService.reset();
    this.globalsService.setScale(this.selectedScaleType, scaleIndex);
    this.midiService.setupStaves();
  }

  onRefreshClick(): void {
    this.midiService.refresh_devices();
    this.midiAccessEntries = this.midiService.midiAccessEntries;
  }

  connectToDevice(device_index: number): void {
    console.log("device index is " + device_index);
    this.midiService.connect_to_device(device_index);
  }
}
