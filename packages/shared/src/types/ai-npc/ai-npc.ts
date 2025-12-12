interface TAINpc {
	npcName: NpcName;
	status: NpcStaus;
	traits: TraitList[];
	// 好感度 -100 ~ 100
	relationshipValue: number;
	relationship: RelationshipTier;
	/* 社会关系 
  玩家是npc的__，
	这是玩家可以改变的关系
	*/
	specialRelationship: string[];
	/* 玩家角色的人格倾向值（善恶倾向）
		近朱者赤近墨者黑，小人好感度增加就-，和君子好感度增加就+。
	用于
		1、当地声望变化时，>0声望增加更多
		2、< 0 更容易和小人交好，> 0 更容易和君子交好。
	*/
	personality_trend: number;
	metadata: NpcExistenceMetaData;
}

enum NpcName {
	air = 'air', //当用户没有指定npc时，默认对话空气
	/* 车队 */
	verren = 'verren',
	alda = 'alda',
	darrel = 'darrel',
	leif = 'leif',
	/* 奥村 */
	odar = 'odar', // 村长
	frid = 'frid', // 药师
	alan = 'alan', // 磨坊主
	hold = 'hold', // 裁缝
	bert = 'bert', // 生意人
	rickerd = 'rickerd', // 布林特使
	jebar = 'jebar', // 铁匠
	/* 布林 */
	zadok = 'zadok', // 酒鬼
	bern = 'bern' // 兵长
}

/* 对话npc流程
  玩家在对话的头输入，用于识别对话的npc。
  记录为当前对话的npc。
  之后的对话不用再输入名字。
  通过输入其它npc的名字来切换对话的npc。（其实就是每次都对玩家的输入进行检测）
*/
const call_npc = {
	空气: NpcName.air,
	/* 车队 */
	维伦: NpcName.verren,
	阿尔达: NpcName.alda,
	达罗: NpcName.darrel,
	勒夫: NpcName.leif,
	/* 奥村 */
	奥达: NpcName.odar,
	弗利德: NpcName.frid,
	阿兰: NpcName.alan,
	霍特: NpcName.hold,
	博特: NpcName.bert,
	里柯德: NpcName.rickerd,
	杰巴尔: NpcName.jebar,
	/* 布林 */
	扎多克: NpcName.zadok,
	博恩: NpcName.bern
};

/* 可以只提供npc 名字，程序会部分匹配 */
enum CaravanNpcKey {
	verren = 'verren',
	alda = 'alda'
	// darrel = 'darrel',
	// leif = 'leif'
}
/**
 * npc对玩家角色的人格倾向影响方向
 */
enum PersonalityType {
	/* 恶 */
	vile = 'vile',
	/* 善 */
	noble = 'noble',
	/* 中立 */
	normal = 'normal'
}
/* npc存在感表示对玩家与游戏世界的改变方向与能力
	npc好感度变化时，根据npc存在感应用到玩家的声望、金币和经验值
	不同npc按其存在感（财富、影响力、经验）不同而导致不同数值的奖励或惩罚。
	0 表示其无法影响。
*/
interface NpcExistenceMetaData {
	wealth: number; // 对财富 0 ~ 100
	influence: number; // 对当地声望 0 ~ 100
	exp: number; // 对经验值 0 ~ 100
	/* 对人格倾向值 */
	personality_trend: number; //数值
	personality_type: PersonalityType; //方向
}
const npc_existence_meta_data: Record<NpcName, NpcExistenceMetaData> = {
	[NpcName.air]: {
		wealth: 0,
		influence: 0,
		exp: 0,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	/* 车队 */
	[NpcName.verren]: {
		wealth: 0,
		influence: 0,
		exp: 80,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	[NpcName.alda]: {
		wealth: 0,
		influence: 0,
		exp: 50,
		personality_trend: 30,
		personality_type: PersonalityType.noble
	},
	[NpcName.darrel]: {
		wealth: 30,
		influence: 0,
		exp: 20,
		personality_trend: 30,
		personality_type: PersonalityType.noble
	},
	[NpcName.leif]: {
		wealth: 0,
		influence: 0,
		exp: 90,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	/* 奥村 */
	[NpcName.odar]: {
		wealth: 50,
		influence: 90,
		exp: 0,
		personality_trend: 50,
		personality_type: PersonalityType.vile
	},
	[NpcName.alan]: {
		wealth: 0,
		influence: 80,
		exp: 0,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	[NpcName.frid]: {
		wealth: 20,
		influence: 50,
		exp: 0,
		personality_trend: 30,
		personality_type: PersonalityType.noble
	},
	[NpcName.hold]: {
		wealth: 30,
		influence: 30,
		exp: 0,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	[NpcName.bert]: {
		wealth: 50,
		influence: 0,
		exp: 10,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	[NpcName.rickerd]: {
		wealth: 80,
		influence: -50,
		exp: 0,
		personality_trend: 20,
		personality_type: PersonalityType.vile
	},
	[NpcName.jebar]: {
		wealth: 20,
		influence: 40,
		exp: 0,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	/* 布林 */
	[NpcName.zadok]: {
		wealth: 0,
		influence: 0,
		exp: 0,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	},
	[NpcName.bern]: {
		wealth: 60,
		influence: 95,
		exp: 80,
		personality_trend: 0,
		personality_type: PersonalityType.normal
	}
};

/* 特质系统
  特质是npc个性的概括，目前仅影响对话。
*/
enum TraitList {
	freeAndAlone = 'freeAndAlone', // 独来独往
	liveInRevenge = 'liveInRevenge' // 一心复仇
}

enum NpcStaus {
	normal = 'normal', // 普通状态
	inTask = 'task', // 任务中状态
	inAsk = 'ask' // 向玩家提问，玩家的回答会使其获得特质
}

/* 好感度和关系系统
  好感度会根据对话、任务改变。
  好感度到达一定程度，可以获得奖励或者得到惩罚。
*/
enum RelationshipTier {
	strange = 'strange', // 陌生 0 ~ 20
	friendly = 'friendly', // 友好 20 ~ 40
	friend = 'friend', // 好友 50 ~ 100
	hate = 'hate', // 厌恶 -20 ~ 0
	hostile = 'hostile' // 敌视 -100 ~ -20
}

/* 设定关系游戏已经给出，玩家无法改变，合伙、雇佣和被雇佣... */

export {
	call_npc,
	CaravanNpcKey,
	npc_existence_meta_data,
	NpcExistenceMetaData,
	NpcName,
	NpcStaus,
	PersonalityType,
	RelationshipTier,
	TAINpc,
	TraitList
};
