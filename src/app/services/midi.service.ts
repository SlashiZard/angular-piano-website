import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MIDIService {
  // ----------------------------------------------------------------------------------
  // Global Variables
  // ----------------------------------------------------------------------------------
  public DURATIONS = [1, 1.5, 2, 3, 4, 6, 8, 16, 32];
  public DURATIONS_IN_QLS = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.125];

  /* Note duration should be dependant on BPM, allow user to enter a BPM value with a Flask form. */
  /* Put in Score.js */
  public bpm = 100;
  public beatsInMeasure = 4;

  public scoreDuration = 0;
  public measureDuration = 0;

  public staveWidth = 250;
  public staveHeight = 200;

  public staveX = 10 + this.staveWidth;
  public staveY = 40;

  // public baseWidth = document.querySelector<HTMLElement>(".base")!.offsetWidth;
  public baseWidth = 0;
  public stavesPerRow = Math.floor(this.baseWidth / this.staveWidth);

  // ----------------------------------------------------------------------------------
  // Vexflow Global Variables
  // ----------------------------------------------------------------------------------

  /* Store staves, played notes and ties here. */
  public staves = [];
  public notes = [[]];
  public ties = [];

  /* Keep track of pressed notes and their values. Initialize the 128 midi values with 0. */
  public velocities = Array(128).fill(0);
  public noteTimestamps = Array(128).fill(0);
  public currentlyPressing = 0;

  // ----------------------------------------------------------------------------------
  // Scale Variables
  // ----------------------------------------------------------------------------------

  /* Put in Scale.js */
  public sharpScalesNames = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
  public sharpScales = [
    [1, 3, 6, 8, 10],
    [1, 3, 5, 8, 10],
    [0, 3, 5, 8, 10],
    [0, 3, 5, "7n", 10],
    [0, "2n", 5, "7n", 10],
    [0, "2n", 5, "7n", "9n"],
    [0, "2n", "4*", 5, "5-", "7n", "9n"],
    ["0-", 0, "2n", "4*", 5, "5-", "7n", "9n", "11*"]
  ];

  public flatScalesNames = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
  public flatScales = [
    [1, 3, 6, 8, 10],
    [1, 3, 6, 8, "10-", 11],
    [1, "3-", 4, 6, 8, "10-", 11],
    [1, "3-", 4, 6, "8-", "9n", "10-", 11],
    ["1-", "2n", "3-", 4, 6, "8-", "9n", "10-", 11],
    ["1-", "2n", "3-", 4, "6-", "7n", "8-", "9n", "10-", 11],
    ["1-", "2n", "3-", 4, "6-", "7n", "8-", "9n", "10-", "11-", "0n"],
    ["1-", "2n", "3-", "4-", "5n", "6-", "7n", "8-", "9n", "10-", "11-", "0n"]
  ];

  public scaleType = "sharps";
  public currentKeySignature = this.sharpScalesNames[0];
  public currentScale = this.sharpScales[0];

  constructor() { }

  public setBaseWidth(width: number) {
    this.baseWidth = width;
  }
}
