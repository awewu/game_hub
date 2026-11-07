# 口袋游戏

首页是手机游戏库，目前包含数独和经典俄罗斯方块。点击游戏卡片进入，游戏顶部可返回游戏库；未完成的局面会自动保存。俄罗斯方块支持大号触控方向区、棋盘滑动操作、暂停和经典消行计分。游戏库和两个游戏页面都支持日/夜模式，选择会自动保存。

页面结构：`www/index.html` 是游戏库，点击数独后先选择难度，再进入 `www/sudoku.html`；俄罗斯方块入口是 `www/tetris.html`。数独和俄罗斯方块页面按手机可视高度自适应，保持一屏显示并隐藏页面滚动。以后新增游戏页面，在 `www/library.js` 的 `games` 数组中登记名称、入口、简介与标签，并将资源加入 `www/sw.js` 离线缓存清单。

一个面向手机竖屏使用的简洁数独游戏，支持简单、中等、困难三种难度、计时、错误提示、笔记、提示、自动保存和离线游玩。网页可安装为 PWA，项目已配置 Capacitor，可生成原生手机工程。

## 本地运行

安装 Node.js 后，在项目目录运行：

```bash
npm run serve
```

打开 `http://localhost:4173`。也可以直接用 Python 启动静态服务器：`python -m http.server 4173 --directory www`。

## 打包手机 App

需要 Node.js 18+、JDK 17 和 Android Studio（包含 Android SDK 34 与 Build Tools 34）。安装这些工具后，在项目目录运行：

```bash
npm install
npm run apk:debug
```

Debug APK 输出于 `android/app/build/outputs/apk/debug/app-debug.apk`。也可以用 Android Studio 打开 `android` 文件夹构建。将 `android` 替换为 `ios` 即可生成 iOS 工程（构建 iOS 需要 macOS 与 Xcode）。
