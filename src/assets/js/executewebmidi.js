// ----------------------------------------------------------------------------------
// Global Variables
// ----------------------------------------------------------------------------------

/* These are the supported note durations, update as necessary. */
const DURATIONS = [1, 1.5, 2, 3, 4, 6, 8, 16, 32];
const DURATIONS_IN_QLS = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.125];

/* Note duration should be dependant on BPM, allow user to enter a BPM value with a Flask form. */
/* Put in Score.js */
var bpm = 100;
var beatsInMeasure = 4;

var scoreDuration = 0;
var measureDuration = 0;

var staveWidth = 250;
var staveHeight = 200;

var staveX = 10 + staveWidth;
var staveY = 40;

var baseWidth = document.querySelector(".base").offsetWidth;
var stavesPerRow = Math.floor(baseWidth / staveWidth);

// ----------------------------------------------------------------------------------
// Vexflow Global Variables
// ----------------------------------------------------------------------------------

/* Store staves, played notes and ties here. */
var staves = [];
var notes = [[]];
var ties = [];

/* Keep track of pressed notes and their values. Initialize the 128 midi values with 0. */
var velocities = Array(128).fill(0);
var noteTimestamps = Array(128).fill(0);
var currentlyPressing = 0;

// ----------------------------------------------------------------------------------
// Scale Variables
// ----------------------------------------------------------------------------------

/* Put in Scale.js */
var sharpScalesNames = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
var sharpScales = [
  [1, 3, 6, 8, 10],
  [1, 3, 5, 8, 10],
  [0, 3, 5, 8, 10],
  [0, 3, 5, "7n", 10],
  [0, "2n", 5, "7n", 10],
  [0, "2n", 5, "7n", "9n"],
  [0, "2n", "4*", 5, "5-", "7n", "9n"],
  ["0-", 0, "2n", "4*", 5, "5-", "7n", "9n", "11*"]
];

var flatScalesNames = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
var flatScales = [
  [1, 3, 6, 8, 10],
  [1, 3, 6, 8, "10-", 11],
  [1, "3-", 4, 6, 8, "10-", 11],
  [1, "3-", 4, 6, "8-", "9n", "10-", 11],
  ["1-", "2n", "3-", 4, 6, "8-", "9n", "10-", 11],
  ["1-", "2n", "3-", 4, "6-", "7n", "8-", "9n", "10-", 11],
  ["1-", "2n", "3-", 4, "6-", "7n", "8-", "9n", "10-", "11-", "0n"],
  ["1-", "2n", "3-", "4-", "5n", "6-", "7n", "8-", "9n", "10-", "11-", "0n"]
];

var scaleType = "sharps";
var currentKeySignature = sharpScalesNames[0];
var currentScale = sharpScales[0];

// ----------------------------------------------------------------------------------
// Math Functions
// ----------------------------------------------------------------------------------

/* Returns True if n is (a whole number and) a power of two. */
function power_of_2(n) {
  return (n - Math.floor(n) === 0) && (n && (n & (n - 1)) === 0);
}

// ----------------------------------------------------------------------------------
// VexFlow library setup
// ----------------------------------------------------------------------------------

const VF = Vex.Flow;

var vexDiv = document.getElementById("vex")
var renderer = new VF.Renderer(vexDiv, VF.Renderer.Backends.SVG);
renderer.resize(stavesPerRow * 500, 2000);
var context = renderer.getContext();

/* Create the first stave and draw it. */
var stave = new VF.Stave(10, 40, staveWidth);
stave.addClef("treble").addTimeSignature("4/4").addKeySignature(currentKeySignature);
staves.push(stave);
stave.setContext(context).draw();

// ----------------------------------------------------------------------------------
// VexFlow Functions
// ----------------------------------------------------------------------------------

function create_new_tie(firstNote, lastNote) {
  return new VF.StaveTie({
    first_note: firstNote,
    last_note: lastNote,
    first_indices: [0],
    last_indices: [0]
  })
}

function create_new_stave() {
  var new_stave = new VF.Stave(staveX, staveY, staveWidth);

  /* If this stave is the first stave of a row. */
  if (staves.length % stavesPerRow === 0) {
    new_stave.addClef("treble").addTimeSignature("4/4").addKeySignature(currentKeySignature);
  }

  /* If the stave is the last stave of a row. */
  if (staves.length % stavesPerRow === (stavesPerRow - 1)) {
    staveX -= staveWidth * (stavesPerRow - 1);
    staveY += staveHeight;
  } else {
    staveX += staveWidth;
  }

  staves.push(new_stave);
}

/* Returns a list of note durations, which might be seperated by strings of "new".
 * Splits a single duration into multiple notes and also indicates where new staves should start.
 */
