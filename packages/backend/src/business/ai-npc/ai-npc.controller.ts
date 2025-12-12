import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import {
	APIReturn,
	call_npc,
	cnNameToEnglish,
	GameArchive,
	LLMCanUse,
	ModAccountData,
	npc_existence_meta_data,
	NpcName,
	RelationshipTier,
	type UserInfoFromToken
} from '@not_stone/shared';
import { DbService } from '../../DB/db.service';
import { RequireLogin, Role, UserInfo } from '../../decorator';
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

	async getNpcName(userInput: string, npcCall: string, userInfo: UserInfoFromToken) {
		// 先尝试直接将npcCall转换为英文;
		if (call_npc[npcCall]) {
			await this.aiNpcService.setCurAINpc(call_npc[npcCall], userInfo);
			return call_npc[npcCall] as NpcName;
		} else {
			// 否则回退到用户输入控制
			let curNpcName = '';
			// 如果对话以某个npc名字开头，就将该npc设置为用户当前对话的npc
			const npcCalls = [...Object.keys(call_npc)];
			for (const call of npcCalls) {
				if (userInput.trim().startsWith(call)) {
					await this.aiNpcService.setCurAINpc(call_npc[call], userInfo);
					curNpcName = call_npc[call];
				}
			}
			return curNpcName as NpcName;
		}
	}

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

		// 获取npc名称
		let curNpcName = await this.getNpcName(userInput, messageDto.npcCall, userInfo);

		// 获取npc名称失败则查询用户当前对话的npc
		if (!curNpcName) {
			const user = await this.dbService.user.findFirst({
				where: {
					id: +userInfo.userId
				},
				select: {
					cur_ai_npc_name: true
				}
			});
			curNpcName = (user?.cur_ai_npc_name as NpcName) || call_npc['空气']; // 如果用户没有指定npc，默认对话空气
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

		const personality_trend =
			(
				await this.aiNpcService.dbService.game_archive.findFirst({
					where: {
						id: gameArchiveId
					},
					select: {
						personality_trend: true
					}
				})
			)?.personality_trend || 0;

		const metaData = npc_existence_meta_data[aiNpcData.name as NpcName];

		// 调用ai npc
		const aiNpc = new AINpc(
			this.aiNpcService,
			+gameArchiveId,
			aiNpcData.name as NpcName,
			aiNpcData.relationshipValue,
			aiNpcData.relationshipTier as RelationshipTier,
			JSON.parse(aiNpcData.specialRelationship as string) as string[],
			personality_trend,
			metaData
		);

		const aiOutput = await aiNpc.talk(messageDto, userInfo);
		return await aiNpc.makeAction(aiOutput);
	}

	/**
	 * 注册服务器账户，创建档案
	 * @return 存放于游戏端的用于和服务器通信的账号数据
	 */
	@Get('init-account')
	@RequireLogin([Role.admin])
	async initAccount(
		@Query('username') username: string,
		@Query('password') password: string,
		@Query('archiveName') archiveName: string,
		@Query('rolename') rolename: keyof typeof cnNameToEnglish,
		@Query('llm_type') llm_type: LLMCanUse
	): Promise<ModAccountData> {
		// 对所有参数进行URL解码
		username = decodeURIComponent(username);
		password = decodeURIComponent(password);
		archiveName = decodeURIComponent(archiveName);
		rolename = decodeURIComponent(rolename) as keyof typeof cnNameToEnglish;
		llm_type = decodeURIComponent(llm_type) as LLMCanUse;
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
				api_key: ''
			},
			archive: {
				name: archiveName,
				role: userRole
			},
			token
		};

		return data;
	}

	@Post('create_archive')
	@RequireLogin()
	async createArchive(
		@Query('archiveName') archiveName: string,
		@Query('roleName') rolename: keyof typeof cnNameToEnglish,
		@Query('llm_type') llm_type: LLMCanUse,
		@UserInfo() userInfo: UserInfoFromToken,
		@Res({ passthrough: true }) res: any
	) {
		const userRole = cnNameToEnglish[rolename];
		if (!userRole) {
			throw Error(`角色${rolename as string}不存在`);
		}

		await this.aiNpcService.initGameArchiveData(archiveName, userRole, userInfo);

		const data: ModAccountData = {
			modelConfig: {
				llm_type,
				api_key: ''
			},
			archive: {
				name: archiveName,
				role: userRole
			},
			token: res.getHeader('token') as string
		};

		return data;
	}

	@Post('set_cur_archive')
	@RequireLogin()
	async setCurArchive(
		@Query('archiveId') archiveId: string,
		@UserInfo() userInfo: UserInfoFromToken
	): Promise<string> {
		await this.aiNpcService.setCurGameArchive(+archiveId, userInfo);
		return '设置成功';
	}

	@Get('get_cur_archive')
	@RequireLogin()
	async getCurArchive(@UserInfo() userInfo: UserInfoFromToken): Promise<GameArchive> {
		const archive = await this.aiNpcService.getCurGameArchive(userInfo);
		if (!archive) {
			throw Error('用户没有当前游戏档案');
		}
		return archive;
	}

	@Get('archives')
	@RequireLogin()
	async getArchives(@UserInfo() userInfo: UserInfoFromToken): Promise<GameArchive[]> {
		return await this.aiNpcService.getGameArchives(userInfo);
	}
}
