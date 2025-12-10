import {
	APIReturn,
	ActionCode,
	GameAction,
	MessageSendDto,
	NpcAIInput,
	NpcAIOutput,
	NpcName,
	NpcStaus,
	RelationshipTier,
	SpecialRelationshipType,
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
	specialRelationship: SpecialRelationshipType[];

	aiNpcService: AiNpcService;

	constructor(
		aiNpcService: AiNpcService,
		game_archive_id: number,
		npcName: NpcName,
		relationshipValue: number,
		relationship: RelationshipTier,
		specialRelationship: SpecialRelationshipType[],
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
							const change = action.cnt || 0;
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

							mod_action_msg += `好感度变为${this.relationshipValue}（${this.relationship}）\n`;
						}
						break;
					case ActionCode.addSpecialRelationship:
						{
							if (action.rels) {
								for (const rel of action.rels) {
									// 检验关系类型是否在声明的集合中
									if (
										Object.values(SpecialRelationshipType).includes(rel as SpecialRelationshipType)
									) {
										if (!this.specialRelationship.includes(rel as SpecialRelationshipType)) {
											this.specialRelationship.push(rel as SpecialRelationshipType);
										}
									}
								}

								mod_action_msg += `关系建立: ${action.rels.join(', ')}\n`;
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
