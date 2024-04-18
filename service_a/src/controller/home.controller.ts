import { Controller, Get, ILogger, Inject, Query } from '@midwayjs/core';
import { setTimeout as sleep } from 'timers/promises';
import { isUnderPressure, Usage } from '../var';
import { DataService } from '@midwayjs/prometheus';
import {
  BadRequestError,
  InternalServerErrorError,
  UnauthorizedError,
} from '@midwayjs/core/dist/error/http';
import { Context } from '@midwayjs/koa';
// import atomicSleep from 'atomic-sleep';
// import axios from 'axios';
// const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Controller('/')
export class HomeController {
  @Inject()
  dataService: DataService;

  @Inject()
  logger: ILogger;

  @Inject()
  ctx: Context;

  @Get('/')
  async home() {
    console.log(this.ctx.headers);
    return 1231231;
  }

  @Get('/500')
  async a(): Promise<string> {
    throw new InternalServerErrorError('500');
  }

  @Get('/400')
  async b(): Promise<string> {
    throw new BadRequestError('400');
  }
  @Get('/401')
  async c() {
    throw new UnauthorizedError('401');
  }

  @Get('/pressure')
  async pressure(@Query('ms') ms) {
    // Simulate a database query
    await sleep(ms);

    // if (!server.isUnderPressure()) {
    //   // Simulate CPU intensive task
    //   atomicSleep(20);
    // } else {
    //   // Use cached value
    // }

    return { Usage, isUnderPressure: isUnderPressure() };
  }

  @Get('/data')
  async metric() {
    return this.dataService.getData();
  }
}
