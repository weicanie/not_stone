## 1、完成msl配置至可以使用msl安装mod

## 2、创建游戏存档，选定角色

## 3、创建mod档案

```
http://localhost:3011/ai-npc/init-account?username=你的用户名&password=你的密码&archiveName=你的档案名称&rolename=你的角色名称&llm_type=ai模型型号&api_key=你的apikey
```

参数说明：

- username : 用户名
- password : 密码
- archiveName : 档案名称
- rolename : 角色中文名（如"维尔米尔"、"阿娜"等）
- llm_type : LLM模型型号（如deepseek-chat、gemini-2.5-pro等）
- api_key : 对应LLM服务的API密钥

## 4、在游戏中写入mod档案

复制浏览器得到的data字段的内容，浏览器按F12打开控制台，在控制台输入`JSON.parse(复制的内容);`

右键结果，选择copy as value。

在游戏中按F6，粘贴输入即可。

## 5、对话方式

选择对话对象

- 以对话npc的中文名开头

进行对话

- 打开和Npc的对话框
- 按F5打开输入框进行输入
- 输入后按Enter发送
- ai npc将在稍后回复
