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
  const dx = (a.x ?? 0) - (b.x ?? 0);
  const dy = (a.y ?? 0) - (b.y ?? 0);
  return Math.sqrt(dx * dx + dy * dy);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Estimate yaw/pitch orientation for the current face landmarks.
 * Returns values roughly in range [-1, 1] where:
 *   - yaw > 0: face rotated towards the left shoulder (from viewer perspective)
 *   - yaw < 0: face rotated towards the right shoulder
 *   - pitch > 0: face looking down, pitch < 0: face looking up
 */
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
