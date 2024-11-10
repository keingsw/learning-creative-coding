import "./index.css";
import p5 from "p5";
import "p5/lib/addons/p5.sound";

const sketch = (p: p5) => {
  const CANVAS = "canvas";
  const CONTROLLERS = "controllers";

  const canvasWidth = 800;
  const canvasHeight = canvasWidth / 2;

  const controllerPositionY = canvasHeight * 1.2;

  const playLineWidth = 3;
  let playLineX = canvasWidth / 2;

  let song: p5.SoundFile;
  let amp: p5.Amplitude;
  let volumeHistory: (undefined | number)[] = [];

  p.preload = () => {
    song = p.loadSound("./this-dot-kp.mp3");
    initializeHistory();
  };

  p.setup = () => {
    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(CANVAS);

    amp = new p5.Amplitude();

    putToggleButton();
    putModeSelector();
  };

  p.draw = () => {
    const volume = amp.getLevel();

    p.background(0);

    recordHistory(volume);
    drawPlayLine();
    drawVolumeLine();
  };

  p.mouseDragged = () => {
    updatePlayLineX();
  };

  function putToggleButton() {
    const playButton = p.createButton("toggle");
    playButton.parent(CONTROLLERS);
    playButton.mouseClicked(toggleMusic);
  }

  function toggleMusic() {
    if (song?.isPlaying()) {
      song?.stop();
      initializeHistory();
    } else {
      song?.loop();
    }
  }

  function putModeSelector() {
    const selector = p.createSelect();
    selector.parent(CONTROLLERS);

    (selector as any).option("linear", "Linear");
    (selector as any).option("circular", "Circular");
    (selector as any).selected("Linear");
  }

  function initializeHistory() {
    volumeHistory = [...Array(canvasWidth).keys()].map(() => undefined);
  }

  function recordHistory(volume: number) {
    if (song?.isPlaying()) {
      volumeHistory.push(volume);
    }

    if (volumeHistory.length > canvasWidth) {
      volumeHistory.splice(0, 1);
    }
  }

  function drawPlayLine() {
    if (song?.isPlaying()) {
      p.stroke(255);
      p.strokeWeight(playLineWidth);
      p.line(playLineX, 0, playLineX, canvasHeight);
      p.strokeWeight(1);
    }
  }

  function updatePlayLineX() {
    if (p.mouseY > controllerPositionY) {
      return;
    }

    if (p.mouseX <= 0) {
      playLineX = 0;
    } else if (p.mouseX >= canvasWidth) {
      playLineX = canvasWidth - playLineWidth;
    } else {
      playLineX = p.mouseX;
    }
  }

  function drawVolumeLine() {
    const maxVolume = Math.max(...volumeHistory.filter((v) => v !== undefined));
    const lineHeight = p.map(maxVolume, 0, 1, 0, canvasHeight);

    const LOUD_THRESHOLD = 0.3;
    const REACTIVITY = 3;
    const recentVolumeWasLoud = volumeHistory
      .slice(volumeHistory.length - REACTIVITY)
      .some((v) => v && v > LOUD_THRESHOLD);

    if (song?.isPlaying()) {
      p.noFill();
      p.translate(0, -(canvasHeight / 2) + lineHeight / 2);

      const dots = volumeHistory.slice(playLineX);
      const lines = volumeHistory.slice(0, playLineX);

      // spread volume
      p.beginShape(p.POINTS);
      for (const [index, volume] of dots.entries()) {
        if (volume) {
          const x = canvasWidth - dots.length + index;
          let y = p.map(volume, 0, 1, canvasHeight, 0);
          p.stroke(214);
          p.curveVertex(x, y);

          drawNoise({ x, y, intensity: recentVolumeWasLoud ? 10 : 3 });
        }
      }
      p.endShape();

      // line volume
      p.beginShape(p.TESS);
      for (const [index, volume] of lines.entries()) {
        if (volume) {
          const x = canvasWidth - lines.length + index - dots.length;
          const y = p.map(volume, 0, 1, canvasHeight, 0);
          p.stroke(255);
          p.curveVertex(x, y);

          const showNoise = Math.random() < 0.5;
          if (showNoise) {
            drawNoise({
              x,
              y,
              intensity: 3,
              shiftX: getRandomInt(recentVolumeWasLoud ? 150 : 50),
              shiftY: getRandomInt(recentVolumeWasLoud ? 150 : 50),
            });
          }
        }
      }
      p.endShape();
    }
  }

  function drawNoise({
    x: originX,
    y: originY,
    intensity = 10,
    shiftX = 100,
    shiftY = 100,
  }: {
    x: number;
    y: number;
    intensity?: number;
    shiftX?: number;
    shiftY?: number;
  }) {
    for (const _ of [...Array(intensity).keys()]) {
      const RGB = getRandomRBG();
      const randX = getShiftedPosition(shiftX);
      const randY = getShiftedPosition(shiftY);

      p.stroke(...RGB);
      p.curveVertex(originX + randX, originY + randY);
    }
  }
};

function getShiftedPosition(max: number) {
  const plusOrMinusX = addOrSubtract();
  return getRandomInt(max) * plusOrMinusX;
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function getRandomRBG(): [number, number, number] {
  const R = Math.floor(Math.random() * 255);
  const G = Math.floor(Math.random() * 255);
  const B = Math.floor(Math.random() * 255);
  return [R, G, B];
}

function addOrSubtract() {
  return Math.random() < 0.5 ? -1 : 1;
}

new p5(sketch);
