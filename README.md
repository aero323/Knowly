# 懂译 Knowly

面向出海印尼中国人的双语翻译与生活工作私人助理原型。

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

## Notes

- This app no longer depends on the original hosted AI template or provider SDK.
- No provider API key is required or bundled into the frontend.
- The current prototype runs fully in the browser with local UI state.
