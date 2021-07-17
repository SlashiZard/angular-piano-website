import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalsService } from 'src/app/services/globals.service';
import { MIDIService } from 'src/app/services/midi.service';

@Component({
  selector: 'app-note-display',
  templateUrl: './note-display.component.html',
  styleUrls: ['./note-display.component.css']
})
export class NoteDisplayComponent implements OnInit, OnDestroy {
  midiAccessEntries: any[] = [];
  scaleNames: any[] = [];
  selectedScale = 'C';

  constructor(private midiService: MIDIService,
              private globalsService: GlobalsService,
              private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.globalsService.scaleType == "sharps") {
      this.scaleNames = this.globalsService.sharpScalesNames;
    } else {
      this.scaleNames = this.globalsService.flatScalesNames;
    }
  }

  ngAfterViewInit(): void {
    let width = document.querySelector<HTMLElement>(".base")!.offsetWidth;
    this.midiService.connect();
    this.midiAccessEntries = this.midiService.getMidiAccessEntries();
    this.midiService.setBaseWidth(width);
    this.midiService.setupStaves();
    this.changeDetectorRef.detectChanges();
    console.log(this.midiAccessEntries);
  }

  ngOnDestroy(): void {

  }

  setScale(keySignature: string): void {
    this.globalsService.reset();
    console.log("keySignature is " + keySignature);
    let scaleType = "sharps";
    let scaleIndex = this.globalsService.sharpScalesNames.indexOf(keySignature);
    this.globalsService.setScale(scaleType, scaleIndex);
  }
}
