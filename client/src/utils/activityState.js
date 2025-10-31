export const isUnregisteredOrParticipated = (activity) => {
  const state = activity?.state ?? 'guest';
  if (state === 'guest') return true;
  return state.startsWith('feedback_');
};

export default isUnregisteredOrParticipated;
