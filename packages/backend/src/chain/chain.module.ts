import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { ModelModule } from '../model/model.module';
import { PromptModule } from '../prompt/prompt.module';
import { WithFormfixChain } from '../utils/abstract';
import { AichatChainService } from './aichat-chain.service';
import { ChainService } from './chain.service';

@Module({
	controllers: [],
	providers: [
		ChainService,
		AichatChainService,

		{
			provide: WithFormfixChain,
			useExisting: ChainService
		}
	],
	imports: [ModelModule, PromptModule, CacheModule],
	exports: [ChainService, AichatChainService, WithFormfixChain]
})
export class ChainModule {}
