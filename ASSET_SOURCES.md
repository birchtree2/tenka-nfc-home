# 素材记录

角色立绘沿用仓库已有素材，来源为 [Shinycolors Wiki / Tenka Osaki Gallery](https://shinycolors.wiki/wiki/Tenka_Osaki/Gallery)。详细介绍插画沿用用户先前提供的图片。角色和原作权利归各自权利人所有。

头像为 2026-10-22 获取的静态快照，页面运行时不会请求个人资料 API：

- GitHub：`api.github.com/users/{username}` 返回的 `avatar_url`。
- QQ：腾讯头像接口 `q1.qlogo.cn/g?b=qq&nk={number}&s=100`。
- Bilibili：`api.live.bilibili.com/live_user/v1/Master/info?uid={uid}` 返回的 `data.info.face`；普通资料接口当时返回风控错误。
- 小红书：用户于 2026-10-22 直接提供的头像图片，保存为 `assets/avatars/xiaohongshu.png`。

视觉参考为 [Eidolon-SC](https://github.com/Sallyn0225/eidolon-sc)、其演示站及用户指定的 NFC 名片演示视频；仅参考角色入场、光线层次和名片交互节奏，本项目采用独立的浅色布局和实现，没有引入其代码。

入场语音截取自 [官方角色页](https://shinycolors.idolmaster-official.jp/idol/alstroemeria/tenka/) 的第一段试听（`assets/data/voice/tenka/voice_1.mp3`），选取约 4.05–6.67 秒的「よろしくお願いします！」。本地做了片段截取、入场留白和尾部淡出，未合成或克隆声音；中文为「请多关照！」。

## 字体

标题使用 Noto Serif SC（思源宋体）600，正文使用 Noto Sans SC（思源黑体）400，参考 Eidolon 的宋体标题与无衬线正文搭配。字体来自 Google Fonts，随项目本地提供 WOFF2，保留拉丁、常用中日韩汉字、假名与标点范围；其他字符使用系统字体回退。SIL Open Font License 见 `assets/fonts/NotoSerifSC-OFL.txt` 和 `assets/fonts/NotoSansSC-OFL.txt`。

加载页专用立绘 `assets/tenka-entry.png` 为用户于 2026-10-22 提供的图片，原样保存。
