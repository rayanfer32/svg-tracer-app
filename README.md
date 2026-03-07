# 🎨 SVG Tracer & Animator

[![GitHub Stars](https://img.shields.io/github/stars/rayanfer32/svg-tracer-app?style=social)](https://github.com/rayanfer32/svg-tracer-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SVG Tracer & Animator** is a powerful, browser-based tool designed to convert raster images (JPEG, PNG, etc.) into high-quality SVG vector art. Beyond simple tracing, it allows you to create and export stunning line-drawing animations.

<div align="center">
  <video src="./public/tracer-demo.mp4" width="100%" autoplay loop muted playsinline></video>
</div>

## Live demo

- https://svg-tracer-app.vercel.app

## 🚀 Features

- **Advanced Image Tracing**: Convert any raster image to clean SVG paths using the integrated VTracer engine.
- **Dynamic Animations**: Automatically generate line-drawing animations for your traced SVGs.
- **Customizable Playback**: Control easing (Linear, Ease-In, Ease-Out, Bounce, Elastic), duration, delay, and stagger effects.
- **Reference Overlays**: Upload a reference image to trace over with adjustable opacity and position.
- **Recording & Export**:
  - Export as high-quality **SVG**.
  - Record animations directly to **WebM** video format.
- **Styling Options**: Toggle original colors, customize stroke colors, widths, and background settings.
- **Responsive UI**: Sleek dark-mode compatible interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Tracing Engine**: VTracer (WASM-based)

## ⚡ Quick Start

### Installation

```bash
bun install
```

### Development

```bash
bun dev
```

### Production Build

```bash
bun run build.ts
# Followed by
bun start
```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ by [rayanfer32](https://github.com/rayanfer32)

## Credits

- Google antigravity (All the complex to trace the svg code)
- This project was possible using (give it a star) https://github.com/visioncortex/vtracer/
