import {
	ActionCode,
	APIReturn,
	GameAction,
	MessageSendDto,
	npc_existence_meta_data,
	NpcAIInput,
	NpcAIOutput,
	NpcExistenceMetaData,
	NpcName,
	NpcStaus,
	PersonalityType,
	RelationshipTier,
	TAINpc,
	TraitList,
	UserInfoFromToken
} from '@not_stone/shared';
import { AiNpcService } from './ai-npc.service';
import { RelationshipThresholds } from './constants';

class AINpc implements TAINpc {
	game_archive_id: number;
	npcName: NpcName;

	status: NpcStaus;
	traits: TraitList[];
	relationshipValue: number;
	relationship: RelationshipTier;
	specialRelationship: string[];
	personality_trend: number;
	metadata: NpcExistenceMetaData;

	aiNpcService: AiNpcService;

	constructor(
		aiNpcService: AiNpcService,
		game_archive_id: number,
		npcName: NpcName,
		relationshipValue: number,
		relationship: RelationshipTier,
		specialRelationship: string[],
		personality_trend: number,
		metadata: NpcExistenceMetaData,
		status: NpcStaus = NpcStaus.normal,
		traits: TraitList[] = []
	) {
		this.aiNpcService = aiNpcService;
		this.game_archive_id = game_archive_id;
		this.npcName = npcName;
		this.status = status;
		this.traits = traits;
		this.relationshipValue = relationshipValue;
		this.relationship = relationship;
		this.specialRelationship = specialRelationship;
		this.personality_trend = personality_trend;
		this.metadata = metadata;
	}

	async saveNpcToDB() {
		// 将数据更新到数据库
		await this.aiNpcService.dbService.ai_npc.updateMany({
			where: {
				game_archive_id: this.game_archive_id,
				name: this.npcName
			},
			data: {
				relationshipValue: this.relationshipValue,
				relationshipTier: this.relationship,
				specialRelationship: JSON.stringify(this.specialRelationship)
			}
		});
	}

	/**
	 * 与AI NPC对话
	 * @returns AI NPC的回复
	 */
	async talk(messageDto: MessageSendDto, userInfo: UserInfoFromToken) {
		const aiInput: NpcAIInput = {
			userInput: messageDto.message,
			relationship: `人际关系：${this.relationship}，社会关系：${this.specialRelationship.join('、')}`
		};
		messageDto.message = JSON.stringify(aiInput);

		const aiOutput = await this.aiNpcService.sendMessageToAI(messageDto, userInfo, this.npcName);
		return aiOutput;
	}

	/**
	 * 好感度等级变化时，根据存在感应用到玩家的声望、金币、经验值。
	 * 数值 = (好感度变化值 * npc该值的存在感数值) / 100，向下取整
	 *
	 */
	async applyRelationshipChangeToPlayer(relationshipChange: number) {
		const metaData = npc_existence_meta_data[this.npcName];
		if (!metaData) {
			return [];
		}

		// 数值 = (好感度变化值 * npc该值的存在感数值) / 100，向下取整
		const wealthChange = Math.floor((relationshipChange * metaData.wealth * 4) / 100);
		const influenceChange = Math.floor((relationshipChange * metaData.influence * 5) / 100);
		const expChange = Math.floor((relationshipChange * metaData.exp * 10) / 100);

		const game_actions: GameAction[] = [];

		if (wealthChange > 0) {
			game_actions.push({
				code: ActionCode.AddGold,
				cnt: wealthChange,
				msg: `${this.npcName}被你打动，资助了你${wealthChange}冠。\n`
			});
		}
		// 人格倾向应用于变化
		if (influenceChange !== 0) {
			game_actions.push({
				code: ActionCode.ChangeReputation,
				cnt: influenceChange > 0 ? influenceChange + this.personality_trend : 0,
				msg: `${influenceChange > 0 ? `这获得了认可，${this.personality_trend > 0 ? '蒸蒸日上啊，' : ''}当地声望+${influenceChange}。\n` : `这不受待见，${this.personality_trend > 0 ? '' : '去他的吧，'}当地声望-${-influenceChange}。\n`}`
			});
		}

		if (expChange > 0) {
			game_actions.push({
				code: ActionCode.AddExp,
				cnt: expChange,
				msg: `${this.npcName}和你分享了经历和见解，经验值+${expChange}。\n`
			});
		}

		return game_actions;
	}

