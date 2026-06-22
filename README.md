# 懂译 Knowly

面向出海印尼中国人的双语翻译与生活工作私人助理原型。

## Version 0.3.0

本版本继续打磨 PC / Electron 桌面端登录、字幕同传和纪要体验，让演示流程更接近真实企业桌面产品。

### Desktop App

- 新增桌面端手机号注册 / 登录 mock 流程，支持短信验证码登录，并提供个人体验和企业体验入口。
- 未开通账号进入字幕同传时会提示需要开通付费企业版；企业体验账号可直接开始字幕同传。
- 字幕同传支持最多 3 个目标语言译文，可在同传设置和默认翻译偏好中添加、移除目标语言。
- 目标语言下拉新增「无」和 18 种常见语言，英语、中文、印尼语及东南亚语言前置。
- 字幕 mock 数据升级为多语译文，企业体验默认展示中文、英语、泰语三种译文。
- 字幕浮层适配多语译文展示，去掉译文编号、原文标签和单条译文高亮，让浮层更像正式现场字幕。
- 字幕浮层展示句数调整为 2 到 5 句，默认 3 句。
- 字幕同传和 AI 通话纪要界面移除「待办事项」和「沉淀术语」展示，只保留摘要、时间信息和逐句转写。
- 登录页文案改为正式产品口吻，突出桌面端实时字幕、多语译文和企业协作。

## Version 0.2.0

本版本继续完善 PC / Electron 桌面端，把字幕同传和 AI 通话工作台推进到更接近可演示的产品形态。

### Desktop App

- 字幕同传新增「纪要与历史」：停止同传后自动生成本地 mock 纪要，保存历史记录，并支持在桌面弹层中查看摘要和逐句转写。
- 同传历史标题不再固定为「同声传译纪要」，会根据字幕内容 mock 生成船期、付款、单据、清关、滞港费等场景标题。
- 字幕浮层默认启用滚动模式，支持多句歌词式展示、当前句高亮、全屏展示和窗口拖拽缩放；字号会跟随侧边栏设置和浮层窗口大小自动缩放。
- 字幕浮层去掉紧凑开关、无效胶囊标签和冗余文案，保留更直接的暂停、停止、全屏等控制。
- 字幕同传参考资料上传上限从 2MB 调整为 5MB，继续支持 txt、docx、pdf、xlsx。
- AI 通话首页优化缩小窗口布局：主工作区在右侧内容区内自适应上下居中，空间不足时可滚动，减少窗口变小时内容被遮挡的问题。
- AI 通话和字幕同传继续读取全局翻译偏好，临时语言设置不会覆盖默认偏好。

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
