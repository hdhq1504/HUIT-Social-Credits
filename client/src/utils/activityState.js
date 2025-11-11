export const isRegisterableActivity = (activity) => {
  const state = activity?.state ?? 'guest';
  return state === 'guest';
};

export default isRegisterableActivity;
