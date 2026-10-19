#!/usr/bin/env bash
# 把网页打包成 Android APK 的一键脚本（Capacitor）
# 用法: bash tools/to-apk.sh
set -e

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "==> 1/5 清理并复制网页文件到 www/"
rm -rf www
mkdir -p www
cp index.html manifest.webmanifest sw.js "$ROOT/www/"
cp -r css js icons "$ROOT/www/"

echo "==> 2/5 初始化 npm 工程"
if [ ! -f package.json ]; then
  npm init -y > /dev/null
fi

echo "==> 3/5 安装 Capacitor（首次会比较慢）"
npm i @capacitor/core @capacitor/cli @capacitor/android

echo "==> 4/5 初始化 Android 工程"
if [ ! -f capacitor.config.json ]; then
  npx cap init "薄肌" "com.boji.app" --web-dir=www
fi
if [ ! -d android ]; then
  npx cap add android
fi
npx cap sync android

echo "==> 5/5 完成"
echo ""
echo "下一步："
echo "  npx cap open android     # 打开 Android Studio"
echo "  然后在 Android Studio 里：Build → Build Bundle(s)/APK(s) → Build APK(s)"
echo ""
echo "改完网页代码后重新打包："
echo "  bash tools/to-apk.sh && npx cap open android"
