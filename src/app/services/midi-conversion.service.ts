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
  
  constructor(private globalsService: GlobalsService) { }
}
