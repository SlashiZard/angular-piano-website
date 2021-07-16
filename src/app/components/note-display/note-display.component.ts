import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MIDIService } from 'src/app/services/midi.service';

@Component({
  selector: 'app-note-display',
  templateUrl: './note-display.component.html',
  styleUrls: ['./note-display.component.css']
})
export class NoteDisplayComponent implements OnInit {
  public midiAccessEntries: any[] = [];

  constructor(private midiService: MIDIService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    let width = document.querySelector<HTMLElement>(".base")!.offsetWidth;
    this.midiService.connect();
    this.midiAccessEntries = this.midiService.getMidiAccessEntries();
    this.midiService.setBaseWidth(width);
    this.midiService.setupStaves();
    this.changeDetectorRef.detectChanges();
    console.log(this.midiAccessEntries);
   }
}
