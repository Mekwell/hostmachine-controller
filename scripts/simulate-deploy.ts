import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ServersService } from '../src/servers/servers.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const serversService = app.get(ServersService);

  console.log('>>> Triggering Faultless Deployment Simulation...');

  try {
    const result = await serversService.deployServerTask({
      userId: 'test-admin-uuid',
      gameType: 'vh', // Valheim is native linux and very stable in our setup
      memoryLimitMb: 4096,
      env: [
          'SERVER_NAME=FAULTLESS-VALHEIM-TEST',
          'PASSWORD=hostmachine'
      ]
    });

    console.log('>>> Deployment Result:', result);
  } catch (error) {
    console.error('!!! Deployment Failed:', error);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
