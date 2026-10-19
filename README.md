# 薄肌 · 自律打卡

一个只服务一个人的打卡 App。纯静态、零依赖、数据存在本地。

- 西班牙语 40 分钟
- 机器学习 120 分钟（带专注计时器）
- 力量训练（推 / 拉 / 腿 / HIIT 分化）
- 清淡高蛋白饮食（3 套轮换）
- 长高 + 体态（悬垂、拉伸、睡眠）
- 课表自动排（单双周自动识别）

## 文件结构

```
index.html            入口
css/style.css         样式
js/data.js            课表、训练、饮食、长高方案（改这里）
js/app.js             逻辑（打卡、计时、渲染）
manifest.webmanifest  PWA 配置
sw.js                 离线缓存
icons/                图标
tools/                开发工具（图标生成、截图探针、APK 打包）
```

## 本地跑起来

```bash
python -m http.server 8765
# 打开 http://127.0.0.1:8765
```

不要直接双击 index.html，`file://` 下 Service Worker 和部分 API 不可用。

## 部署到 GitHub Pages

### 方式一：命令行（推荐）

```bash
cd 薄肌
git init
git add .
git commit -m "init: 薄肌打卡 App"

# 在 GitHub 上先建一个空仓库，比如 boji，然后：
git remote add origin https://github.com/<你的用户名>/boji.git
git branch -M main
git push -u origin main
```

推送后在仓库里：**Settings → Pages → Source 选 Deploy from a branch → Branch 选 main / (root) → Save**。

等 1 分钟，访问 `https://<你的用户名>.github.io/boji/`。

### 方式二：网页上传

GitHub 新建仓库 → Add file → Upload files → 把 `index.html`、`css/`、`js/`、`icons/`、`manifest.webmanifest`、`sw.js`、`.nojekyll` 拖进去 → Commit → 再去 Settings → Pages 开启。

### 装到手机主屏

- iPhone：Safari 打开链接 → 分享 → 添加到主屏幕
- Android：Chrome 打开链接 → 菜单 → 安装应用 / 添加到主屏幕

装完就是一个独立图标，全屏运行，断网也能用。

## 打包成 APK

```bash
# 需要 Node 18+ 和 Android Studio
cd 薄肌
bash tools/to-apk.sh
```

脚本会自动建 `www/` 目录、装 Capacitor、生成 Android 工程，然后你只需要在 Android Studio 里点 Build → Build APK。

首次打包要下载 Gradle 和 SDK，比较慢。之后每次改完网页代码，跑一次 `npx cap sync android` 再打包就行。

## 怎么改

**改课表**：App 里点课程块直接编辑；或者改 `js/data.js` 的 `COURSES` 数组。
`weeks` 字段：`"all"` 每周 / `"odd"` 单周 / `"even"` 双周。

**改训练**：`js/data.js` 的 `WORKOUTS`，键 1-7 对应周一到周日。

**改饮食**：`js/data.js` 的 `MEAL_PLANS`，三套按日期自动轮换。

**改作息和目标**：App 里「数据 → 设置」，存本地。

**改节次时间**：`js/data.js` 的 `PERIODS`，按你们学校的作息调。

**单双周算错了**：去「数据 → 设置 → 学期起始日」，填第 1 周的周一。

## 数据

全部存在浏览器的 `localStorage`（key: `boji.state.v1`）。换手机、清缓存、换浏览器都会丢。

**每周日点一次「数据 → 导出备份」**，存个 json 到网盘。换设备时用「导入备份」恢复。

## 一点实话

- 170cm / 68.5kg，BMI 23.7，属于正常偏上。想练薄肌，核心是**把体脂降到 15% 左右**，不是把胸练大。
- 每天 2150 kcal、蛋白 120g，是给你留了轻微缺口的方案，大概每周掉 0.4-0.5kg。掉太快会掉肌肉。
- 19-20 岁骨骺线大概率闭合了，**训练长不高**。能拿到的是体态矫正（圆肩驼背矫正回来，视觉上能多 1-3cm）和骨密度。别买增高药。
- 这个 App 只做一件事：让你每天有个东西盯着你。数据不会骗人。
