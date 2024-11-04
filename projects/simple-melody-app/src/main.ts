import p5 from "p5";
import "p5/lib/addons/p5.sound";

const octave4NoteAndFq = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392,
  "G#": 415.3,
  A: 440,
  "A#": 466.16,
  B: 493.88,
} as const;

const getPythagoreanMajorScale = (baseFq: number) => [
  baseFq,
  (baseFq * 9) / 8,
  (baseFq * 81) / 64,
  (baseFq * 4) / 3,
  (baseFq * 3) / 2,
  (baseFq * 27) / 16,
  (baseFq * 243) / 128,
  baseFq * 2,
];

// const getJustMajorScale = (baseFq: number) => [
//   baseFq,
//   (baseFq * 9) / 8,
//   (baseFq * 5) / 4,
//   (baseFq * 4) / 3,
//   (baseFq * 3) / 2,
//   (baseFq * 5) / 3,
//   (baseFq * 15) / 8,
//   baseFq * 2,
// ];

type Metadata = {
  scale: keyof typeof octave4NoteAndFq;
  record: number[];
  tempo: number;
};

const sketch = (p: p5) => {
  let scaleSelector: p5.Element;
  let oscillators: p5.Oscillator[] = [];

  const melody: Metadata = {
    scale: "C",
    record: [],
    tempo: 120,
  };

  let canvasWidth = 400;

  const noteDuration = 60 / melody.tempo;

  p.setup = () => {
    p.createCanvas(canvasWidth, canvasWidth * 3);
    p.colorMode(p.HSB);

    putPlayButton();
    putResetButton();
    putScaleSelector();

    prepareOscillators();
  };

  p.draw = () => {
    p.background(220);

    drawKeys();
    (scaleSelector as any).changed(handleScaleChange);
  };

  p.mousePressed = () => {
    record();
  };

  function putPlayButton() {
    const playButton = p.createButton("Play");
    playButton.position(canvasWidth * 0.2, 540);
    playButton.mouseClicked(play);
  }

  function putResetButton() {
    const playButton = p.createButton("reset");
    playButton.position(canvasWidth * 0.4, 540);
    playButton.mouseClicked(resetRecord);
  }

  function putScaleSelector() {
    scaleSelector = p.createSelect();
    scaleSelector.position(10, 455);

    for (const [note] of Object.entries(octave4NoteAndFq)) {
      (scaleSelector as any).option(note);
    }
  }

  function handleScaleChange() {
    const scale = (scaleSelector as any).selected();
    if (Object.keys(octave4NoteAndFq).includes(scale)) {
      melody.scale = scale;
      resetRecord();
      prepareOscillators();
    } else {
      throw new Error(`invalid scale selected \`${scale}\``);
    }
  }

  function prepareOscillators() {
    const { scale } = melody;
    const notes = getPythagoreanMajorScale(octave4NoteAndFq[scale]);
    oscillators = notes.map((fq) => new p5.Oscillator(fq));
  }

  function playNote(index: number) {
    const osc = oscillators[index];

    if (!(osc as any).started) {
      osc.start();
      osc.amp(1, 0.01);
    }

    setTimeout(() => stopNote(index), noteDuration * 1000);
  }

  function stopNote(index: number) {
    const osc = oscillators[index];

    osc.amp(0, 0.01);
    osc.stop(0);
  }

  function play() {
    for (let [index, note] of melody.record.entries()) {
      setTimeout(() => playNote(note), noteDuration * 1000 * index);
    }
  }

  function getNotes() {
    return getPythagoreanMajorScale(octave4NoteAndFq[melody.scale]);
  }

  function getKeyWidth() {
    const numOfNotesInScale = getPythagoreanMajorScale(
      octave4NoteAndFq[melody.scale]
    ).length;

    return canvasWidth / numOfNotesInScale;
  }

  function getKeyPosition(index: number) {
    const keyWidth = getKeyWidth();

    const x = index * keyWidth;
    const y = keyWidth * 3;

    return { x, y };
  }

  function drawKeys() {
    const keyWidth = getKeyWidth();
    const numOfNotes = getNotes().length;

    for (let index = 0; index < numOfNotes; index++) {
      const osc = oscillators[index];
      const { x, y } = getKeyPosition(index);

      if ((osc as any).started) {
        const h = p.map(index, 0, numOfNotes, 0, 360);
        p.fill(h, 100, 100);
      } else {
        p.fill("white");
      }

      p.rect(x, y, keyWidth, keyWidth * 2, 4);
    }
  }

  function record() {
    const keyWidth = getKeyWidth();
    const numOfNotes = getNotes().length;

    for (let index = 0; index < numOfNotes; index++) {
      const { x, y } = getKeyPosition(index);
      if (
        p.mouseX > x &&
        p.mouseX < x + keyWidth &&
        p.mouseY > y &&
        p.mouseY < y + keyWidth * 2
      ) {
        melody.record = [...melody.record, index];
        playNote(index);
      }
    }
  }

  function resetRecord() {
    melody.record = [];
  }
};

new p5(sketch);
