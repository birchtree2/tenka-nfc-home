# 静态站点部署

正式域名：`https://card.umi-cv.com/`。

## 发布

在开发电脑运行 `bash scripts/deploy-aliyun.sh`。依赖应在本机安装好。
脚本顺序完成本地构建、gzip 预压缩、上传、解压和原子切换目录。
阿里云服务器禁止运行 npm 安装、npm 构建或并行构建；服务器只接收静态产物。
GitHub Pages 已关闭，发布工作流已移除；GitHub 仅保存代码，推送不会自动更新阿里云。

## 服务

- SSH 别名：`aliyun`。
- Nginx Proxy Manager 的 `card.umi-cv.com` Proxy Host，Advanced 配置见 `npm-card.conf`。
- 通过自定义 `location /` 直接提供文件，不经过 Node 服务或 GitHub。
- 容器目录：`/data/static/card/current`。
- 宿主机目录：`/root/nginx-proxy-manager/data/static/card/`。
- Cloudflare DNS：`card` 的 A 记录直指服务器，DNS only。
- HTTPS：NPM 管理 Let's Encrypt 证书和续期，强制 HTTPS。

## 缓存与预加载

加载页为内联圆形 Q 版小图、身份文字和进度条，不依赖额外图片请求或外部字体。默认 5 秒，期间优先加载并解码主页立绘与头像；慢网最多额外等待 10 秒，Escape 可提前进入。
主立绘在 HTML 中直接声明并高优先级预加载，640px 透明 WebP 约 61 KB；小红书头像（不超过 8 KB 的本地 WebP）内联到页面。主页语音从脚本初始化时立即开始预加载（声音默认关闭，预加载不触发播放）。其他资源仍在倒计时期间预加载。
立绘压缩命令：`cwebp -resize 640 0 -q 72 -alpha_q 85 -m 6 assets/tenka-profile-hd.png -o assets/tenka-profile-640.webp`。
裁剪字体和内联首屏代码保留。
HTML、脚本和配置使用 `Cache-Control: no-cache` 配合 ETag，允许缓存但每次重新验证。
`/assets/` 保持 GitHub Pages 原先的 600 秒缓存；文件名未指纹化，因此不设置 immutable。
文本文件由本机预压缩，Nginx 使用 gzip_static；图片、字体等已压缩格式不重复 gzip。
网易云 HTTPS 跳转修复继续由页面中的 CSP 保留；音乐仍由访客浏览器直接请求网易云。

## 回滚

每次部署保留旧 release，并将此前目录写入服务器上的 `previous-release`。
回滚时读取这个路径，创建指向它的新临时符号链接，再用 `mv -Tf` 替换 `current`。
不要直接修改正在服务的 release，也不要删除仍在使用的目录。