	/**
	 * 好感度变化时，应用到玩家角色的人格倾向
	 */
	async applyRelationshipChangeToPlayerPersonalityTrend(
		relationshipChange: number,
		mod_action_msg: string
	) {
		if (
			relationshipChange === 0 ||
			this.metadata.personality_type === PersonalityType.normal ||
			this.metadata.personality_trend === 0
		) {
			return mod_action_msg;
		} else {
			// 更新玩家角色的人格倾向
			let change =
				(relationshipChange *
					this.metadata.personality_trend *
					(this.metadata.personality_type === PersonalityType.vile ? -1 : 1)) /
				100;
			change = change > 0 ? Math.min(change, 3) : Math.max(change, -3);
			this.personality_trend = this.personality_trend + change;

			await this.aiNpcService.dbService.game_archive.updateMany({
				where: {
					id: this.game_archive_id
				},
				data: {
					personality_trend: this.personality_trend
				}
			});

			// mod_action_msg += `人格倾向 ${change > 0 ? '+' : '-'} ${Math.abs(change)}（${this.personality_trend}）\n`;
			mod_action_msg += `${change > 0 ? `与${this.npcName}这样的人亲近了\n` : `与${this.npcName}这样的人疏远了\n`}`;
			return mod_action_msg;
		}
	}

	/**
	 * 将ai返回的操作应用到数据库，并转为返回给游戏程序的格式
	 */
	async makeAction(aiOutput: NpcAIOutput): Promise<APIReturn> {
		let relationshipChange = 0;
		let mod_action_msg = '';
		const game_action: GameAction[] = [];

		// 解析出acions
		if (aiOutput.actions && aiOutput.actions.length > 0) {
			for (const action of aiOutput.actions) {
				const code = +action.code;

				switch (code) {
					case ActionCode.ChangeRelationshipValue:
						{
							const rawChange = action.cnt || 0;
							// 使得绝对值越高的好感度变化幅度越小
							// 阻尼系数：(150 - |当前好感度|) / 150。当好感度为0时系数为1，为100时系数为0.33
							const dampingFactor = Math.max(0.2, (150 - Math.abs(this.relationshipValue)) / 150);
							let change = Math.max(Math.ceil(rawChange * dampingFactor), 5);

							// 人格魅力影响：负值容易与小人交好，正值容易与普通人、君子交好（物以类聚人以群分）
							if (this.metadata.personality_type === PersonalityType.vile && change !== 0) {
								if (this.personality_trend < 0) {
									change = change + 1;
								} else {
									change = change - 1;
								}
							}
							if (this.metadata.personality_type === PersonalityType.noble && change !== 0) {
								if (this.personality_trend >= 0) {
									change = change + 1;
								} else {
									change = change - 1;
								}
							}

							this.relationshipValue += change;
							relationshipChange += change;

							if (this.relationshipValue > 100) this.relationshipValue = 100;
							if (this.relationshipValue < -100) this.relationshipValue = -100;

							// 更新好感度等级
							if (this.relationshipValue >= RelationshipThresholds.friend.min) {
								this.relationship = RelationshipTier.friend;
							} else if (this.relationshipValue >= RelationshipThresholds.friendly.min) {
								this.relationship = RelationshipTier.friendly;
							} else if (this.relationshipValue >= RelationshipThresholds.strange.min) {
								this.relationship = RelationshipTier.strange;
							} else if (this.relationshipValue >= RelationshipThresholds.hate.min) {
								this.relationship = RelationshipTier.hate;
							} else {
								this.relationship = RelationshipTier.hostile;
							}

							mod_action_msg += `好感度${change > 0 ? '+' : '-'} ${Math.abs(change)}（${this.relationshipValue}，${this.relationship}）\n`;
						}
						break;
					case ActionCode.addSpecialRelationship:
						{
							if (action.rels) {
								for (const rel of action.rels) {
									if (!this.specialRelationship.includes(rel)) {
										this.specialRelationship.push(rel);
										mod_action_msg += `关系建立: ${action.rels.join(', ')}\n`;
									}
								}
							}
						}
						break;
					case ActionCode.deleteSpecialRelationship:
						{
							if (action.rels) {
								this.specialRelationship = this.specialRelationship.filter(
									rel => !action.rels?.includes(rel)
								);

								mod_action_msg += `关系解除: ${action.rels.join(', ')}\n`;
							}
						}
						break;
					default:
						game_action.push(action);
				}
			}

			// 将数据更新到数据库
			await this.saveNpcToDB();
		}

		// 应用好感度变化带来的额外影响
		if (relationshipChange !== 0) {
			const game_actions = await this.applyRelationshipChangeToPlayer(relationshipChange);
			game_action.push(...game_actions);
		}

		// 应用好感度变化到玩家角色人格魅力
		if (relationshipChange !== 0) {
			mod_action_msg = await this.applyRelationshipChangeToPlayerPersonalityTrend(
				relationshipChange,
				mod_action_msg
			);
		}

		// 返回回复和需要在游戏程序中进行的数据操作
		return {
			msg: aiOutput.reply,
			speaker: this.npcName,
			mod_action_msg,
			action: game_action
		};
	}
}

export default AINpc;
