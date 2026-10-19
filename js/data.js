/* ============================================================
   薄肌 · 数据层
   课表 / 训练 / 饮食 / 长高 / 任务定义
   ============================================================ */

window.APP_DATA = (function () {
  "use strict";

  /* ---------- 节次时间（可按自己学校改） ---------- */
  const PERIODS = [
    { n: 1, start: "08:00", end: "08:45" },
    { n: 2, start: "08:55", end: "09:40" },
    { n: 3, start: "10:00", end: "10:45" },
    { n: 4, start: "10:55", end: "11:40" },
    { n: 5, start: "14:00", end: "14:45" },
    { n: 6, start: "14:55", end: "15:40" },
    { n: 7, start: "16:00", end: "16:45" },
    { n: 8, start: "16:55", end: "17:40" },
    { n: 9, start: "19:00", end: "19:45" },
    { n: 10, start: "19:55", end: "20:40" },
  ];

  /* ---------- 课程 ----------
     day: 1=周一 … 7=周日
     weeks: 'all' | 'odd'(单周) | 'even'(双周)
  ------------------------------------ */
  const COURSES = [
    // 周一：无课（留白给机器学习和训练）
    { id: "c01", name: "工程力学", day: 2, start: 1, end: 2, room: "教二-101", weeks: "all", color: "blue" },
    { id: "c02", name: "大学物理(B)II", day: 2, start: 3, end: 4, room: "教六-201", weeks: "all", color: "violet" },
    { id: "c03", name: "画法几何与工程制图基础", day: 2, start: 6, end: 7, room: "教二-107", weeks: "all", color: "teal" },
    { id: "c04", name: "影视艺术鉴赏与导论", day: 2, start: 8, end: 10, room: "教七-203", weeks: "all", color: "pink" },
    // 注：第4周「实验室安全与准入」为临时调课，与影视鉴赏冲突，未放入常规课表。
    // 需要时在课表页「加课」里手动添加即可。

    { id: "c06", name: "体育III（游泳）", day: 3, start: 3, end: 4, room: "游泳馆", weeks: "all", color: "green" },
    { id: "c07", name: "马克思主义基本原理", day: 3, start: 6, end: 8, room: "教六-202", weeks: "all", color: "red" },

    { id: "c08", name: "材料科学基础(B)(上)", day: 4, start: 3, end: 5, room: "教七-104", weeks: "all", color: "cyan", note: "全英文授课" },
    { id: "c09", name: "大学物理实验", day: 4, start: 6, end: 7, room: "物理实验中心", weeks: "even", color: "slate", note: "双周周四下午" },

    { id: "c10", name: "大学物理(B)II", day: 5, start: 1, end: 2, room: "教六-201", weeks: "all", color: "violet" },
    { id: "c11", name: "画法几何与工程制图基础", day: 5, start: 3, end: 4, room: "教二-107", weeks: "all", color: "teal" },
    { id: "c12", name: "工程力学", day: 5, start: 6, end: 7, room: "教二-101", weeks: "all", color: "blue" },
    { id: "c13", name: "形势与政策(3)", day: 5, start: 9, end: 10, room: "教四-401", weeks: "all", color: "amber" },
  ];

  /* ---------- 每日任务定义 ---------- */
  const TASKS = [
    { key: "wake", label: "早起", meta: "06:10 起床 · 不赖床", icon: "sun", color: "amber" },
    { key: "es", label: "西班牙语", meta: "40 分钟 · 晨读 + Anki + 跟读", icon: "lang", color: "orange" },
    { key: "ml", label: "机器学习", meta: "120 分钟 · 专注计时", icon: "brain", color: "blue" },
    { key: "train", label: "训练", meta: "按今日计划完成", icon: "dumbbell", color: "red" },
    { key: "diet", label: "饮食", meta: "三餐达标 · 蛋白 120g", icon: "bowl", color: "green" },
    { key: "water", label: "饮水", meta: "2500 ml · 8 杯", icon: "drop", color: "cyan" },
    { key: "stretch", label: "拉伸悬垂", meta: "10 分钟 · 体态 + 拔高", icon: "stretch", color: "violet" },
    { key: "sleep", label: "早睡", meta: "23:00 前入睡 · 睡够 8 小时", icon: "moon", color: "indigo" },
  ];

  /* ---------- 训练计划 ----------
     目标：薄肌（低体脂 + 清晰线条），而非围度
  ------------------------------------ */
  const WORKOUTS = {
    1: {
      key: "push", name: "推 · 胸肩三头", tag: "上肢推力", duration: 50, kcal: 320,
      warm: "跳绳 2 分钟 + 肩绕环 20 次 + 俯卧撑 10 个热身",
      items: [
        { name: "俯卧撑", sets: "4 × 12-15", rest: "60s", cue: "核心收紧，肘部与身体成 45°" },
        { name: "哑铃卧推", sets: "4 × 10-12", rest: "75s", cue: "下放到胸口两侧，别塌腰" },
        { name: "哑铃肩推", sets: "3 × 12", rest: "60s", cue: "不耸肩，推到头正上方" },
        { name: "哑铃侧平举", sets: "3 × 15", rest: "45s", cue: "小重量，肘微屈，抬到与肩平" },
        { name: "窄距俯卧撑", sets: "3 × 10-12", rest: "60s", cue: "手比肩窄，练三头" },
        { name: "平板支撑", sets: "3 × 45s", rest: "45s", cue: "臀不塌不翘，呼吸别憋" },
      ],
    },
    2: {
      key: "pull", name: "拉 · 背二头", tag: "上肢拉力", duration: 50, kcal: 310,
      warm: "弹力带下拉 20 次 + 猫牛式 10 次 + 悬垂 30s",
      items: [
        { name: "引体向上", sets: "4 × 6-10", rest: "90s", cue: "做不了就用弹力带辅助，别甩" },
        { name: "哑铃划船", sets: "4 × 12", rest: "75s", cue: "肘贴身体拉向髋部，肩胛夹紧" },
        { name: "反向飞鸟", sets: "3 × 15", rest: "45s", cue: "改善圆肩，动作要慢" },
        { name: "哑铃弯举", sets: "3 × 12", rest: "60s", cue: "肘固定，别借腰" },
        { name: "死虫式", sets: "3 × 12/侧", rest: "45s", cue: "腰贴地，四肢缓慢伸展" },
      ],
    },
    3: {
      key: "swim", name: "游泳课 + 核心", tag: "有氧", duration: 90, kcal: 480,
      warm: "下水前活动肩颈和踝关节",
      items: [
        { name: "体育III 游泳", sets: "课堂 90 分钟", rest: "—", cue: "认真游，别泡水。自由泳为主" },
        { name: "卷腹", sets: "3 × 20", rest: "45s", cue: "下巴微收，靠腹肌卷起" },
        { name: "侧平板", sets: "3 × 30s/侧", rest: "45s", cue: "身体成一条直线" },
      ],
    },
    4: {
      key: "legs", name: "腿 · 臀腿", tag: "下肢", duration: 55, kcal: 380,
      warm: "开合跳 60 次 + 髋绕环 + 空蹲 15 次",
      items: [
        { name: "高脚杯深蹲", sets: "4 × 15", rest: "75s", cue: "膝盖对准脚尖，蹲到大腿平行" },
        { name: "保加利亚分腿蹲", sets: "3 × 12/腿", rest: "60s", cue: "重心在前脚，慢下快起" },
        { name: "罗马尼亚硬拉", sets: "4 × 12", rest: "75s", cue: "屈髋不屈腰，感受大腿后侧" },
        { name: "臀桥", sets: "3 × 20", rest: "45s", cue: "顶峰夹臀 2 秒" },
        { name: "提踵", sets: "4 × 20", rest: "40s", cue: "慢下快起，练小腿线条" },
        { name: "靠墙静蹲", sets: "3 × 45s", rest: "45s", cue: "膝盖 90°，背贴墙" },
      ],
    },
    5: {
      key: "hiit", name: "全身循环 HIIT", tag: "燃脂", duration: 35, kcal: 350,
      warm: "动态拉伸 5 分钟，心率拉起来",
      items: [
        { name: "波比跳", sets: "4 × 10", rest: "30s", cue: "落地缓冲，别砸膝盖" },
        { name: "高抬腿", sets: "4 × 30s", rest: "30s", cue: "膝盖过腰，摆臂" },
        { name: "登山跑", sets: "4 × 30s", rest: "30s", cue: "肩在手腕正上方，别塌腰" },
        { name: "开合跳", sets: "4 × 40s", rest: "20s", cue: "落地轻，前脚掌着地" },
        { name: "平板支撑", sets: "3 × 60s", rest: "45s", cue: "收腹夹臀，别憋气" },
      ],
    },
    6: {
      key: "cardio", name: "有氧 + 核心", tag: "心肺", duration: 50, kcal: 400,
      warm: "快走 5 分钟",
      items: [
        { name: "慢跑 / 跳绳", sets: "30-40 分钟", rest: "—", cue: "心率 130-145，能说话但唱不了歌" },
        { name: "悬垂", sets: "4 × 30s", rest: "30s", cue: "全身放松，靠重力拉开脊柱" },
        { name: "卷腹", sets: "3 × 20", rest: "45s", cue: "慢起慢落" },
        { name: "俄罗斯转体", sets: "3 × 20", rest: "45s", cue: "腹斜肌，脚可着地" },
      ],
    },
    7: {
      key: "rest", name: "休息 · 拉伸", tag: "恢复", duration: 20, kcal: 60,
      warm: "热水澡后做效果最好",
      items: [
        { name: "全身拉伸", sets: "10 分钟", rest: "—", cue: "每个部位 30 秒，不弹震" },
        { name: "悬垂", sets: "3 × 30s", rest: "30s", cue: "放松肩背" },
        { name: "靠墙站立", sets: "3 分钟", rest: "—", cue: "后脑、肩胛、臀、脚跟贴墙" },
      ],
    },
  };

  /* ---------- 长高 / 体态方案（每天 10 分钟） ---------- */
  const STRETCH = [
    { name: "悬垂", sets: "3 × 30s", cue: "单杠全握，身体放松下沉，拉开椎间隙" },
    { name: "猫牛式", sets: "10 次", cue: "配合呼吸，活动整条脊柱" },
    { name: "胸椎伸展", sets: "2 × 30s", cue: "泡沫轴垫背或门框拉伸，改善圆肩" },
    { name: "眼镜蛇式", sets: "3 × 20s", cue: "手撑地抬起上身，别耸肩" },
    { name: "靠墙站立", sets: "3 分钟", cue: "后脑/肩胛/臀/脚跟四点贴墙，收下巴" },
    { name: "婴儿式", sets: "1 分钟", cue: "放松下背，睡前做" },
  ];

  /* ---------- 饮食：3 套轮换（食堂可执行，清淡少油） ---------- */
  const MEAL_PLANS = [
    {
      name: "A 套 · 燕麦日",
      kcal: 2120, protein: 124,
      meals: [
        { time: "06:50", name: "早餐", kcal: 520, protein: 28, items: ["燕麦 50g + 牛奶 300ml", "水煮蛋 2 个", "小番茄 1 把"] },
        { time: "12:00", name: "午餐", kcal: 760, protein: 46, items: ["米饭 150g（熟重，约一平碗）", "清蒸鸡胸 / 白灼鱼 150g", "两份绿叶菜（过水去油）", "紫菜蛋花汤（少盐）"] },
        { time: "17:30", name: "晚餐", kcal: 600, protein: 38, items: ["杂粮饭 100g", "北豆腐 150g 或虾 120g", "炒时蔬 300g（少油）", "别在 19:00 后吃"] },
        { time: "21:00", name: "加餐", kcal: 240, protein: 12, items: ["无糖酸奶 200g", "蓝莓 / 苹果 1 个"] },
      ],
    },
    {
      name: "B 套 · 面食日",
      kcal: 2100, protein: 121,
      meals: [
        { time: "06:50", name: "早餐", kcal: 500, protein: 26, items: ["全麦馒头 1 个 + 无糖豆浆 400ml", "水煮蛋 2 个", "凉拌黄瓜"] },
        { time: "12:00", name: "午餐", kcal: 750, protein: 45, items: ["米饭 120g + 玉米半根", "番茄炖牛腩（去浮油）150g", "清炒西兰花 200g", "冬瓜汤"] },
        { time: "17:30", name: "晚餐", kcal: 600, protein: 36, items: ["荞麦面 100g（干重）", "鸡丝 / 卤牛肉 120g", "焯青菜 250g", "少放酱油和辣油"] },
        { time: "21:00", name: "加餐", kcal: 250, protein: 14, items: ["水煮蛋 1 个", "原味坚果 10g（约 7 颗杏仁）"] },
      ],
    },
    {
      name: "C 套 · 粗粮日",
      kcal: 2140, protein: 126,
      meals: [
        { time: "06:50", name: "早餐", kcal: 510, protein: 27, items: ["玉米 1 根 + 无糖酸奶 200g", "水煮蛋 2 个", "生菜沙拉（油醋汁）"] },
        { time: "12:00", name: "午餐", kcal: 770, protein: 48, items: ["杂粮饭 150g", "白灼虾 150g 或清蒸鱼", "蒜蓉菠菜 200g", "两份素菜任选"] },
        { time: "17:30", name: "晚餐", kcal: 610, protein: 37, items: ["红薯 200g", "鸡胸肉 120g（煎/煮）", "大份蔬菜汤", "豆腐 100g"] },
        { time: "21:00", name: "加餐", kcal: 250, protein: 14, items: ["蛋白粉 1 勺（兑水）", "香蕉半根"] },
      ],
    },
  ];

  /* ---------- 每日原则 ---------- */
  const RULES = {
    eat: [
      "每餐先吃蛋白，再吃菜，最后吃主食 —— 血糖稳、不容易饿",
      "食堂菜过一遍热水，能去掉一半的油",
      "戒掉奶茶、含糖饮料、油炸、夜宵，这四样是薄肌的头号敌人",
      "每天 2500ml 水，训练日加到 3000ml",
      "蛋白目标 120g：约等于 3 个鸡蛋 + 300ml 牛奶 + 200g 肉 + 1 勺蛋白粉",
    ],
    grow: [
      "23:00 前睡，生长激素在深睡期分泌 —— 熬夜是长高最大的敌人",
      "每天 500ml 牛奶 + 1 个鸡蛋，补钙和优质蛋白",
      "维生素 D3 每天 1000-2000 IU（室内党几乎都缺）",
      "别驼背、别跷二郎腿、别长时间低头 —— 体态矫正能立刻多出 1-3cm 视觉身高",
      "每天悬垂 + 跳跃，给脊柱和下肢纵向刺激",
    ],
    truth: [
      "19-20 岁骨骺线大概率已闭合，靠训练「长骨头」的空间有限，别信增高药和拉伸神器。",
      "真正能拿到的是：体态矫正（圆肩驼背 -2cm 是常态）+ 脊柱减压 + 骨密度。",
      "把目标定成「站直了看起来 172-173」，比幻想 180 现实得多，也更容易达成。",
    ],
  };

  /* ---------- 西班牙语每日配方 ---------- */
  const SPANISH = [
    { name: "Anki 复习", min: 15, cue: "先清昨天的卡片，别加新词" },
    { name: "新课 / 语法", min: 15, cue: "一次只啃一个点，比如 ser vs estar" },
    { name: "影子跟读", min: 10, cue: "跟读 1 分钟音频，模仿语调而不是背单词" },
  ];

  /* ---------- 机器学习每日配方 ---------- */
  const ML_PLAN = [
    { name: "看课 / 读材料", min: 50, cue: "一次一个概念，别开十个标签页" },
    { name: "动手写代码", min: 50, cue: "必须跑通，抄一遍也算数" },
    { name: "记笔记 / 复盘", min: 20, cue: "用自己的话写 5 行，写不出来就是没懂" },
  ];

  /* ---------- 课程色板 ---------- */
  const COLORS = {
    blue: { bg: "#E8EFFC", fg: "#2C5AA8", bar: "#4C7FD4" },
    violet: { bg: "#EEEAFB", fg: "#5B3FA8", bar: "#7C5CD6" },
    teal: { bg: "#E2F3F0", fg: "#1B6B60", bar: "#2E9184" },
    pink: { bg: "#FCE9EF", fg: "#A63A5E", bar: "#D45C82" },
    amber: { bg: "#FDF0DC", fg: "#9A6512", bar: "#D99A2B" },
    green: { bg: "#E6F3E7", fg: "#2C6B34", bar: "#4E9455" },
    red: { bg: "#FCE8E6", fg: "#A3342B", bar: "#CF5A4E" },
    cyan: { bg: "#E3F2F8", fg: "#1F6A85", bar: "#3E93B3" },
    slate: { bg: "#ECEEF2", fg: "#4A5568", bar: "#6B7A90" },
  };

  return { PERIODS, COURSES, TASKS, WORKOUTS, STRETCH, MEAL_PLANS, RULES, SPANISH, ML_PLAN, COLORS };
})();
