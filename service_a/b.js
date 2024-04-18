'use strict';
const { eventLoopUtilization } = require('node:perf_hooks').performance;
const axios = require('axios');

setInterval(async () => {
  const elu = eventLoopUtilization();
  await axios.get('https://www.baidu.com');
  console.log(eventLoopUtilization(elu).utilization, elu.utilization);
}, 1000);

const { monitorEventLoopDelay } = require('perf_hooks');

// 创建一个 EventLoopDelayMonitor 实例，可以带有一个选项对象，可配置 resolution（分辨率）。
const delayMonitor = monitorEventLoopDelay({ resolution: 10 }); // resolution 默认为 10 毫秒

// 启动事件循环延迟监视器
delayMonitor.enable();

// 一段时间后，可以获得延迟的统计数据
setTimeout(() => {
  // 停止事件循环延迟监视器
  delayMonitor.disable();

  console.log('最小延迟: ' + delayMonitor.min);
  console.log('最大延迟: ' + delayMonitor.max);
  console.log('平均延迟: ' + delayMonitor.mean);
  console.log('标准偏差: ' + delayMonitor.stddev);
  console.log('50 百分位数: ' + delayMonitor.percentiles.get(50));
  console.log('90 百分位数: ' + delayMonitor.percentiles.get(90));
  console.log('99 百分位数: ' + delayMonitor.percentiles.get(99));
  // 当然你还可以获取更多百分位数和其他统计信息
}, 1000); // 这里假设我们在 10 秒之后进行读取统计数据
