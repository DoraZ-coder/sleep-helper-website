# PWA 图标生成指南

## 方法1：使用在线工具（推荐）

1. 访问 https://realfavicongenerator.net/ 或 https://www.pwabuilder.com/imageGenerator
2. 上传 `images/logo.png` 文件
3. 下载生成的所有尺寸图标
4. 将图标文件重命名并放到 `images/` 文件夹：
   - icon-72.png (72x72)
   - icon-96.png (96x96)
   - icon-128.png (128x128)
   - icon-144.png (144x144)
   - icon-152.png (152x152)
   - icon-192.png (192x192)
   - icon-384.png (384x384)
   - icon-512.png (512x512)

## 方法2：使用 ImageMagick（命令行）

如果你安装了 ImageMagick，可以运行：

```bash
cd images
magick logo.png -resize 72x72 icon-72.png
magick logo.png -resize 96x96 icon-96.png
magick logo.png -resize 128x128 icon-128.png
magick logo.png -resize 144x144 icon-144.png
magick logo.png -resize 152x152 icon-152.png
magick logo.png -resize 192x192 icon-192.png
magick logo.png -resize 384x384 icon-384.png
magick logo.png -resize 512x512 icon-512.png
```

## 临时方案

在生成正确尺寸的图标之前，manifest.json 会暂时使用 logo.png。
但为了最佳效果，请尽快生成正确尺寸的图标。

## 图标设计建议

- 使用简洁的设计，在小尺寸下也清晰可辨
- 确保图标在浅色和深色背景下都好看
- 使用 PNG 格式，支持透明背景
- 为 maskable 图标留出足够的安全区域（推荐图标占画布的 80%）
