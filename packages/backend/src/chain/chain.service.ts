import { RunnableLambda, RunnableSequence } from '@langchain/core/runnables';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { ModelService } from '../model/model.service';
import { PromptService } from '../prompt/prompt.service';
import { WithFormfixChain } from '../utils/abstract';

@Injectable()
export class ChainService implements WithFormfixChain {
	constructor(
		public modelService: ModelService,
		public promptService: PromptService,
		public configService: ConfigService
	) {}

	//! 暂时不进行修复，原样返回
	/**
	 * 格式修复：按schema指定的格式将原输入输出
	 * @param schema zod schema
	 * @param input 原输入
	 * @param errMsg 格式错误信息
	 * @returns
	 */
	async fomartFixChain<T = any>(schema: z.Schema, errMsg: String) {
		const chain = RunnableSequence.from<{ input: string }, T>([
			{
				input: input => input.input
			},
			new RunnableLambda({
				func: async ({ input }) => {
					return input;
				}
			})
		]);
		return chain;
	}
}
