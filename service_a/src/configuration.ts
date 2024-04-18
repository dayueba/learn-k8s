import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import { join } from 'path';
// import { DefaultErrorFilter } from './filter/default.filter';
// import { NotFoundFilter } from './filter/notfound.filter';
import { ReportMiddleware } from './middleware/report.middleware';
import { Usage } from './var';
const { eventLoopUtilization } = require('node:perf_hooks').performance;
const { monitorEventLoopDelay } = require('node:perf_hooks');
import * as prometheus from '@midwayjs/prometheus';

@Configuration({
  imports: [
    koa,
    validate,
    prometheus,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady() {
    // add middleware
    this.app.useMiddleware([ReportMiddleware]);
    // add filter
    // this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);

    // 监控事件循环
    const resolution = 10;
    const sampleInterval = 10;
    let lastCheck;
    let histogram;
    let elu;
    if (monitorEventLoopDelay) {
      histogram = monitorEventLoopDelay({ resolution });
      histogram.enable();
      setTimeout(() => {
        console.log(histogram);
      }, 1000);
    } else {
      // lastCheck = now();
    }
    if (eventLoopUtilization) {
      elu = eventLoopUtilization();
    }
    setInterval(() => {
      if (histogram) {
        // console.log(histogram, histogram.mean / 1e9, resolution);
        Usage.eventLoopDelay = Math.max(0, histogram.mean / 1e6 - resolution);
        if (Number.isNaN(Usage.eventLoopDelay)) Usage.eventLoopDelay = Infinity;
        histogram.reset();
      } else {
        const toCheck = now();
        Usage.eventLoopDelay = Math.max(
          0,
          toCheck - lastCheck - sampleInterval
        );
        lastCheck = toCheck;
      }
      if (elu) {
        Usage.eventLoopUtilized = eventLoopUtilization(elu).utilization;
      } else {
        Usage.eventLoopUtilized = 0;
      }
      // console.log(Usage);
    }, 100);
  }
}

function now() {
  const ts = process.hrtime();
  return ts[0] * 1e3 + ts[1] / 1e6;
}
