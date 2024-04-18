import * as dayjs from 'dayjs';

export class CircuitBreaker {
  openedOrLastTestedTime;
  open: boolean;
  sleepWindow: boolean; // 窗口毫秒数
  forceOpen: boolean;
  RequestVolumeThreshold: number;

  // 果没有熔断器是关闭状态 或者 允许放请求进去看看server是否恢复
  AllowRequest(): boolean {
    return !this.IsOpen() || this.allowSingleTest();
  }

  IsOpen(): boolean {
    const open = this.forceOpen || this.open;
    if (open) {
      return true;
    }

    // 请求数量是否满足要求
    if (this.Requests(dayjs()) < this.RequestVolumeThreshold) {
      return false;
    }

    if (!this.IsHealthy(dayjs())) {
      // too many failures, open the circuit
      this.setOpen();
      return true;
    }
    return false;
  }

  allowSingleTest(): boolean {
    const now = dayjs().valueOf();
    // 当熔断器开启 并且 距离上次测试时间相比已经过了冷却时间
    if (this.open && now > this.openedOrLastTestedTime + this.sleepWindow) {
      console.log('hystrix: allowing single test to possibly close circuit');
      this.openedOrLastTestedTime = now;
      return true;
    }
  }

  // 请求的错误率过高时为不健康状态
  IsHealthy(now): boolean {
    return false;
  }

  setOpen() {
    if (this.open) {
      return;
    }
    this.openedOrLastTestedTime = dayjs().valueOf();
    this.open = true;
  }

  Requests(now): number {
    return 0;
  }
}
