import { RunnableSequence } from '@langchain/core/runnables';
import { Injectable, Logger } from '@nestjs/common';
import {
	call_npc,
	MessageSendDto,
	NpcName,
	RelationshipTier,
	UserInfoFromToken
} from '@not_stone/shared';
import { AichatChainService } from '../../chain/aichat-chain.service';
import { ChainService } from '../../chain/chain.service';
import { DbService } from '../../DB/db.service';
import { UserRole } from './constants';

@Injectable()
export class AiNpcService {
	constructor(
		public dbService: DbService,
		public chainService: ChainService,
		public aichatChainService: AichatChainService
	) {}

	private logger = new Logger();

	/**
	 * 初始化API端的游戏档案，包含ai npc、任务等信息
	 * @param name 档案名称
	 * @param role 扮演的角色
	 * @param userInfo
	 */
	async initGameArchiveData(name: string, role: UserRole, userInfo: UserInfoFromToken) {
		// 检查用户名为name的档案是否存在
		const archive = await this.dbService.game_archive.findFirst({
			where: {
				name: name
			}
		});
		if (archive) {
			return archive.id;
		} else {
			// 不存在则创建档案
			const newArchive = await this.dbService.game_archive.create({
				data: {
					name: name,
					role_name: role,
					user_id: +userInfo.userId
				}
			});
			// 初始化ai npc
			await this.initAINpcData(newArchive.id, role);
			// 初始化任务
			await this.initTasks();
			// 设置当前API端的游戏档案
			await this.setCurGameArchive(newArchive.id, userInfo);
			return newArchive.id;
		}
	}

	async initAINpcData(archiveId: number, role: UserRole) {
		// 检查档案是否存在
		const archive = await this.dbService.game_archive.findFirst({
			where: {
				id: archiveId
			}
		});
		if (!archive) {
			throw new Error(`档案不存在，id：${archiveId}`);
		}
		const npcNames = [...Object.values(call_npc)];
		// 查询当前档案的ai npc数量，若与总数一致则无需初始化
		const npcCount = await this.dbService.ai_npc.count({
			where: {
				game_archive_id: archiveId
			}
		});
		if (npcCount === npcNames.length) {
			return;
		}

		// 初始化ai npc
		for (const name of npcNames) {
			// 如果已存在则不创建
			const existingNpc = await this.dbService.ai_npc.findFirst({
				where: {
					game_archive_id: archiveId,
					name: name
				}
			});
			if (existingNpc) {
				continue;
			}
			await this.dbService.ai_npc.create({
				data: {
					game_archive_id: archiveId,
					name: name,
					relationshipValue: 0,
					relationshipTier: RelationshipTier.strange,
					specialRelationship: JSON.stringify([]),
					traits: JSON.stringify([])
				}
			});
		}
	}

	//TODO
	async initTasks() {}

	/**
	 * 设置当前API端的游戏档案
	 * @param name 档案名称
	 * @param userInfo
	 */
	async setCurGameArchive(id: number, userInfo: UserInfoFromToken) {
		await this.dbService.user.update({
			where: {
				id: +userInfo.userId
			},
			data: {
				cur_game_archive_id: id
			}
		});
	}

	/**
	 * 设置当前对话的npc
	 */
	async setCurAINpc(name: string, userInfo: UserInfoFromToken) {
		await this.dbService.user.update({
			where: {
				id: +userInfo.userId
			},
			data: {
				cur_ai_npc_name: name
			}
		});
	}

	/**
	 * 向对话历史作为上下文的ai发送消息并返回回复
	 * @returns
	 */
	async sendMessageToAI(
		messageDto: MessageSendDto,
		userInfo: UserInfoFromToken,
		curNpcName: NpcName
	) {
		const { message, modelConfig } = messageDto;

		const { role, name } = messageDto.archive;
		const gameArchiveId = await this.initGameArchiveData(name, role, userInfo);

		const userInput = message;

		// 查找当前对话历史
		let conversation = await this.dbService.ai_conversation.findFirst({
			where: {
				game_archive_id: gameArchiveId,
				npc_name: curNpcName
			}
		});

		if (!conversation) {
			// 新建对话历史
			conversation = await this.dbService.ai_conversation.create({
				data: {
					game_archive_id: gameArchiveId,
					npc_name: curNpcName,
					keyname: `档案${gameArchiveId}-${curNpcName}`,
					history: []
				}
			});
		}

		try {
			const chain = await this.aichatChainService.createChatChain(
				conversation.keyname,
				modelConfig,
				curNpcName,
				role,
				false
			);
			const answer = await (chain as RunnableSequence).invoke({ input: userInput });
			return answer;
		} catch (error) {
			this.logger.error(error.stack);
			throw error;
		}
	}
}
