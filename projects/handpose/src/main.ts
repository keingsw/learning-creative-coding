import p5 from "p5";

const sketch = (p: p5) => {
  let handPose: any;
  let video: any;
  let hands: any[] = [];

  let handPoseReady = false;

  p.preload = () => {
    handPose = window.ml5.handPose(handleHandPoseReady);
  };

  p.setup = () => {
    p.createCanvas(640, 480);

    video = p.createCapture("video");
    video.size(640, 480);
    video.hide();

    startDetectWhenReady();
  };

  p.draw = () => {
    p.image(video, 0, 0, 640, 480);

    for (const hand of hands) {
      for (const keypoint of hand.keypoints) {
        p.fill(0, 255, 0);
        p.noStroke();
        p.circle(keypoint.x, keypoint.y, 10);
      }
    }
  };

  function gotHands(results: any[]) {
    hands = results;
  }

  function handleHandPoseReady() {
    handPoseReady = true;
  }

  let interval: number;
  function startDetectWhenReady() {
    interval = setInterval(() => {
      if (handPoseReady) {
        clearInterval(interval);
        handPose.detectStart(video, gotHands);
      }
    }, 1000);
  }
};

new p5(sketch);
