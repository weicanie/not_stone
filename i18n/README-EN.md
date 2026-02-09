# LLM-based RPG Game AI NPC Dialogue & Social System

<p align="center">
  <a href="../README.md">简体中文</a> | English
</p>

<br>

Taking the game StoneShard as an example.

You can think of this project as bringing [SillyTavern](https://github.com/SillyTavern/SillyTavern) into StoneShard.

## I. Features Introduction

**1. Social Interaction & Realistic Impact:**

NPCs can communicate with you naturally and react naturally through LLMs (such as DeepSeek, OpenAI).

Socializing with NPCs is dynamic and affects the game world, including but not limited to NPCs sponsoring you with money, increasing or decreasing your reputation in the local area.

<br>

<img src="https://github.com/weicanie/prisma-ai/blob/main/images/readme/image1.png" alt="Logo"/>

<img src="https://github.com/weicanie/prisma-ai/blob/main/images/readme/image2.png" alt="Logo"/>

**2. Special Relationships & Romance:** You can establish special relationships with NPCs such as lovers, sworn enemies, brothers, etc.

<br>

**3. Hostility & Gifting:** When favorability is high enough or low enough, NPCs may attack you out of unbearable anger, or send you **carefully prepared gifts**.

<br>

**4. Original Quests:** In addition, some original quests are provided.

1. Quest: Upward Social Mobility
   Description: Verren tells you that a mercenary has to learn to find a backer for himself, and the perfume from upstairs is about to seep through the ceiling.
   Trigger method: Triggered immediately upon entering the game
   Completion condition: Reach friendly or hostile relationship with Rickard
   Quest reward: Waist Bag + 700 Crowns / Treasure Hunter's Backpack + 300 Osbrook Reputation

<br>

**5. Extremely High Compatibility:** Almost compatible with any mod, as long as hotkeys F5 and F6 do not conflict.

<br>

## II. Local Deployment

TBD

> The project provides convenient deployment using Docker, but some example files for environment variables and configuration tutorials need to be completed.

## III. Mod Installation and Running

> This document is outdated and for reference only.

### 1. Complete MSL configuration to use MSL to install mods

MSL configuration and mod installation tutorial: https://modshardteam.github.io/ModShardLauncher/guides/how-to-play-mod.html

Download mod file: https://ai.pinkprisma.com/oss-d/prisma-ai/heart-is-not-stone.sml

If you want to download the version that only provides NPC social chat (without affecting any game data): https://ai.pinkprisma.com/oss-d/prisma-ai/heart-is-not-stone-no-data-change.sml

Install mod

> If you cannot download the mod file through the above method, please compile the ai-npc-mod package in the packages directory through MSL yourself.

### 2. Create a game save, select a character

Or select an existing save.

### 3. Create Mod Profile

Register an account,

Login, at this point you should see...

Click New Profile, enter the profile name, select your character, your apiKey.

Submit, at this point the profile data will be automatically copied to your clipboard.

Click Enable this profile.
(Different game saves need to use different profiles).

### 4. Write Mod Profile in Game

Press F6 in the game, paste the profile data, and press Enter.

### 5. How to start socializing with NPCs

1. Click NPC, open the dialogue box
2. Press F5 to open the input box, enter what you want to say
   If it displays (You are talking to air...), it means the NPC does not support dialogue.

Currently supported NPCs for dialogue:

- Caravan: Verren, Arda, Daro, Luv
- Osbrook: Odar, Frida, Alan, Holt, Bert, Rickard, Jebar
- Brynn: Zadok, Bern
