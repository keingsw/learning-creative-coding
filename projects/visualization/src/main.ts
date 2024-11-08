import p5 from "p5";
import "p5/lib/addons/p5.sound";

const sketch = (p: p5) => {
  const strokeWidth = 1;

  let canvasWidth = 400;
  let canvasHeight = canvasWidth / 2;

  let song: p5.SoundFile;
  let amp: p5.Amplitude;
  let volumeHistory: number[] = [];

  p.preload = () => {
    song = p.loadSound("./this-dot-kp.mp3");
  };

  p.setup = () => {
    p.createCanvas(canvasWidth, canvasHeight);

    amp = new p5.Amplitude();

    putToggleButton();
  };

  p.draw = () => {
    p.background(0);

    const volume = amp.getLevel();

    recordHistory(volume);

    // drawEquilibrium();
    drawPlayLine();
    drawVolumeLine();
  };

  function putToggleButton() {
    const playButton = p.createButton("toggle");
    playButton.position(
      canvasWidth * 0.5 - playButton.width,
      canvasHeight * 1.2
    );
    playButton.mouseClicked(toggleMusic);
  }

  function toggleMusic() {
    if (song.isPlaying()) {
      song.pause();
      volumeHistory = [];
    } else {
      song.play();
    }
  }

  function recordHistory(volume: number) {
    volumeHistory.push(volume);

    if (volumeHistory.length > (canvasWidth / 3) * 2) {
      volumeHistory.splice(0, 1);
    }
  }

  function drawPlayLine() {
    const currentX = volumeHistory.length;

    if (song.isPlaying()) {
      p.stroke(255, 0, 0);
      p.line(currentX, 0, currentX, canvasHeight);
    }
  }

  function drawVolumeLine() {
    const maxVolume = Math.max(...volumeHistory);
    const lineHeight = p.map(maxVolume, 0, 1, 0, canvasHeight);

    if (song.isPlaying()) {
      p.stroke(255);
      p.noFill();

      p.translate(0, -(canvasHeight / 2) + lineHeight / 2);

      p.beginShape(p.TESS);
      for (const [index, volume] of volumeHistory.entries()) {
        let y = p.map(volume, 0, 1, canvasHeight, 0);
        p.vertex(index, y);
      }
      p.endShape();
    }
  }
};

new p5(sketch);
