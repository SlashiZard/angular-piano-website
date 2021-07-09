import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MIDIService } from 'src/app/services/midi.service';

@Component({
  selector: 'app-note-display',
  templateUrl: './note-display.component.html',
  styleUrls: ['./note-display.component.css']
})
export class NoteDisplayComponent implements OnInit {
  public width = 0;

  constructor(private midiService: MIDIService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.width = document.querySelector<HTMLElement>(".base")!.offsetWidth;
    this.changeDetectorRef.detectChanges();
    this.midiService.setBaseWidth(this.width);
    this.midiService.setupStaves();
  }
}
