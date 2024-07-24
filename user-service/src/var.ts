export const Usage = {
  eventLoopDelay: Infinity,
  eventLoopUtilized: 0,
};

export const isUnderPressure = () => {
  return Usage.eventLoopDelay > 200 || Usage.eventLoopUtilized > 0.98;
};
