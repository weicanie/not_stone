interface TAINpc {
	npcName: NpcName;
	status: NpcStaus;
	traits: TraitList[];
	relationshipValue: number;
	relationship: RelationshipTier;
	specialRelationship: SpecialRelationshipType[];
}

enum NpcName {
	air = 'air', //当用户没有指定npc时，默认对话空气
	/* 车队 */
	verren = 'verren',
	alda = 'alda',
	// darrel = 'darrel',
	// leif = 'leif',
	/* 奥村 */
	frid = 'frid', // 药师
	alan = 'alan', // 磨坊主
	hold = 'hold', // 奥斯布鲁克的裁缝
	bert = 'bert', // 生意人
	rickerd = 'rickerd', // 布林特使
	jebar = 'jebar', // 铁匠
	/* 布林 */
	zadok = 'zadok', // 布林港口酒鬼
	bern = 'bern' // 布林老楼给介绍信的兵长
}

/* 对话npc流程
  玩家在对话的头输入，用于识别对话的npc。
  记录为当前对话的npc。
  之后的对话不用再输入名字。
  通过输入其它npc的名字来切换对话的npc。（其实就是每次都对玩家的输入进行检测）
*/
const call_npc = {
	维伦: NpcName.verren,
	阿尔达: NpcName.alda,
	扎多克: NpcName.zadok,
	博恩: NpcName.bern,
	空气: NpcName.air,
	弗利德: NpcName.frid,
	阿兰: NpcName.alan,
	霍特: NpcName.hold,
	博特: NpcName.bert,
	里柯德: NpcName.rickerd,
	杰巴尔: NpcName.jebar
};

/* 可以只提供npc 名字，程序会部分匹配 */
enum CaravanNpcKey {
	verren = 'verren',
	alda = 'alda'
	// darrel = 'darrel',
	// leif = 'leif'
}

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

/* 发展中的关系 
  玩家是npc的__，
	这是玩家可以改变的关系
*/
enum SpecialRelationshipType {
	lover = 'lover', // 恋人
	parent = 'parent', // 父或母
	child = 'child', // 子或女
	brother = 'brother', // 兄弟
	sister = 'sister' // 姐妹
}

export {
	call_npc,
	CaravanNpcKey,
	NpcName,
	NpcStaus,
	RelationshipTier,
	SpecialRelationshipType,
	TAINpc,
	TraitList
};