function list_new_notes(duration, durationLeft) {
  durationLeft = Math.min(durationLeft, duration);

  var newNotes = [];

  /* const DURATIONS =        [1, 1.5,   2,   3, 4,    6,   8,   16,    32]; */
  /* const DURATIONS_IN_QLS = [4,   3,   2, 1.5, 1, 0.75, 0.5, 0.25, 0.125]; */

  while (duration > 0) {
    while (durationLeft > 0) {
      for (let i = 0; i < DURATIONS_IN_QLS.length; i++) {
        if (DURATIONS_IN_QLS[i] <= durationLeft) {
          newNotes.push(DURATIONS[i]);

          durationLeft -= DURATIONS_IN_QLS[i];
          duration -= DURATIONS_IN_QLS[i];

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
      scoreDuration += duration_to_QLs(n);
    }
  }

  /* If the measure ends at the current duration, create a new stave at the end. */
  if (scoreDuration % beatsInMeasure === 0 && newNotes[newNotes.length - 1] !== "new") {
    newNotes.push("new");
  }

  /* Prints the list that is returned. */
  // console.log(newNotes);
  // for (const n of newNotes) {
  //   console.log(n);
  // }

  return newNotes;
}


function draw_notes() {
  document.querySelector("#vex").innerHTML = "";

  renderer = new VF.Renderer(vexDiv, VF.Renderer.Backends.SVG);
  renderer.resize(stavesPerRow * 500, 2000);
  context = renderer.getContext();

  for (let i = 0; i < staves.length; i++) {
    if (notes[i].length == 0) {
      continue;
    }

    stave = staves[i];
    stave.setContext(context).draw();

    Vex.Flow.Formatter.FormatAndDraw(context, staves[i], notes[i]);

    var beams = VF.Beam.generateBeams(notes[i]);
    beams.forEach(function (b) { b.setContext(context).draw() });
  }

  ties.forEach(function (t) { t.setContext(context).draw() });
}

function handle_ties(noteCount) {
  /* Notes only need to be tied if the incoming amount of notes is two or more. */
  if (noteCount > 1) {
    let notesInLastArray = notes[notes.length - 1].length;
    let notesInSecondLastArray = staves.length > 1 ? notes[notes.length - 2].length : undefined;

    /* If the tie must travel vertically to reach the next note, */
    if (staves.length % stavesPerRow === 1 && notesInLastArray === 1) {
      /* Starting at the last note in the last array of the previous row, the tie goes out to the right. */
      ties.push(create_new_tie(notes[notes.length - 2][notesInSecondLastArray - 1], undefined));

      /* The tie goes out to the left, starting at the last note in the last array. */
      ties.push(create_new_tie(undefined, notes[notes.length - 1][notesInLastArray - 1]));

    /* If the tie only needs to travel horizontally to reach the next note, */
    } else {
      /* If the tie needs to travel across staves, */
      if (notesInLastArray === 1) {
        /* Tie the last note in the second-last array with the last and only note of the last array. */
        ties.push(create_new_tie(notes[notes.length - 2][notesInSecondLastArray - 1], notes[notes.length - 1][notesInLastArray - 1]));
      /* If the tie does not need to travel across staves, */
      } else {
        /* Tie the second-last note with the last note in the last array. */
        ties.push(create_new_tie(notes[notes.length - 1][notesInLastArray - 2], notes[notes.length - 1][notesInLastArray - 1]));
      }
    }
  }
}

function change_scale(newScale) {
  newScale = String(newScale);

  if (sharpScalesNames.indexOf(newScale) > -1) {
    scaleType = "sharps";
    currentKeySignature = newScale;
    currentScale = sharpScales[sharpScalesNames.indexOf(newScale)];

  } else if (flatScalesNames.indexOf(newScale) > -1) {
    scaleType = "flats";
    currentKeySignature = newScale;
    currentScale = flatScales[flatScalesNames.indexOf(newScale)];

  } else {
    console.log("Entered scale value is invalid.")
  }
}

// ----------------------------------------------------------------------------------
// MIDI Conversion Functions
// ----------------------------------------------------------------------------------
function number_to_note(number) {
  const all_notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  return all_notes[number % 12];
}

function number_to_octave(number) {
  return String(Math.floor(number / 12) - 1);
}

/* Returns the duration which lies the closest to the given duration. */
function round_durations(duration) {
  /* const DURATIONS = [1, 1.5, 2, 3, 4, 6, 8, 16, 32]; */
  var return_duration = 1;
  var minDiff = Math.abs(duration - DURATIONS[0]);

  for (const current_duration of DURATIONS) {
    var currentDiff = Math.abs(duration - current_duration);

    if (currentDiff < minDiff) {
      return_duration = current_duration;
      minDiff = currentDiff;
    }
  }

  return String(return_duration);
}

function duration_to_QLs(duration) {
  var duration_index = DURATIONS.indexOf(duration);

  return DURATIONS_IN_QLS[duration_index];
}

function handle_accidental(midiValue) {
  let modValue = midiValue % 12;
  let scaleValue = currentScale.indexOf(String(modValue) + "-");

  if (scaleValue > -1) {
    if (scaleType === "sharps") {
      return "--";
    } else if (scaleType === "flats") {
      return "++";
    }
  }

  scaleValue = currentScale.indexOf(String(modValue) + "n");

  if (scaleValue > -1) {
    return "n";
  }

  scaleValue = currentScale.indexOf(String(modValue) + "*");

  if (scaleValue > -1) {
    if (scaleType === "sharps") {
      return "##";
    } else if (scaleType === "flats") {
      return "bb";
    }
  }

  scaleValue = currentScale.indexOf(modValue);

  if (scaleValue > -1) {
    if (scaleType === "sharps") {
      return "-";
    } else if (scaleType === "flats") {
      return "+";
    }
  }

  return "";
}

function fix_accidental(note, accidental) {
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

// ----------------------------------------------------------------------------------
// Web Midi API
// ----------------------------------------------------------------------------------
navigator.requestMIDIAccess()
  .then(onMIDISuccess, onMIDIFailure);

function midiReady(midi) {
  /* Also react to device changes. */
  midi.addEventListener('statechange', (event) => initDevices(event.target));

  initDevices(midi);
}

function initDevices(midi) {
  /* Reset. */
  midiIn = [];
  midiOut = [];

  /* MIDI devices that send you data. */
  const inputs = midi.inputs.values();
  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    midiIn.push(input.value);
  }

  /* MIDI devices that you send data to. */
  const outputs = midi.outputs.values();
  for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
    midiOut.push(output.value);
  }

  /* Display devices. */
  startListening();
}


/* Start listening to MIDI messages. */
function startListening() {
  for (const input of midiIn) {
    input.addEventListener('midimessage', midiMessageReceived);
  }
}

function onMIDISuccess(midiAccess) {
  for (var input of midiAccess.inputs.values()) {
    input.onmidimessage = getMIDIMessage;
  }
}

function onMIDIFailure() {
  console.log('Could not access your MIDI devices.');
}

function getMIDIMessage(message) {
  var command = message.data[0];
  var note = message.data[1];
  /* A velocity value might not be included with a noteOff command. */
  var velocity = (message.data.length > 2) ? message.data[2] : 0;
  var timestamp = Date.now();

  switch (command) {
    case 144:
      console.log("NoteOn", note);

      if (velocity > 0) {
        // console.log("Velocity is", velocity);
        velocities[note] = velocity;
        // console.log("Timestamp is", timestamp);
        noteTimestamps[note] = timestamp;
      }

      currentlyPressing++;
      break;
    case 128:
      console.log("NoteOff", note);
      console.log(number_to_note(note) + "/" + number_to_octave(note));

      if (velocities[note] === 0) {
        console.log("No velocity detected.");
      } else {
        velocity = velocities[note];
        console.log("Velocity is", velocity);
      }

      var note_duration = (timestamp - noteTimestamps[note]) / (60000 / bpm);
      note_duration = round_durations(1 / note_duration * 4);
      var addedQLs = duration_to_QLs(parseFloat(note_duration));

      /* measureDuration is 2.0 if two quarter notes have been played in the measure. */
      measureDuration = scoreDuration % beatsInMeasure;
      var measureDurationLeft = 4 - measureDuration;

      var newNotes = list_new_notes(addedQLs, measureDurationLeft);
      currentlyPressing--;

      /* Handle the accidentals. */
      var accidental = "";
      var foundAccidental = handle_accidental(note);

      if (foundAccidental != "") {
        var fixResult = fix_accidental(note, foundAccidental);

        note = fixResult[0];
        accidental = fixResult[1];
      }

      var noteCount = 0;

      for (let newNote of newNotes) {
        if (typeof newNote === "number") {
          noteCount++;

          /* Note is of full duration. */
          if (power_of_2(newNote)) {
            notes[notes.length - 1].push(new VF.StaveNote({ keys: [String(number_to_note(note) + "/" + number_to_octave(note))], duration: String(newNote) }));
          /* A dot is needed. */
          } else {
            newNote = String(DURATIONS[DURATIONS.indexOf(parseFloat(newNote)) + 1]);
            notes[notes.length - 1].push(new VF.StaveNote({ keys: [String(number_to_note(note) + "/" + number_to_octave(note))], duration: String(newNote) }).addDot(0));
          }

          /* Add the accidentals. */
          if (accidental != "") {
            let notesInLastArray = notes[notes.length - 1].length;
            let targetNote = notes[notes.length - 1][notesInLastArray - 1];

            targetNote.addAccidental(0, new VF.Accidental(accidental));
          }

          handle_ties(noteCount);
        /* If newNote is string "new". */
        } else {
          create_new_stave();
          notes.push([]);
        }
      }

      draw_notes();

      break;
  }
}
