import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
	APIReturn,
	call_npc,
	cnNameToEnglish,
	LLMCanUse,
	ModAccountData,
	NpcName,
	RelationshipTier,
	SpecialRelationshipType,
	type UserInfoFromToken
} from '@not_stone/shared';
import { DbService } from '../../DB/db.service';
import { RequireLogin, UserInfo } from '../../decorator';
import { UserService } from '../user/user.service';
import AINpc from './ai-npc';
import { AiNpcService } from './ai-npc.service';
import { MessageSendDto } from './dto/aichat-dto';

@Controller('ai-npc')
export class AiNpcController {
	constructor(
		private readonly aiNpcService: AiNpcService,
		private readonly dbService: DbService,
		private readonly userService: UserService
	) {}

	@Post('send')
	@RequireLogin()
	async sendMessageToAINpc(
		@Body() messageDto: MessageSendDto,
		@UserInfo() userInfo: UserInfoFromToken
	): Promise<APIReturn> {
		const { message } = messageDto;
		const { role, name } = messageDto.archive;
		const gameArchiveId = await this.aiNpcService.initGameArchiveData(name, role, userInfo);

		const userInput = message;

		// 如果对话以某个npc名字开头，就将该npc设置为用户当前对话的npc
		let curNpcName = '';
		const npcCalls = [...Object.keys(call_npc)];
		for (const call of npcCalls) {
			if (userInput.trim().startsWith(call)) {
				await this.aiNpcService.setCurAINpc(call_npc[call], userInfo);
				curNpcName = call_npc[call];
			}
		}
		// 否则查询用户当前对话的npc
		if (!curNpcName) {
			const user = await this.dbService.user.findFirst({
				where: {
					id: +userInfo.userId
				},
				select: {
					cur_ai_npc_name: true
				}
			});
			curNpcName = user?.cur_ai_npc_name || call_npc['空气']; // 如果用户没有指定npc，默认对话空气
		}

		if (curNpcName === NpcName.air) {
			return {
				msg: '（看来你正在和空气说话，和其他人打个招呼？）',
				speaker: '?',
				action: []
			};
		}

		// 尝试更新npc列表
		await this.aiNpcService.initAINpcData(gameArchiveId, messageDto.archive.role);
		//从数据库中查询ai npc

		const aiNpcData = await this.dbService.ai_npc.findFirst({
			where: {
				game_archive_id: gameArchiveId,
				name: curNpcName
			}
		});

		if (!aiNpcData) {
			throw Error(`档案${gameArchiveId}里没有${curNpcName}的记录`);
		}

		// 调用ai npc
		const aiNpc = new AINpc(
			this.aiNpcService,
			+gameArchiveId,
			aiNpcData.name as NpcName,
			aiNpcData.relationshipValue,
			aiNpcData.relationshipTier as RelationshipTier,
			JSON.parse(aiNpcData.specialRelationship as string) as SpecialRelationshipType[]
		);

		const aiOutput = await aiNpc.talk(messageDto, userInfo);
		return await aiNpc.makeAction(aiOutput);
	}

	/**
	 * 注册服务器账户，创建档案
	 * @return 存放于游戏端的用于和服务器通信的账号数据
	 */
	@Get('init-account')
	async initAccount(
		@Query('username') username: string,
		@Query('password') password: string,
		@Query('archiveName') archiveName: string,
		@Query('rolename') rolename: keyof typeof cnNameToEnglish,
		@Query('llm_type') llm_type: LLMCanUse,
		@Query('api_key') api_key: string
	): Promise<string> {
		// 对所有参数进行URL解码
		username = decodeURIComponent(username);
		password = decodeURIComponent(password);
		archiveName = decodeURIComponent(archiveName);
		rolename = decodeURIComponent(rolename) as keyof typeof cnNameToEnglish;
		llm_type = decodeURIComponent(llm_type) as LLMCanUse;
		api_key = decodeURIComponent(api_key);
		const userRole = cnNameToEnglish[rolename];
		if (!userRole) {
			throw Error(`角色${rolename as string}不存在`);
		}

		// 注册用户
		await this.userService.regist(
			{
				username,
				password,
				confirmPassword: password,
				captcha: 'void',
				email: 'void'
			},
			true
		);
		// 登录获取token
		const { token } = await this.userService.login({
			username,
			password
		});

		const data: ModAccountData = {
			modelConfig: {
				llm_type,
				api_key
			},
			archive: {
				name: archiveName,
				role: userRole
			},
			token
		};

		return JSON.stringify(data);
	}
}
