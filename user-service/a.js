const assert = require('node:assert');
const { monitorEventLoopDelay } = require('node:perf_hooks');
const { eventLoopUtilization } = require('node:perf_hooks').performance;

const SERVICE_UNAVAILABLE = 503;
const createError = (msg = 'Service Unavailable') => new Error(msg);

const TYPE_EVENT_LOOP_DELAY = 'eventLoopDelay';
const TYPE_EVENT_LOOP_UTILIZATION = 'eventLoopUtilization';

function getSampleInterval(value, eventLoopResolution) {
  const defaultValue = monitorEventLoopDelay ? 1000 : 5;
  const sampleInterval = value || defaultValue;
  return monitorEventLoopDelay
    ? Math.max(eventLoopResolution, sampleInterval)
    : sampleInterval;
}

async function fastifyUnderPressure(fastify, opts) {
  opts = opts || {};

  const resolution = 10;
  const sampleInterval = getSampleInterval(opts.sampleInterval, resolution);
  const maxEventLoopDelay = opts.maxEventLoopDelay || 0;
  const UnderPressureError = opts.customError || createError(opts.message);
  const maxEventLoopUtilization = opts.maxEventLoopUtilization || 0;
  const pressureHandler = opts.pressureHandler;

  const checkMaxEventLoopDelay = maxEventLoopDelay > 0;
  const checkMaxEventLoopUtilization = eventLoopUtilization
    ? maxEventLoopUtilization > 0
    : false;

  let eventLoopDelay = 0;
  let lastCheck;
  let histogram;
  let elu;
  let eventLoopUtilized = 0;

  if (monitorEventLoopDelay) {
    histogram = monitorEventLoopDelay({ resolution });
    histogram.enable();
  } else {
    lastCheck = now();
  }

  if (eventLoopUtilization) {
    elu = eventLoopUtilization();
  }

  fastify.decorate('memoryUsage', memoryUsage);
  fastify.decorate('isUnderPressure', isUnderPressure);

  const timer = setTimeout(beginMemoryUsageUpdate, sampleInterval);
  timer.refresh();

  fastify.addHook('onClose', onClose);

  if (
    checkMaxEventLoopUtilization === false &&
    checkMaxEventLoopDelay === false
  ) {
    return;
  }

  const underPressureError = new UnderPressureError();
  const retryAfter = opts.retryAfter || 10;

  fastify.addHook('onRequest', onRequest);

  function updateEventLoopDelay() {
    if (histogram) {
      eventLoopDelay = Math.max(0, histogram.mean / 1e6 - resolution);
      if (Number.isNaN(eventLoopDelay)) eventLoopDelay = Infinity;
      histogram.reset();
    } else {
      const toCheck = now();
      eventLoopDelay = Math.max(0, toCheck - lastCheck - sampleInterval);
      lastCheck = toCheck;
    }
  }

  function updateEventLoopUtilization() {
    if (elu) {
      eventLoopUtilized = eventLoopUtilization(elu).utilization;
    } else {
      eventLoopUtilized = 0;
    }
  }

  function beginMemoryUsageUpdate() {
    updateEventLoopDelay();
    updateEventLoopUtilization();
    timer.refresh();
  }

  // function updateMemoryUsage() {
  //   updateEventLoopDelay();
  //   updateEventLoopUtilization();
  // }

  function isUnderPressure() {
    if (checkMaxEventLoopDelay && eventLoopDelay > maxEventLoopDelay) {
      return true;
    }

    if (
      checkMaxEventLoopUtilization &&
      eventLoopUtilized > maxEventLoopUtilization
    ) {
      return true;
    }

    return false;
  }

  function onRequest(req, reply, next) {
    if (checkMaxEventLoopDelay && eventLoopDelay > maxEventLoopDelay) {
      handlePressure(req, reply, next, TYPE_EVENT_LOOP_DELAY, eventLoopDelay);
      return;
    }

    if (
      checkMaxEventLoopUtilization &&
      eventLoopUtilized > maxEventLoopUtilization
    ) {
      handlePressure(
        req,
        reply,
        next,
        TYPE_EVENT_LOOP_UTILIZATION,
        eventLoopUtilized
      );
      return;
    }

    next();
  }

  function handlePressure(req, reply, next, type, value) {
    if (typeof pressureHandler === 'function') {
      const result = pressureHandler(req, reply, type, value);
      if (result instanceof Promise) {
        result.then(() => next(), next);
      } else if (result == null) {
        next();
      } else {
        reply.send(result);
      }
    } else {
      reply.status(SERVICE_UNAVAILABLE).header('Retry-After', retryAfter);
      next(underPressureError);
    }
  }

  function memoryUsage() {
    return {
      eventLoopDelay,
      eventLoopUtilized,
    };
  }

  function onClose(fastify, done) {
    clearInterval(timer);
    done();
  }
}

function now() {
  const ts = process.hrtime();
  return ts[0] * 1e3 + ts[1] / 1e6;
}
