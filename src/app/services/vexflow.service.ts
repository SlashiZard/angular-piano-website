import { Injectable } from '@angular/core';
import { GlobalsService } from './globals.service';
import { MidiConversionService } from './midi-conversion.service';

@Injectable({
  providedIn: 'root'
})
export class VexflowService {
  // ----------------------------------------------------------------------------------
  // VexFlow Functions
  // ----------------------------------------------------------------------------------

  create_new_tie(firstNote: Vex.Flow.StaveNote | undefined, lastNote: Vex.Flow.StaveNote | undefined) {
    return new Vex.Flow.StaveTie({
      first_note: firstNote,
      last_note: lastNote,
      first_indices: [0],
      last_indices: [0]
    })
  }

  create_new_stave() {
    let new_stave = new Vex.Flow.Stave(this.globalsService.staveX, this.globalsService.staveY, this.globalsService.staveWidth);

    /* If this stave is the first stave of a row. */
    if (this.globalsService.staves.length % this.globalsService.stavesPerRow === 0) {
      new_stave.addClef("treble").addTimeSignature("4/4");
      new_stave.addKeySignature(this.globalsService.currentKeySignature);
    }

    /* If the stave is the last stave of a row. */
    if (this.globalsService.staves.length % this.globalsService.stavesPerRow === (this.globalsService.stavesPerRow - 1)) {
      this.globalsService.staveX -= this.globalsService.staveWidth * (this.globalsService.stavesPerRow - 1);
      this.globalsService.staveY += this.globalsService.staveHeight;
    } else {
      this.globalsService.staveX += this.globalsService.staveWidth;
    }

    this.globalsService.staves.push(new_stave);
  }

  /* Returns a list of note durations, which might be seperated by strings of "new".
  * Splits a single duration into multiple notes and also indicates where new staves should start.
  */
  list_new_notes(duration: number, durationLeft: number) {
    durationLeft = Math.min(durationLeft, duration);
    let newNotes = [];

    /* const DURATIONS =        [1, 1.5,   2,   3, 4,    6,   8,   16,    32]; */
    /* const DURATIONS_IN_QLS = [4,   3,   2, 1.5, 1, 0.75, 0.5, 0.25, 0.125]; */

    while (duration > 0) {
      while (durationLeft > 0) {
        for (let i = 0; i < this.globalsService.DURATIONS_IN_QLS.length; i++) {
          if (this.globalsService.DURATIONS_IN_QLS[i] <= durationLeft) {
            newNotes.push(this.globalsService.DURATIONS[i]);

            durationLeft -= this.globalsService.DURATIONS_IN_QLS[i];
            duration -= this.globalsService.DURATIONS_IN_QLS[i];
            break;
          }
        }
      }

      if (duration > 0) {
        newNotes.push("new");
        durationLeft = Math.min(duration, 4);
      }
    }

    for (const n of newNotes) {
      if (typeof n === "number") {
        this.globalsService.scoreDuration += this.midiConversionService.duration_to_QLs(n);
      }
    }

    /* If the measure ends at the current duration, create a new stave at the end. */
    if (this.globalsService.scoreDuration % this.globalsService.beatsInMeasure === 0 && newNotes[newNotes.length - 1] !== "new") {
      newNotes.push("new");
    }

    /* Prints the list that is returned. */
    // console.log(newNotes);
    // for (const n of newNotes) {
    //   console.log(n);
    // }

    return newNotes;
  }


  draw_notes() {
    console.log("drawing notes");
    let vexDiv = document.querySelector("#vex") as HTMLInputElement;
    vexDiv.innerHTML = "";
    this.globalsService.renderer = new Vex.Flow.Renderer(vexDiv, Vex.Flow.Renderer.Backends.SVG);
    this.globalsService.renderer.resize(this.globalsService.stavesPerRow * 500, 2000);
    let context = this.globalsService.renderer.getContext();

    console.log(this.globalsService.stavesPerRow);

    // console.log(this.globalsService.staves);
    // console.log(this.globalsService.notes);

    for (let i = 0; i < this.globalsService.staves.length; i++) {
      if (this.globalsService.notes[i].length == 0) {
        continue;
      }

      let stave = this.globalsService.staves[i];
      stave.setContext(context).draw();

      Vex.Flow.Formatter.FormatAndDraw(context, this.globalsService.staves[i], this.globalsService.notes[i]);

      var beams = Vex.Flow.Beam.generateBeams(this.globalsService.notes[i]);
      beams.forEach(function (b) { b.setContext(context).draw() });
    }

    this.globalsService.ties.forEach(function (t: Vex.Flow.StaveTie) { t.setContext(context).draw() });
  }

  handle_ties(noteCount: number) {
    /* Notes only need to be tied if the incoming amount of notes is two or more. */
    if (noteCount > 1) {
      let notesInLastArray = this.globalsService.notes[this.globalsService.notes.length - 1].length;
      let notesInSecondLastArray = this.globalsService.staves.length > 1 ? this.globalsService.notes[this.globalsService.notes.length - 2].length : undefined;

      /* If the tie must travel vertically to reach the next note, */
      if (this.globalsService.staves.length % this.globalsService.stavesPerRow === 1 && notesInLastArray === 1) {
        /* Starting at the last note in the last array of the previous row, the tie goes out to the right. */
        this.globalsService.ties.push(this.create_new_tie(this.globalsService.notes[this.globalsService.notes.length - 2][notesInSecondLastArray - 1], undefined));

        /* The tie goes out to the left, starting at the last note in the last array. */
        this.globalsService.ties.push(this.create_new_tie(undefined, this.globalsService.notes[this.globalsService.notes.length - 1][notesInLastArray - 1]));

      /* If the tie only needs to travel horizontally to reach the next note, */
      } else {
        /* If the tie needs to travel across staves, */
        if (notesInLastArray === 1) {
          /* Tie the last note in the second-last array with the last and only note of the last array. */
          this.globalsService.ties.push(this.create_new_tie(this.globalsService.notes[this.globalsService.notes.length - 2][notesInSecondLastArray - 1], this.globalsService.notes[this.globalsService.notes.length - 1][notesInLastArray - 1]));
        /* If the tie does not need to travel across staves, */
        } else {
          /* Tie the second-last note with the last note in the last array. */
          this.globalsService.ties.push(this.create_new_tie(this.globalsService.notes[this.globalsService.notes.length - 1][notesInLastArray - 2], this.globalsService.notes[this.globalsService.notes.length - 1][notesInLastArray - 1]));
        }
      }
    }
  }

  constructor(private globalsService: GlobalsService,
              private midiConversionService: MidiConversionService) { }
}
