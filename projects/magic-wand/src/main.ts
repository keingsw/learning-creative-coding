import "./index.css";
import p5 from "p5";
import "p5/lib/addons/p5.sound";

const sketch = (p: p5) => {
  const CANVAS = "canvas";
  const CONTROLLERS = "controllers";

  const canvasWidth = 800;
  const canvasHeight = canvasWidth / 2;

  const controllerPositionY = canvasHeight * 1.2;

  const magicBorderWidth = 3;
  let magicBorderX = canvasWidth / 2;

  let song: p5.SoundFile;
  let amp: p5.Amplitude;
  let modeSelector: p5.Element;
  let playButton: p5.Element;
  let stopButton: p5.Element;
  let volumeHistory: (undefined | number)[] = [];

  p.preload = () => {
    song = p.loadSound("./this-dot-kp.mp3");
    initializeHistory();
  };

  p.setup = () => {
    p.angleMode(p.DEGREES);

    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(CANVAS);

    amp = new p5.Amplitude();

    putToggleButton();
    putModeSelector();
  };

  p.draw = () => {
    const volume = amp.getLevel();
    const mode = (modeSelector as any).selected();

    p.background(0);
    updateButtonVisibility();

    recordHistory(volume);

    if (mode === "circular") {
      drawMagicBorderCircle();
      drawMusicInCircular();
    } else {
      drawMagicBorderLine();
      drawMusicInLinear();
    }
  };

  p.mouseDragged = () => {
    updatePlayLineX();
  };

  function putToggleButton() {
    playButton = p.createButton("Play");
    playButton.parent(CONTROLLERS);
    playButton.mouseClicked(toggleMusic);

    stopButton = p.createButton("Stop");
    stopButton.parent(CONTROLLERS);
    stopButton.mouseClicked(toggleMusic);
    stopButton.hide();
  }

  function updateButtonVisibility() {
    if (song?.isPlaying()) {
      playButton.hide();
      stopButton.show();
    } else {
      playButton.show();
      stopButton.hide();
    }
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
    modeSelector = p.createSelect();
    modeSelector.parent(CONTROLLERS);

    (modeSelector as any).option("linear");
    (modeSelector as any).option("circular");
    (modeSelector as any).selected("linear");
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

  function drawMagicBorderLine() {
    if (song?.isPlaying()) {
      p.stroke(255);
      p.strokeWeight(magicBorderWidth);
      p.line(magicBorderX, 0, magicBorderX, canvasHeight);
      p.strokeWeight(1);
    }
  }

  function drawMagicBorderCircle() {
    const diameter = getMagicBorderCircleDiameter();

    if (song?.isPlaying()) {
      p.stroke(255);
      p.strokeWeight(magicBorderWidth);
      p.circle(canvasWidth / 2, canvasHeight / 2, diameter);
      p.strokeWeight(1);
    }
  }

  function updatePlayLineX() {
    if (p.mouseY > controllerPositionY) {
      return;
    }

    if (p.mouseX <= 0) {
      magicBorderX = 0;
    } else if (p.mouseX >= canvasWidth) {
      magicBorderX = canvasWidth - magicBorderWidth;
    } else {
      magicBorderX = p.mouseX;
    }
  }

  function drawMusicInLinear() {
    const maxVolume = Math.max(...volumeHistory.filter((v) => v !== undefined));
    const maxHeight = p.map(maxVolume, 0, 1, 0, canvasHeight);

    const wasLoud = recentVolumeWasLoud();

    if (song?.isPlaying()) {
      p.noFill();
      p.translate(0, -(canvasHeight / 2) + maxHeight / 2);

      const dots = volumeHistory.slice(magicBorderX);
      const lines = volumeHistory.slice(0, magicBorderX);

      p.beginShape(p.POINTS);
      for (const [index, volume] of dots.entries()) {
        if (volume) {
          const x = canvasWidth - dots.length + index;
          let y = p.map(volume, 0, 1, canvasHeight, 0);
          p.stroke(214);
          p.curveVertex(x, y);

          drawNoise({ x, y, intensity: wasLoud ? 10 : 3 });
        }
      }
      p.endShape();

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
              shiftX: getRandomInt(wasLoud ? 150 : 50),
              shiftY: getRandomInt(wasLoud ? 150 : 50),
            });
          }
        }
      }
      p.endShape();
    }
  }

  function drawMusicInCircular() {
    const diameter = getMagicBorderCircleDiameter();
    const playCircleR = diameter / 2;

    const translateX = canvasWidth / 2;
    const translateY = canvasHeight / 2;

    const wasLoud = recentVolumeWasLoud();

    if (song?.isPlaying()) {
      p.noFill();
      p.translate(translateX, translateY);

      p.beginShape(p.POINTS);
      for (const [index, volume] of volumeHistory.entries()) {
        if (volume) {
          const time = Math.floor(index / 360);
          const degree = index - 360 * time;

          const r = p.map(volume, 0, 1, 10, canvasHeight / 2);
          const x = r * p.cos(degree);
          const y = r * p.sin(degree);

          const playCircleX = playCircleR * p.cos(degree);
          const playCircleY = playCircleR * p.sin(degree);

          if (
            Math.abs(x) > Math.abs(playCircleX) &&
            Math.abs(y) > Math.abs(playCircleY)
          ) {
            continue;
          }

          p.stroke(214);
          p.curveVertex(x, y);

          drawNoise({ x, y, intensity: wasLoud ? 10 : 3 });
        }
      }
      p.endShape();

      p.beginShape(p.TESS);
      for (const [index, volume] of volumeHistory.entries()) {
        if (volume) {
          const time = Math.floor(index / 360);
          const degree = index - 360 * time;

          const r = p.map(volume, 0, 1, 10, canvasHeight);
          const x = r * p.cos(degree);
          const y = r * p.sin(degree);

          const playCircleX = playCircleR * p.cos(degree);
          const playCircleY = playCircleR * p.sin(degree);

          if (
            Math.abs(x) <= Math.abs(playCircleX) &&
            Math.abs(y) <= Math.abs(playCircleY)
          ) {
            continue;
          }

          p.stroke(255);

          p.curveVertex(x, y);

          const showNoise = Math.random() < 0.5;
          if (showNoise) {
            drawNoise({
              x,
              y,
              intensity: 1,
              shiftX: getRandomInt(wasLoud ? 150 : 50),
              shiftY: getRandomInt(wasLoud ? 150 : 50),
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

  function getMagicBorderCircleDiameter() {
    return p.map(magicBorderX, 0, canvasWidth, 0, canvasHeight);
  }

  function recentVolumeWasLoud() {
    const LOUD_THRESHOLD = 0.3;
    const REACTIVITY = 3;
    return volumeHistory
      .slice(volumeHistory.length - REACTIVITY)
      .some((v) => v && v > LOUD_THRESHOLD);
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
