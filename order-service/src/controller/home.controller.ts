import { Controller, Get, Inject } from '@midwayjs/core';
import { HttpService } from '@midwayjs/axios';

@Controller('/')
export class HomeController {
  @Inject()
  httpService: HttpService;

  @Get('/')
  async home(): Promise<string> {
    return 'I am service b';
  }

  @Get('/call_service_a')
  async callServiceA() {
    const { data } = await this.httpService.get('http://127.0.0.1:7002');
    return data;
  }
}
