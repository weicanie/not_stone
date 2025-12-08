import { Module } from '@nestjs/common';
import { ChainModule } from '../../chain/chain.module';
import { UserModule } from '../user/user.module';
import { AiNpcController } from './ai-npc.controller';
import { AiNpcService } from './ai-npc.service';

@Module({
	controllers: [AiNpcController],
	providers: [AiNpcService],
	imports: [ChainModule, UserModule]
})
export class AiNpcModule {}
