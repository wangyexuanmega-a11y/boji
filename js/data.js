/* ============================================================
   薄肌 · 数据层
   课表 / 训练 / 饮食 / 长高 / 任务定义
   ============================================================ */

window.APP_DATA = (function () {
  "use strict";

  /* ---------- 节次时间（东南大学 2026-2027 秋） ---------- */
  const PERIODS = [
    { n: 1, start: "08:00", end: "08:45" },
    { n: 2, start: "08:50", end: "09:35" },
    { n: 3, start: "09:50", end: "10:35" },
    { n: 4, start: "10:40", end: "11:25" },
    { n: 5, start: "11:30", end: "12:15" },
    { n: 6, start: "14:00", end: "14:45" },
    { n: 7, start: "14:50", end: "15:35" },
    { n: 8, start: "15:50", end: "16:35" },
    { n: 9, start: "16:40", end: "17:25" },
    { n: 10, start: "17:30", end: "18:15" },
    { n: 11, start: "19:00", end: "19:45" },
    { n: 12, start: "19:50", end: "20:35" },
    { n: 13, start: "20:40", end: "21:25" },
  ];

  /* ---------- 课程 ----------
     day: 1=周一 … 7=周日
     weeks: "all" | "1-14" | "11" | "2-16双" | "1-16单"
  ------------------------------------ */
  const COURSES = [
    // 周一
    { id: "c01", name: "高阶外语", day: 1, start: 3, end: 4, room: "教七-205", teacher: "王卓文", weeks: "1-12", color: "amber" },
    { id: "c02", name: "物理化学(D)(上)", day: 1, start: 6, end: 7, room: "教二-312", teacher: "沈彬", weeks: "1-16", color: "red" },
    { id: "c03", name: "实验室安全与准入", day: 1, start: 8, end: 9, room: "教一-103", teacher: "陈春", weeks: "1-5", color: "slate" },
    { id: "c04", name: "科技论文读写", day: 1, start: 8, end: 9, room: "教一-103", teacher: "孙文文", weeks: "6-13", color: "teal" },

    // 周二
    { id: "c05", name: "工程力学", day: 2, start: 1, end: 2, room: "教二-101", teacher: "汤轶群", weeks: "1-14", color: "blue" },
    { id: "c06", name: "大学物理(B)II", day: 2, start: 3, end: 4, room: "教六-201", teacher: "庞侯荣", weeks: "1-16", color: "violet" },
    { id: "c07", name: "画法几何与工程制图基础", day: 2, start: 6, end: 7, room: "教二-107", teacher: "郭志君", weeks: "1-14", color: "teal" },
    { id: "c08", name: "影视艺术鉴赏与导论", day: 2, start: 8, end: 10, room: "教七-203", teacher: "田兆耀", weeks: "1-10", color: "pink" },
    { id: "c09", name: "影视艺术鉴赏与导论", day: 2, start: 8, end: 9, room: "教七-203", teacher: "田兆耀", weeks: "11", color: "pink" },

    // 周三
    { id: "c10", name: "体育III（游泳）", day: 3, start: 3, end: 4, room: "游泳馆", teacher: "郭璠", weeks: "1-16", color: "green" },
    { id: "c11", name: "马克思主义基本原理", day: 3, start: 6, end: 8, room: "教六-202", teacher: "郝娜", weeks: "1-16", color: "red" },

    // 周四
    { id: "c12", name: "材料科学基础(B)(上)", day: 4, start: 3, end: 5, room: "教七-104", teacher: "孙正明、张培根", weeks: "1-16", color: "cyan", note: "全英文授课" },
    { id: "c13", name: "大学物理实验(理工)II", day: 4, start: 6, end: 9, room: "田家炳南楼 3-5 楼", teacher: "安明", weeks: "2-16双", color: "slate" },

    // 周五
    { id: "c14", name: "大学物理(B)II", day: 5, start: 1, end: 2, room: "教六-201", teacher: "庞侯荣", weeks: "1-16", color: "violet" },
    { id: "c15", name: "画法几何与工程制图基础", day: 5, start: 3, end: 4, room: "教二-107", teacher: "郭志君", weeks: "1-13", color: "teal" },
    { id: "c16", name: "工程力学", day: 5, start: 6, end: 7, room: "教二-101", teacher: "汤轶群", weeks: "1-14", color: "blue" },
    { id: "c17", name: "形势与政策(3)", day: 5, start: 9, end: 10, room: "教四-401", teacher: "徐进", weeks: "5-8", color: "amber" },
  ];

  /* ---------- 每日任务定义 ---------- */
  const TASKS = [
    { key: "wake", label: "早起", meta: "闹钟响了就起，别赖床", icon: "sun", color: "amber" },
    { key: "es", label: "西班牙语", meta: "多邻国 · 完成今日任务", icon: "lang", color: "orange" },
    { key: "ml", label: "机器学习", meta: "120 分钟 · 专注计时", icon: "brain", color: "blue" },
    { key: "train", label: "训练", meta: "按今日计划完成", icon: "dumbbell", color: "red" },
    { key: "diet", label: "饮食", meta: "三餐达标 · 蛋白 120g", icon: "bowl", color: "green" },
    { key: "water", label: "饮水", meta: "2500 ml · 8 杯", icon: "drop", color: "cyan" },
    { key: "stretch", label: "拉伸悬垂", meta: "10 分钟 · 体态 + 拔高", icon: "stretch", color: "violet" },
    { key: "sleep", label: "早睡", meta: "23:00 前入睡 · 睡够 8 小时", icon: "moon", color: "indigo" },
  ];

  /* ---------- 训练计划 ----------
     零器械版本：宿舍 / 操场 / 游泳馆，不用买任何东西
     目标：薄肌（低体脂 + 清晰线条），不是练大
  ------------------------------------ */
  const WORKOUTS = {
    1: {
      key: "push", name: "推 · 胸肩三头", tag: "上肢推", duration: 40, kcal: 280,
      warm: "开合跳 60 次 + 肩绕环 20 次 + 跪姿俯卧撑 10 个",
      items: [
        { name: "俯卧撑", sets: "4 × 力竭前留 2 个", rest: "75s", cue: "标准做不了就手撑床沿/桌边，越高越轻松" },
        { name: "上斜俯卧撑", sets: "3 × 12", rest: "60s", cue: "脚在地上，手撑高一点，练下胸" },
        { name: "Pike 俯卧撑", sets: "3 × 8-10", rest: "60s", cue: "屁股撅高成倒 V，头顶往下贴地，练肩" },
        { name: "钻石俯卧撑", sets: "3 × 8", rest: "60s", cue: "双手拇指食指相触，肘贴身体，练三头" },
        { name: "椅子臂屈伸", sets: "3 × 10", rest: "60s", cue: "背对椅子手撑边缘，屈肘下沉，别耸肩" },
        { name: "平板支撑", sets: "3 × 40s", rest: "45s", cue: "收腹夹臀，别塌腰别撅屁股" },
      ],
    },
    2: {
      key: "legs", name: "腿 · 深蹲 + 引体预备", tag: "下肢", duration: 45, kcal: 320,
      warm: "开合跳 60 次 + 髋绕环 10 次 + 徒手深蹲 15 个",
      items: [
        { name: "徒手深蹲", sets: "4 × 20", rest: "60s", cue: "膝盖对准脚尖，蹲到大腿平行地面，慢下快起" },
        { name: "箭步蹲", sets: "3 × 12/腿", rest: "60s", cue: "前膝不超过脚尖，后膝轻触地" },
        { name: "保加利亚分腿蹲", sets: "3 × 10/腿", rest: "60s", cue: "后脚搭床沿，重心全在前脚，这个很酸" },
        { name: "臀桥", sets: "3 × 20", rest: "45s", cue: "脚跟着地，顶到最高夹紧臀 2 秒" },
        { name: "单腿臀桥", sets: "3 × 10/腿", rest: "45s", cue: "一条腿伸直，骨盆别歪" },
        { name: "提踵", sets: "4 × 25", rest: "40s", cue: "站台阶边缘，脚跟下沉再顶起，练小腿线条" },
        { name: "悬垂", sets: "3 × 20s", rest: "45s", cue: "引体预备第一步，先把握力练出来" },
      ],
    },
    3: {
      key: "swim", name: "游泳课 + 核心", tag: "有氧", duration: 90, kcal: 480,
      warm: "下水前活动肩颈、踝关节，做 10 个深蹲",
      items: [
        { name: "体育III 游泳", sets: "课堂 90 分钟", rest: "—", cue: "认真游，别泡水。自由泳为主，蛙泳换着来" },
        { name: "卷腹", sets: "3 × 15", rest: "45s", cue: "下巴微收，靠腹肌把肩胛卷离地" },
        { name: "侧平板", sets: "3 × 30s/侧", rest: "45s", cue: "身体成一条直线，别塌胯" },
        { name: "死虫式", sets: "3 × 10/侧", rest: "45s", cue: "腰始终贴地，四肢缓慢伸展" },
      ],
    },
    4: {
      key: "pull", name: "拉 · 背 + 引体预备", tag: "上肢拉", duration: 40, kcal: 260,
      warm: "猫牛式 10 次 + 肩胛绕环 + 悬垂 20s",
      items: [
        { name: "反向划船", sets: "4 × 8-12", rest: "75s", cue: "躺桌子底下抓桌沿，身体绷直往上拉，脚越前越难" },
        { name: "毛巾划船", sets: "3 × 12", rest: "60s", cue: "毛巾套门把手，身体后倾，肘贴身体拉向腰" },
        { name: "肩胛引体", sets: "3 × 8", rest: "60s", cue: "直臂挂在杠上，只靠肩胛下沉把身体提起 3cm" },
        { name: "离心引体", sets: "3 × 3-5", rest: "90s", cue: "跳上去让下巴过杠，然后用 5 秒慢慢放下，这是关键" },
        { name: "俯身 Y 字伸展", sets: "3 × 12", rest: "45s", cue: "趴地上手臂成 Y 举起来，改善圆肩" },
        { name: "超人式", sets: "3 × 15", rest: "45s", cue: "趴地同时抬起手脚，停 2 秒" },
      ],
    },
    5: {
      key: "run", name: "跑步 + 核心", tag: "心肺", duration: 45, kcal: 400,
      warm: "快走 5 分钟 + 高抬腿 30 秒",
      items: [
        { name: "慢跑", sets: "30-40 分钟", rest: "—", cue: "心率 130-145，能说话但唱不了歌，别冲太快" },
        { name: "平板支撑", sets: "3 × 45s", rest: "45s", cue: "跑完做，核心稳了跑姿才不塌" },
        { name: "登山跑", sets: "3 × 30s", rest: "30s", cue: "肩在手腕正上方，膝盖往胸口收" },
        { name: "卷腹", sets: "3 × 15", rest: "45s", cue: "慢起慢落，别用脖子发力" },
      ],
    },
    6: {
      key: "circuit", name: "全身循环", tag: "燃脂", duration: 30, kcal: 330,
      warm: "动态拉伸 5 分钟，心率拉起来",
      items: [
        { name: "开合跳", sets: "4 × 40s", rest: "20s", cue: "落地轻，前脚掌着地" },
        { name: "深蹲跳", sets: "4 × 12", rest: "30s", cue: "蹲下去跳起来，落地屈膝缓冲" },
        { name: "波比跳", sets: "4 × 8", rest: "30s", cue: "做不动就去掉跳的部分，先求动作完整" },
        { name: "高抬腿", sets: "4 × 30s", rest: "30s", cue: "膝盖过腰，摆臂" },
        { name: "登山跑", sets: "4 × 30s", rest: "30s", cue: "别塌腰，核心收紧" },
        { name: "平板支撑", sets: "3 × 45s", rest: "45s", cue: "收腹夹臀，别憋气" },
      ],
    },
    7: {
      key: "rest", name: "休息 · 拉伸", tag: "恢复", duration: 20, kcal: 60,
      warm: "洗个热水澡再做，肌肉更松",
      items: [
        { name: "全身拉伸", sets: "10 分钟", rest: "—", cue: "每个部位 30 秒，不弹震" },
        { name: "悬垂", sets: "3 × 30s", rest: "30s", cue: "放松肩背，顺便拉开脊柱" },
        { name: "靠墙站立", sets: "3 分钟", rest: "—", cue: "后脑、肩胛、臀、脚跟四点贴墙" },
      ],
    },
  };

  /* ---------- 引体向上 0 → 1 进阶 ---------- */
  const PULLUP_STAGES = [
    {
      stage: "第 1-2 周", name: "死挂 + 肩胛",
      items: ["悬垂 3 × 20 秒（握不住就 15 秒）", "肩胛引体 3 × 8（只下沉肩胛，手臂不弯）"],
      goal: "能挂满 30 秒不松手",
    },
    {
      stage: "第 3-4 周", name: "离心 + 水平拉",
      items: ["离心引体 3 × 3（跳上去，5 秒慢放）", "反向划船 3 × 10（桌子底下）"],
      goal: "离心能控制 5 秒不失控",
    },
    {
      stage: "第 5-8 周", name: "辅助引体",
      items: ["弹力带辅助引体 3 × 5（脚踩带子）", "离心引体 3 × 5（放慢到 7 秒）"],
      goal: "弹力带辅助能做 5 个",
    },
    {
      stage: "第 9 周起", name: "第一个",
      items: ["标准引体 5 × 1-2（每次只做 1 个也行）", "每周测一次最大次数"],
      goal: "1 个标准引体",
    },
  ];

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
      name: "A 套 · 鸡蛋打底",
      kcal: 2100, protein: 127,
      meals: [
        { time: "06:50", name: "早餐", kcal: 580, protein: 37, items: ["水煮蛋 3 个（食堂一定有）", "豆浆 400ml（无糖）", "肉包 1 个 或 馒头 1 个"] },
        { time: "12:00", name: "午餐", kcal: 620, protein: 38, items: ["米饭一平碗（约 150g）", "鸡腿 2 个，去皮（没有就换鱼块 / 卤牛肉）", "素菜 2 份：青菜、白菜、冬瓜都行", "汤一碗，先喝"] },
        { time: "17:30", name: "晚餐", kcal: 490, protein: 35, items: ["米饭半碗（约 100g）", "豆腐 1 份（约 200g）", "鸡蛋 2 个", "青菜 1 大份"] },
        { time: "21:00", name: "加餐", kcal: 410, protein: 17, items: ["纯牛奶 500ml（宿舍常备一箱）", "香蕉 1 根"] },
      ],
    },
    {
      name: "B 套 · 鱼和豆腐",
      kcal: 2080, protein: 124,
      meals: [
        { time: "06:50", name: "早餐", kcal: 555, protein: 34, items: ["水煮蛋 3 个", "纯牛奶 300ml", "玉米 1 根 或 红薯 1 个"] },
        { time: "12:00", name: "午餐", kcal: 590, protein: 40, items: ["米饭一平碗", "清蒸鱼 / 红烧鱼块 1 份（约 150g）", "素菜 2 份，其中一份要深色叶菜", "紫菜蛋花汤"] },
        { time: "17:30", name: "晚餐", kcal: 625, protein: 35, items: ["面条 1 碗（干重约 100g）", "鸡蛋 2 个", "豆腐 1 份", "烫青菜 1 份"] },
        { time: "21:00", name: "加餐", kcal: 310, protein: 15, items: ["酸奶 200g（有糖的也行，别超过这个量）", "苹果 1 个"] },
      ],
    },
    {
      name: "C 套 · 省钱豆制品",
      kcal: 2110, protein: 126,
      meals: [
        { time: "06:50", name: "早餐", kcal: 540, protein: 37, items: ["水煮蛋 3 个", "豆浆 500ml（无糖）", "红薯 1 个 或 玉米 1 根"] },
        { time: "12:00", name: "午餐", kcal: 620, protein: 36, items: ["米饭一平碗半", "家常豆腐 / 麻婆豆腐 1 份（约 200g）", "瘦肉丝 50g 或 鸡丁少量", "素菜 2 份"] },
        { time: "17:30", name: "晚餐", kcal: 700, protein: 38, items: ["馒头 1 个 + 米饭半碗", "豆腐 1 份（约 150g）", "鸡蛋 2 个", "蔬菜汤 1 大碗"] },
        { time: "21:00", name: "加餐", kcal: 250, protein: 15, items: ["纯牛奶 250ml", "花生米 15g（一小把）"] },
      ],
    },
  ];

  /* ---------- 食堂替换表：没有就换，别硬找 ---------- */
  const SWAPS = [
    { miss: "鸡胸肉", use: "鸡腿去皮 / 卤牛肉 / 鱼块 / 虾，蛋白一样" },
    { miss: "牛肉太贵", use: "鸡蛋 + 豆腐顶上，蛋白照样够" },
    { miss: "西兰花", use: "任何绿叶菜：青菜、白菜、菠菜、油麦菜" },
    { miss: "燕麦 / 全麦", use: "玉米、红薯、馒头、包子，主食别断" },
    { miss: "无糖酸奶", use: "纯牛奶、无糖豆浆" },
    { miss: "蛋白粉", use: "不用买。一天 3-4 个蛋 + 豆腐就够 120g" },
    { miss: "杂粮饭", use: "白米饭减到一平碗，效果差不了多少" },
  ];

  /* ---------- 食堂怎么点 ---------- */
  const CANTEEN = [
    "先打一碗汤喝掉，占胃，后面自然吃得少",
    "一荤两素：荤菜选蒸、煮、白灼、红烧，避开油炸和糖醋",
    "菜在汤里涮一下再吃，能去掉表面一半的油",
    "米饭一平碗（约 150g），不够就用蔬菜填，别加饭",
    "晚饭 19:00 前吃完，之后只喝水",
    "自己囤：牛奶、鸡蛋、黄瓜、西红柿。宿舍能放，随时补蛋白",
  ];

  /* ---------- 每日原则 ---------- */
  const RULES = {
    eat: [
      "每餐先吃蛋白，再吃菜，最后吃主食 —— 血糖稳、不容易饿",
      "食堂菜在汤里涮一下再吃，能去掉表面一半的油",
      "戒掉奶茶、含糖饮料、油炸、夜宵，这四样是薄肌的头号敌人",
      "每天 2500ml 水，训练日加到 3000ml",
      "蛋白 120g 的现实凑法：3-4 个鸡蛋 + 500ml 牛奶 + 2 份肉/鱼 + 1 份豆腐",
      "食堂肉不够就喝牛奶。一盒 250ml 就是 8g 蛋白，比找鸡胸肉容易",
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

  /* ---------- 西班牙语：只走多邻国 ---------- */
  const SPANISH = [
    { name: "每日目标", min: 15, cue: "打开就做，别挑时间，别挑状态" },
    { name: "错题复习", min: 5, cue: "错题本刷一遍，比开新课有用" },
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

  return {
    PERIODS, COURSES, TASKS, WORKOUTS, PULLUP_STAGES, STRETCH,
    MEAL_PLANS, SWAPS, CANTEEN, RULES, SPANISH, ML_PLAN, COLORS,
  };
})();
