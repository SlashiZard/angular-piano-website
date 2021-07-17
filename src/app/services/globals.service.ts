import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {
  // ----------------------------------------------------------------------------------
  // Global Variables
  // ----------------------------------------------------------------------------------
  DURATIONS = [1, 1.5, 2, 3, 4, 6, 8, 16, 32];
  DURATIONS_IN_QLS = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.125];

  /* Note duration should be dependant on BPM, allow user to enter a BPM value with a Flask form. */
  /* Put in Score.js */
  bpm = 100;
  beatsInMeasure = 4;

  scoreDuration = 0;
  measureDuration = 0;

  staveWidth = 250;
  staveHeight = 200;

  staveX = 10 + this.staveWidth;
  staveY = 40;

  // baseWidth = document.querySelector<HTMLElement>(".base")!.offsetWidth;
  baseWidth = 0;
  stavesPerRow = 0;

  // ----------------------------------------------------------------------------------
  // Vexflow Global Variables
  // ----------------------------------------------------------------------------------

  /* Store staves, played notes and ties here. */
  staves: any = [];
  notes: any = [[]];
  ties: any = [];

  /* Keep track of pressed notes and their values. Initialize the 128 midi values with 0. */
  velocities = Array(128).fill(0);
  noteTimestamps = Array(128).fill(0);
  currentlyPressing = 0;

  // ----------------------------------------------------------------------------------
  // Scale Variables
  // ----------------------------------------------------------------------------------

  /* Put in Scale.js */
  sharpScalesNames = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
  sharpScales = [
    [1, 3, 6, 8, 10],
    [1, 3, 5, 8, 10],
    [0, 3, 5, 8, 10],
    [0, 3, 5, "7n", 10],
    [0, "2n", 5, "7n", 10],
    [0, "2n", 5, "7n", "9n"],
    [0, "2n", "4*", 5, "5-", "7n", "9n"],
    ["0-", 0, "2n", "4*", 5, "5-", "7n", "9n", "11*"]
  ];

  flatScalesNames = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
  flatScales = [
    [1, 3, 6, 8, 10],
    [1, 3, 6, 8, "10-", 11],
    [1, "3-", 4, 6, 8, "10-", 11],
    [1, "3-", 4, 6, "8-", "9n", "10-", 11],
    ["1-", "2n", "3-", 4, 6, "8-", "9n", "10-", 11],
    ["1-", "2n", "3-", 4, "6-", "7n", "8-", "9n", "10-", 11],
    ["1-", "2n", "3-", 4, "6-", "7n", "8-", "9n", "10-", "11-", "0n"],
    ["1-", "2n", "3-", "4-", "5n", "6-", "7n", "8-", "9n", "10-", "11-", "0n"]
  ];

  scaleType = "sharps";
  currentKeySignature = this.sharpScalesNames[0];
  currentScale = this.sharpScales[0];

  renderer: Vex.Flow.Renderer | any;

  reset() {
    this.scoreDuration = 0;
    this.measureDuration = 0;
    this.staves = [];
    this.notes = [[]];
    this.ties = [];
    this.velocities = Array(128).fill(0);
    this.noteTimestamps = Array(128).fill(0);
    this.currentlyPressing = 0;
    this.staveX = 10 + this.staveWidth;
    this.staveY = 40;
  }

  setVelocity(index: number, value: number) {
    this.velocities[index] = value;
  }

  setScale(scaleType: string, scaleIndex: number) {
    if ((scaleType != "sharps" && scaleType != "flats") || scaleIndex < 0 || scaleIndex > this.sharpScales.length) {
      return;
    }
  
    this.scaleType = scaleType;

    if (this.scaleType == "sharps") {
      this.currentKeySignature = this.sharpScalesNames[scaleIndex];
      this.currentScale = this.sharpScales[scaleIndex];
    
    // if scaleType is flats:
    } else {
      this.currentKeySignature = this.flatScalesNames[scaleIndex];
      this.currentScale = this.flatScales[scaleIndex];
    }
  }

  constructor() { }

  // const entriesObservable = new Observable((observer) => {

  // });
}
