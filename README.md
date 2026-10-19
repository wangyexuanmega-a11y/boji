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

## 装 APK

**直接下载：**

https://github.com/wangyexuanmega-a11y/boji/releases/download/v1.0.0/boji-v1.0.apk

手机浏览器打开就能下（4 MB）。下载完点开安装，Android 会提示「未知来源」，允许一次即可。

这是 debug 签名版本，自己用没问题，不能上应用商店。

### 改完代码怎么重新打包

环境已经装好（JDK 17 + Android SDK 在 `C:/Users/lenovo/abuild/`）：

```bash
cd 薄肌
# 1. 同步网页文件
rm -rf www && mkdir -p www
cp index.html manifest.webmanifest sw.js www/
cp -r css js icons www/

# 2. 同步到 Android 工程
npx cap sync android

# 3. 打包
cd android
export JAVA_HOME="C:/Users/lenovo/abuild/jdk"
export ANDROID_HOME="C:/Users/lenovo/abuild/sdk"
./gradlew assembleDebug --no-daemon

# 产物：android/app/build/outputs/apk/debug/app-debug.apk
```

从零开始的话需要装 JDK 17 + Android cmdline-tools，`tools/to-apk.sh` 里有流程。

**注意**：Gradle 会拒绝中文路径。项目已经在 `android/gradle.properties` 里加了
`android.overridePathCheck=true` 绕过，如果还是报错，把项目移到纯英文路径再构建。

## 怎么改

**改课表**：App 里点课程块直接编辑；或者改 `js/data.js` 的 `COURSES` 数组。

`weeks` 字段支持这些写法：

| 写法 | 含义 |
|---|---|
| `"1-16"` | 第 1 到 16 周都上 |
| `"1-12"` | 第 1 到 12 周 |
| `"11"` | 只有第 11 周 |
| `"2-16双"` | 2 到 16 周的双周 |
| `"1-16单"` | 1 到 16 周的单周 |
| `"all"` | 每周都上 |

`day` 1-7 对应周一到周日，`start`/`end` 是节次（1-13）。`teacher` 会显示在课程详情里。

**改节次时间**：`js/data.js` 的 `PERIODS`。当前是东南大学的时间：
1 节 08:00-08:45，上午 5 节到 12:15，下午 6-10 节 14:00-18:15，晚上 11-13 节 19:00-21:25。

**改训练**：`js/data.js` 的 `WORKOUTS`，键 1-7 对应周一到周日。

**改饮食**：`js/data.js` 的 `MEAL_PLANS`，三套按日期自动轮换。

**改作息和目标**：App 里「数据 → 设置」，存本地。



**单双周算错了**：去「数据 → 设置 → 学期起始日」，填第 1 周的周一。

## 数据

全部存在浏览器的 `localStorage`（key: `boji.state.v1`）。换手机、清缓存、换浏览器都会丢。

**每周日点一次「数据 → 导出备份」**，存个 json 到网盘。换设备时用「导入备份」恢复。

## 一点实话

- 170cm / 68.5kg，BMI 23.7，属于正常偏上。想练薄肌，核心是**把体脂降到 15% 左右**，不是把胸练大。
- 每天 2150 kcal、蛋白 120g，是给你留了轻微缺口的方案，大概每周掉 0.4-0.5kg。掉太快会掉肌肉。
- 19-20 岁骨骺线大概率闭合了，**训练长不高**。能拿到的是体态矫正（圆肩驼背矫正回来，视觉上能多 1-3cm）和骨密度。别买增高药。
- 这个 App 只做一件事：让你每天有个东西盯着你。数据不会骗人。
