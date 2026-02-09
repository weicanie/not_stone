# 基于 LLM 的 RPG 游戏 AI NPC 对话与社交系统

<p align="center">
  简体中文 | <a href="i18n/README-EN.md">English</a>
</p>

<br>

以游戏 StoneShard 为例。

你可以认为这个项目致力于将 [SillyTavern](https://github.com/SillyTavern/SillyTavern) 开到StoneShard里。

## 一、功能介绍

**1、人际交往&现实影响：**

npc通过llm（如deepseek、openai），可以和你自然交流并做出自然反应。

和npc的社交是动态且影响游戏世界的，包括但不限于npc赞助你金钱、增加或减少你在当地的声望。

<br>

<img src="https://github.com/weicanie/prisma-ai/blob/main/images/readme/image1.png" alt="Logo"/>

<img src="https://github.com/weicanie/prisma-ai/blob/main/images/readme/image2.png" alt="Logo"/>

**2、特殊关系&谈情说爱**：可以和npc建立情侣、死敌、兄弟等特殊关系。

<br>

**3、交恶&赠礼**：当好感度够高或者够低，npc有可能忍无可忍下攻击你，或者送上**精心准备的礼物**。

<br>

**4、原创任务**：此外还提供了一些原创的任务
1、任务：向上社交
描述：维纶告诉你，佣兵得学着给自己找找靠山，而楼上的香水要从天花板渗下来了。
触发方式：进入游戏即触发
完成条件：与里柯德的关系达到友好或敌对
任务奖励：腰包+700冠/寻宝背包+300奥村声望

<br>

**5、极高兼容性**：几乎可以兼容任何mod，只要热键f5、f6不冲突。

<br>

## 二、本地部署

TBD

> 项目提供了使用docker方式的便捷部署，但一些环境变量的示例文件和配置教程需要完成。

## 三、mod安装和运行

> 这个文档已经过时，仅供参考

### 1、完成msl配置至可以使用msl安装mod

msl配置、安装mod教程：https://modshardteam.github.io/ModShardLauncher/guides/how-to-play-mod.html

下载mod文件：https://ai.pinkprisma.com/oss-d/prisma-ai/heart-is-not-stone.sml

如果你想下载只单纯提供npc社交聊天（不影响任何游戏数据）的版本：https://ai.pinkprisma.com/oss-d/prisma-ai/heart-is-not-stone-no-data-change.sml

安装mod

> 如果你无法通过上述方式下载mod文件，请自行通过msl编译packages目录下的ai-npc-mod包

### 2、创建游戏存档，选定角色

或者选择一个已有的存档。

### 3、创建mod档案

注册账号，

登录，此时你应该看到

点新建档案，输入档案名称、选择自己的角色、你的apiKey

提交，此时档案数据会自动复制到你的剪切板。

点击启用此档案。
（不同的游戏存档需要使用不同的档案）。

### 4、在游戏中写入mod档案

游戏按F6，粘贴档案数据、回车即可。

### 5、如何与npc开启社交

1、 点击Npc，打开对话框
2、 按F5打开输入框，输入你想说的话即可
如果显示（你在和空气交谈...）说明该npc不支持对话

目前支持对话的npc：

- 车队: 维伦、阿尔达、达罗、勒夫
- 奥村:奥达、弗利德、阿兰、霍特、博特、里柯德、杰巴尔
- 布林:扎多克、博恩
