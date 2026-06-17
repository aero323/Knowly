# 懂译 Knowly

面向出海印尼中国人的双语翻译与生活工作私人助理原型。

## Version 0.1.0

本版本补齐了 PC / Electron 原型的核心工作台，并同步更新了移动端 AI 通话联系人体验。

### Desktop App

- 新增独立 Electron 桌面端入口，移动端代码与 PC 端代码分层维护。
- 侧边栏包含 AI 通话、字幕同传、翻译偏好三个工作区。
- AI 通话改为桌面工作台布局：顶部发起/加入通话，主体管理联系人、最近通话、当前会话、等待室、通话中字幕和结束纪要。
- 字幕同传支持音频输入选择、开始/暂停/继续/停止、会议码展示、APP 下载二维码投屏弹层。
- 新增翻译偏好页：语言、译文风格、字幕字号、显示原文、自动纪要、对话场景、自定义场景提示词、我的术语库和术语编辑。
- 字幕同传支持上传 2MB 以内 txt、docx、pdf、xlsx 参考资料，作为翻译参考的 Beta 能力。
- 悬浮字幕窗口支持拖动、窗口缩放、滚动模式、多句歌词式展示、当前句高亮、停止同传和全屏展示。
- 字幕同传顶部增加“使用翻译偏好”开关；源语言/目标语言可作为本次同传临时设置，不覆盖全局翻译偏好。

### Mobile App

- AI 通话联系人列表增加点击选择通话、联系人姓名编辑、全部联系人弹层和通话历史记录。
- 通话历史支持查看原文/译文、编辑译文并记录本地 mock 修正。

## Local Development

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the browser app:
   ```bash
   npm run dev
   ```
3. Open the local URL printed by Vite, usually:
   ```text
   http://localhost:3000
   ```

## Desktop Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Electron desktop app:
   ```bash
   npm run dev:desktop
   ```
3. Build the desktop bundles:
   ```bash
   npm run build:desktop
   ```
4. Package the desktop app:
   ```bash
   npm run dist:desktop
   ```

## Notes

- This app no longer depends on the original hosted AI template or provider SDK.
- No provider API key is required or bundled into the frontend.
- The current prototype runs with local mock data and local UI state.
