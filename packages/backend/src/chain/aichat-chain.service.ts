import { Runnable, RunnableLambda, RunnableSequence } from '@langchain/core/runnables';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	LLMCanUse,
	npcAIOutputSchema,
	NpcName,
	StreamingChunk,
	UserModelConfig,
	UserRole
} from '@not_stone/shared';
import { BufferMemory } from 'langchain/memory';
import { npc_story, user_role_story } from '../business/ai-npc/constants';
import { GlmModel, GlmNeed, ModelService } from '../model/model.service';
import { ThoughtModelService } from '../model/thought-model.service';
import { PromptService } from '../prompt/prompt.service';
import { RubustStructuredOutputParser } from '../utils/RubustStructuredOutputParser';
import { ChainService } from './chain.service';
@Injectable()
export class AichatChainService {
	constructor(
		public modelService: ModelService,
		public thoughtModelService: ThoughtModelService,
		public promptService: PromptService,
		public configService: ConfigService,
		public chainService: ChainService
	) {}

	transformAIMessageStream(llm: Runnable): Runnable<any, StreamingChunk> {
		// 使用RunnableLambda封装整个流转换过程
		const flatModel = new RunnableLambda<any, any>({
			func: async (prompt: any) => {
				const stream = await llm.stream(prompt);
				return this.thoughtModelService._transformAIMessageStream(stream, 'LLM');
			}
		});

		return flatModel as Runnable<any, StreamingChunk>;
	}

	async createChatChain(
		keyname: string,
		modelConfig: UserModelConfig<LLMCanUse>,
		npcName: string,
		userRoleName: string,
		stream: true
	): Promise<{ chain: RunnableSequence; saver: (output: any) => Promise<void> }>;

	async createChatChain(
		keyname: string,
		modelConfig: UserModelConfig<LLMCanUse>,
		npcName: string,
		userRoleName: string,
		stream: false
	): Promise<RunnableSequence>;

	/**
	 * 用于多轮对话,感知上下文。默认使用 ConversationSummaryMemory
	 * @param prompt 传递给llm的prompt
	 * @param memoryType memory类型，默认 ConversationSummaryMemory
	 * @returns
	 */
	async createChatChain(
		keyname: string,
		modelConfig: UserModelConfig<LLMCanUse>,
		npcName: string = NpcName.verren,
		userRoleName: string = UserRole.Jonna,
		stream: boolean = false
	) {
		const prompt = await this.promptService.aiNpcSystemPrompt();
		const chatHistory = this.modelService.getChatHistory(keyname); //使用自定义的chatHistory
		//TODO 使用ConversationSummaryMemory时,会话记录会丢失,是chatHistory的保存逻辑没支持
		// const memory = new ConversationSummaryMemory({
		// 	chatHistory: chatHistory,
		// 	memoryKey: 'history',
		// 	llm: this.modelService.getLLMDeepSeekRaw('deepseek-chat')
		// });
		const memory = new BufferMemory({
			chatHistory: chatHistory,
			memoryKey: 'history'
		});

		let llm: Runnable;
		switch (modelConfig.llm_type) {
			case LLMCanUse.v3:
				//TODO 支持JSON mode？
				llm = this.modelService.getLLMDeepSeekRaw(
					modelConfig.llm_type as 'deepseek-chat',
					modelConfig.api_key
				);
				llm = this.transformAIMessageStream(llm);
				break;
			case LLMCanUse.r1:
				llm = await this.thoughtModelService.getDeepSeekThinkingModleflat(
					modelConfig.llm_type as any,
					modelConfig.api_key
				);
				break;
			case LLMCanUse.gemini_2_5_pro:
			case LLMCanUse.gemini_2_5_flash:
			case LLMCanUse.gemini_2_5_pro_proxy:
				llm = await this.thoughtModelService.getGeminiThinkingModelFlat(
					modelConfig.llm_type as any,
					modelConfig.api_key
				);
				break;
			case LLMCanUse.glm_4_6:
				llm = await this.modelService.glmModelpool({
					need: GlmNeed.high,
					apiKey: modelConfig.api_key,
					modelName: GlmModel.glm_4_6
				});
				llm = this.transformAIMessageStream(llm);
				break;
		}

		const outputParser = RubustStructuredOutputParser.from(npcAIOutputSchema, this.chainService);

		let lastInput = ''; //储存用户当前输入（以更新memory）
		const seq: any = [
			{
				input: (input, options) => {
					//! 历史记录中不记录关系内容，只记录用户输入内容
					lastInput = JSON.parse(input).userInput;
					return input;
				},
				history: async (input: any, options: any) => {
					const vars = await memory.loadMemoryVariables({ input }); //EntityMemory需要传入input
					return vars.history || vars.summary || '';
				},
				format_instruction: () => outputParser.getFormatInstructions(),
				user_role_info: () => user_role_story[userRoleName],
				npc_role_info: () => npc_story[npcName]
			},
			prompt,
			llm!
		];
		if (stream) {
			const chain = RunnableSequence.from(seq);
			return {
				chain,
				saver: async output => {
					await memory.saveContext({ input: lastInput }, { output });
				}
			};
		} else {
			const chain = RunnableSequence.from(
				seq.concat([
					outputParser,
					RunnableLambda.from(async input => {
						await memory.saveContext({ input: lastInput }, { output: input });
						return input;
					})
				])
			);
			return chain;
		}
	}
}
