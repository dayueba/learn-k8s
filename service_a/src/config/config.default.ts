import { MidwayConfig } from '@midwayjs/core';

const formatInfo = function (info) {
  console.log(info);
  const ctx = info.ctx ?? {};
  const data = {
    ts: info.timestamp,
    errorMsg: info.originError,
    projectName: 'Pisces',
    LEVEL: info.LEVEL,
    traceId: ctx.traceId,
    vid: ctx.vid,
    rt: Date.now() - ctx.startTime,
    user_id: ctx?.state?.info?.data?.user_id,
    channel_id: ctx?.state?.info?.data?.channel_id,
  };
  console.log('iiiiiiiiiii', info);
  try {
    let extra = {};
    info.args.forEach((item, index) => {
      if (Object.prototype.toString.call(item) === '[object Object]') {
        extra = { ...extra, ...item };
      } else {
        extra = { ...extra, [`_m_${index}`]: item };
      }
    });
    const payload = {
      ...data,
      ...extra,
    };
    return JSON.stringify(payload);
    // eslint-disable-next-line no-empty
  } catch (error) {}
  return JSON.stringify(data);
};

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1711071531802_9309',
  koa: {
    port: 7002,
  },
  prometheus: {
    labels: {
      APP_NAME: 'demo_project',
    },
  },
  midwayLogger: {
    default: {
      transports: {
        console: {},
        file: {
          dir: 'logs/pisces/info',
        },
        error: false,
      },
      maxSize: '100m',
      maxFiles: '1d',
      level: 'info',
      consoleLevel: false,
      format: formatInfo,
    },
  },
} as MidwayConfig;
