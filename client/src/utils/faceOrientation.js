const averagePoint = (points = []) => {
  if (!points.length) return { x: 0, y: 0 };
  const total = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
};

const euclideanDistance = (a, b) => {
  if (!a || !b) return 0;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return 0;
    let sum = 0;
    for (let i = 0; i < a.length; i += 1) {
      const ax = Number(a[i]) || 0;
      const bx = Number(b[i]) || 0;
      const diff = ax - bx;
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  const ax = Number(a.x) || 0;
  const ay = Number(a.y) || 0;
  const bx = Number(b.x) || 0;
  const by = Number(b.y) || 0;

  return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const estimateFaceOrientation = (landmarks, { mirrored = true } = {}) => {
  if (!landmarks) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const leftEye = landmarks.getLeftEye?.() ?? [];
  const rightEye = landmarks.getRightEye?.() ?? [];
  const nose = landmarks.getNose?.() ?? [];
  const jaw = landmarks.getJawOutline?.() ?? [];

  if (!leftEye.length || !rightEye.length || !nose.length || !jaw.length) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const leftEyeCenter = averagePoint(leftEye);
  const rightEyeCenter = averagePoint(rightEye);
  const eyesCenter = {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
  };

  const faceWidth = euclideanDistance(leftEyeCenter, rightEyeCenter) || 1;
  const noseTip = nose[nose.length - 1];
  const jawBottom = jaw[8] ?? jaw[jaw.length - 1];
  const noseBridge = nose[0];

  const rawYaw = (noseTip.x - eyesCenter.x) / faceWidth;
  const yaw = mirrored ? -rawYaw : rawYaw;

  const verticalSpan = (jawBottom?.y ?? eyesCenter.y + faceWidth) - eyesCenter.y || 1;
  const pitchReference = (noseTip.y - eyesCenter.y) / verticalSpan;
  const bridgeReference = (noseBridge?.y ? (noseBridge.y - eyesCenter.y) / verticalSpan : 0);
  const rawPitch = pitchReference - 0.35 - bridgeReference * 0.15;
  const pitch = clamp(rawPitch, -0.8, 0.8);

  const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x);

  return {
    yaw: clamp(Number.isFinite(yaw) ? yaw : 0, -1, 1),
    pitch,
    roll: clamp(Number.isFinite(roll) ? roll : 0, -Math.PI, Math.PI),
  };
};

export default {
  estimateFaceOrientation,
};
