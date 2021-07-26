import { Injectable } from '@angular/core';
import { GlobalsService } from './globals.service';

@Injectable({
  providedIn: 'root'
})
export class MidiConversionService {
  // ----------------------------------------------------------------------------------
  // MIDI Conversion Functions
  // ----------------------------------------------------------------------------------
  public number_to_note(n: number) {
    const all_notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
    return all_notes[n % 12];
  }

  public number_to_octave(n: number) {
    return String(Math.floor(n / 12) - 1);
  }

  /* Returns the duration which lies the closest to the given duration. */
  public round_durations(duration: number) {
    /* const DURATIONS = [1, 1.5, 2, 3, 4, 6, 8, 16, 32]; */
    let return_duration = 1;
    let minDiff = Math.abs(duration - this.globalsService.DURATIONS[0]);

    for (const current_duration of this.globalsService.DURATIONS) {
      let currentDiff = Math.abs(duration - current_duration);

      if (currentDiff < minDiff) {
        return_duration = current_duration;
        minDiff = currentDiff;
      }
    }

    return return_duration;
  }

  public duration_to_QLs(duration: number) {
    let duration_index = this.globalsService.DURATIONS.indexOf(duration);
    return this.globalsService.DURATIONS_IN_QLS[duration_index];
  }

  public handle_accidental(midiValue: number) {
    let modValue = midiValue % 12;
    let scaleValue = this.globalsService.currentScale.indexOf(String(modValue) + "-");

    if (scaleValue > -1) {
      if (this.globalsService.scaleType === "sharps") {
        return "--";
      } else if (this.globalsService.scaleType === "flats") {
        return "++";
      }
    }

    scaleValue = this.globalsService.currentScale.indexOf(String(modValue) + "n");

    if (scaleValue > -1) {
      return "n";
    }

    scaleValue = this.globalsService.currentScale.indexOf(String(modValue) + "*");

    if (scaleValue > -1) {
      if (this.globalsService.scaleType === "sharps") {
        return "##";
      } else if (this.globalsService.scaleType === "flats") {
        return "bb";
      }
    }

    scaleValue = this.globalsService.currentScale.indexOf(modValue);

    if (scaleValue > -1) {
      if (this.globalsService.scaleType === "sharps") {
        return "-";
      } else if (this.globalsService.scaleType === "flats") {
        return "+";
      }
    }

    return "";
  }

  public handle_all_accidentals() {
    let accidentals: any[] = [];
    for (let i = 0; i < this.globalsService.lastNotes.length; ++i) {
      let note = this.globalsService.lastNotes[i];
      let foundAccidental = this.handle_accidental(note);

      if (foundAccidental != "") {
        let fixResult = this.fix_accidental(note, foundAccidental);
        this.globalsService.lastNotes[i] = fixResult[0];
        accidentals.push(fixResult[1]);
      } else {
        accidentals.push("");
      }
    }
  
    return accidentals;
  }

  public fix_accidental(note: number, accidental: string) {
    switch (accidental) {
      case "n":
        accidental = "n";
        break;
      case "-":
        note--;
        accidental = "#";
        break;
      case "+":
        note++;
        accidental = "b";
        break;
      case "--":
        note--;
        accidental = "";
        break;
      case "++":
        note++;
        accidental = "";
        break;
      case "##":
        note -= 2;
        accidental = "##";
        break;
      case "bb":
        note += 2;
        accidental = "bb";
        break;
    }

    return [note, accidental];
  }

  public getKeysOfNote(note: number) {
    return String(this.number_to_note(note) + "/" + this.number_to_octave(note));
  }

  public getKeysOfLastReleasedNotes() {
    let keys: string[] = [];
    for (let lastNote of this.globalsService.lastNotes) {
      keys.push(this.getKeysOfNote(lastNote));
    }
    return keys;
  }
  
  constructor(private globalsService: GlobalsService) { }
}
