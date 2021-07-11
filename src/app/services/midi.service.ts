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
  public midiIn : any[] = [];
  public midiOut : any[] = [];

  public connect() {
    window.navigator.requestMIDIAccess()
    .then((midiAccess) => {
        console.log("MIDI Ready!");
        for(let entry of midiAccess.inputs) {
            console.log("MIDI input device: " + entry[1].id)
            entry[1].onmidimessage = this.getMIDIMessage.bind(this);
        }
    })
    .catch((error) => {
        console.log("Error accessing MIDI devices: " + error);
    });
  }

  // public onMidiMessage(midiEvent: WebMidi.MIDIMessageEvent): void {
  //     let noteNames: string[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  //     let data: Uint8Array = midiEvent.data;
  //     if(data.length === 3) {
  //         // status is the first byte.
  //         let status = data[0];
  //         // command is the four most significant bits of the status byte.
  //         let command = status >>> 4;
  //         // channel 0-15 is the lower four bits.
  //         let channel = status & 0xF;

  //         console.log(`$Command: ${command.toString(16)}, Channel: ${channel.toString(16)}`);

  //         // just look at note on and note off messages.
  //         if(command === 0x9 || command === 0x8) {
  //             // note number is the second byte.
  //             let note = data[1];
  //             // velocity is the thrid byte.
  //             let velocity = data[2];

  //             let commandName = command === 0x9 ? "Note On " : "Note Off";

  //             // calculate octave and note name.
  //             let octave = Math.trunc(note / 12);
  //             let noteName = noteNames[note % 12];

  //             console.log(`${commandName} ${noteName}${octave} ${velocity}`);
  //         }
  //     }
  // }

  // public connect() {
  //   window.navigator.requestMIDIAccess()
  //     .then(this.onMIDISuccess, this.onMIDIFailure);
  // }

  // private onMIDISuccess(midiAccess: any) {
  //   for (let input of midiAccess.inputs.values()) {
  //     console.log(input);
  //     input.onmidimessage = this.getMIDIMessage;
  //   }
  // }

  // private onMIDIFailure() {
  //   console.log('Could not access your MIDI devices.');
  // }

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


  public setupStaves() {
    let VF = Vex.Flow;
    let vexDiv = document.getElementById("vex") as HTMLInputElement;
    this.globalsService.renderer = new VF.Renderer(vexDiv, VF.Renderer.Backends.SVG);
    this.globalsService.renderer.resize(this.globalsService.stavesPerRow * 500, 2000);
    let context = this.globalsService.renderer.getContext();

    /* Create the first stave and draw it. */
    let stave = new VF.Stave(10, 40, this.globalsService.staveWidth);
    stave.addClef("treble").addTimeSignature("4/4");
    stave.addKeySignature(this.globalsService.currentKeySignature);
    this.globalsService.staves.push(stave);
    stave.setContext(context).draw();
  }

  public setBaseWidth(width: number) {
    this.globalsService.baseWidth = width;
    this.globalsService.stavesPerRow = Math.floor(this.globalsService.baseWidth / this.globalsService.staveWidth);
  }
}
