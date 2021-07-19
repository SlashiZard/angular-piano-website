import { Injectable } from '@angular/core';
import { GlobalsService } from './globals.service';
import { MathService } from './math.service';
import { MidiConversionService } from './midi-conversion.service';
import { VexflowService } from './vexflow.service';

@Injectable({
  providedIn: 'root'
})
export class MIDIService {
  constructor(private mathService: MathService,
              private midiConversionService: MidiConversionService,
              private globalsService: GlobalsService,
              private vexflowService: VexflowService) { }


  // ----------------------------------------------------------------------------------
  // Web Midi API
  // ----------------------------------------------------------------------------------
  midiAccessEntries: any[] = [];
  currentMidiDevice: any;

  getMidiAccessEntries() {
    return this.midiAccessEntries;
  }

  connect_first_device() {
    window.navigator.requestMIDIAccess()
    .then((midiAccess) => {
      console.log("MIDI Ready!");

      /* Remove onmidimessage event listener. */
      if (this.currentMidiDevice) {
        this.currentMidiDevice.onmidimessage = null;
      }

      this.midiAccessEntries = [];

      for (let entry of midiAccess.inputs) {
        this.midiAccessEntries.push(entry);
        console.log(entry);
      }

      if (this.midiAccessEntries.length >= 1) {
        this.currentMidiDevice = this.midiAccessEntries[0][1];
        this.currentMidiDevice.onmidimessage = this.getMIDIMessage.bind(this);
      }

      // for (let entry of midiAccess.inputs) {
      //   console.log("MIDI input device: " + entry[1].id)
      //   entry[1].onmidimessage = this.getMIDIMessage.bind(this);
      // }
    })
    .catch((error) => {
      console.log("Error accessing MIDI devices: " + error);
    });
  }

  refresh_devices() {
    window.navigator.requestMIDIAccess()
    .then((midiAccess) => {
      console.log("Refreshing MIDI input devices");

      this.midiAccessEntries = [];

      for (let entry of midiAccess.inputs) {
        this.midiAccessEntries.push(entry);
        console.log(entry);
      }
    })
    .catch((error) => {
      console.log("Error accessing MIDI devices: " + error);
    });
  }

  connect_to_device(device_index: number) {
    this.currentMidiDevice.onmidimessage = null;
    this.currentMidiDevice = this.midiAccessEntries[device_index];
    this.currentMidiDevice.onmidimessage = this.getMIDIMessage.bind(this);
  }

  private getMIDIMessage(message: any) {
    let command = message.data[0];
    let note = message.data[1];
    /* A velocity value might not be included with a noteOff command. */
    let velocity = (message.data.length > 2) ? message.data[2] : 0;
    let timestamp = Date.now();

    switch (command) {
      case 144:
        console.log("NoteOn", note);

        if (velocity > 0) {
          // console.log("Velocity is", velocity);
          // this.globalsService.velocities[note] = velocity;
          this.globalsService.setVelocity(note, velocity)
          // console.log("Timestamp is", timestamp);
          this.globalsService.noteTimestamps[note] = timestamp;
        }

        this.globalsService.currentlyPressing++;
        break;
      case 128:
        console.log("NoteOff", note);
        console.log(this.midiConversionService.number_to_note(note) + "/" + this.midiConversionService.number_to_octave(note));

        if (this.globalsService.velocities[note] === 0) {
          console.log("No velocity detected.");
        } else {
          velocity = this.globalsService.velocities[note];
          console.log("Velocity is", velocity);
        }

        let note_duration = (timestamp - this.globalsService.noteTimestamps[note]) / (60000 / this.globalsService.bpm);
        note_duration = this.midiConversionService.round_durations(1 / note_duration * 4);
        let addedQLs = this.midiConversionService.duration_to_QLs(note_duration);

        /* measureDuration is 2.0 if two quarter notes have been played in the measure. */
        this.globalsService.measureDuration = this.globalsService.scoreDuration % this.globalsService.beatsInMeasure;
        let measureDurationLeft = 4 - this.globalsService.measureDuration;

        let newNotes = this.vexflowService.list_new_notes(addedQLs, measureDurationLeft);
        this.globalsService.currentlyPressing--;

        /* Handle the accidentals. */
        let accidental: any = "";
        let foundAccidental = this.midiConversionService.handle_accidental(note);

        if (foundAccidental != "") {
          let fixResult = this.midiConversionService.fix_accidental(note, foundAccidental);
          note = fixResult[0];
          accidental = fixResult[1];
        }

        let noteCount = 0;

        for (let newNote of newNotes) {
          if (typeof newNote === "number") {
            noteCount++;

            /* Note is of full duration. */
            if (this.mathService.power_of_2(newNote)) {
              this.globalsService.notes[this.globalsService.notes.length - 1].push(new Vex.Flow.StaveNote({ keys: [this.midiConversionService.getKeysOfNote(note)], duration: String(newNote) }));
            /* A dot is needed. */
            } else {
              newNote = String(this.globalsService.DURATIONS[this.globalsService.DURATIONS.indexOf(newNote) + 1]);
              this.globalsService.notes[this.globalsService.notes.length - 1].push(new Vex.Flow.StaveNote({ keys: [this.midiConversionService.getKeysOfNote(note)], duration: String(newNote) }).addDot(0));
            }

            /* Add the accidentals. */
            if (accidental != "") {
              let notesInLastArray = this.globalsService.notes[this.globalsService.notes.length - 1].length;
              let targetNote = this.globalsService.notes[this.globalsService.notes.length - 1][notesInLastArray - 1];
              targetNote.addAccidental(0, new Vex.Flow.Accidental(accidental));
            }

            this.vexflowService.handle_ties(noteCount);
          /* If newNote is string "new". */
          } else {
            this.vexflowService.create_new_stave();
            this.globalsService.notes.push([]);
          }
        }

        this.vexflowService.draw_notes();
        break;
    }
  }

  setupStaves() {
    let VF = Vex.Flow;
    let vexDiv = document.getElementById("vex") as HTMLInputElement;
    vexDiv.innerHTML = "";
    this.globalsService.renderer = new VF.Renderer(vexDiv, VF.Renderer.Backends.SVG);
    this.globalsService.renderer.resize(this.globalsService.stavesPerRow * 500, 2000);
    let context = this.globalsService.renderer.getContext();

    /* Create the first stave and draw it. */
    let stave = new VF.Stave(10, 40, this.globalsService.staveWidth);
    stave.addClef("treble").addTimeSignature("4/4");
    stave.addKeySignature(this.globalsService.currentKeySignature);
    this.globalsService.staves.push(stave);
    console.log("all staves: ", this.globalsService.staves);
    stave.setContext(context).draw();
  }

  setBaseWidth(width: number) {
    this.globalsService.baseWidth = width;
    this.globalsService.stavesPerRow = Math.floor(this.globalsService.baseWidth / this.globalsService.staveWidth);
  }
}
