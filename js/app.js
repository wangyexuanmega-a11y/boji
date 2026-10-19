/* ============================================================
   薄肌 · 应用逻辑
   ============================================================ */
(function () {
  "use strict";

  var D = window.APP_DATA;
  var KEY = "boji.state.v1";
  var DAY_MS = 86400000;
  var WD_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  var WD_S = ["日", "一", "二", "三", "四", "五", "六"];
  var SHORT_TAG = { push: "推", pull: "拉", swim: "游泳", legs: "腿", hiit: "燃脂", cardio: "心肺", rest: "休息" };
  var COLOR_NAME = { blue: "蓝色", violet: "紫色", teal: "青色", pink: "粉色", amber: "橙色", green: "绿色", red: "红色", cyan: "天蓝", slate: "灰色" };

  var S = null;
  var activeTab = "today";
  var weekOffset = 0;      // 课表页偏移周
  var trainDayPick = null; // 训练页选中日 1-7
  var dietIdx = 0;         // 食谱轮换索引

  /* ================= 工具 ================= */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function ico(n) { return '<svg class="ico"><use href="#i-' + n + '"/></svg>'; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dstr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseD(s) { var p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function toMin(hhmm) { var p = hhmm.split(":").map(Number); return p[0] * 60 + p[1]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 1900);
  }

  /* ================= 状态 ================= */
  function defaultState() {
    return {
      v: 1,
      profile: {
        height: 170, weight: 68.5, targetWeight: 63.5, targetHeight: 172,
        dailyKcal: 2150, dailyProtein: 120, dailyWater: 2500
      },
      settings: {
        semesterStart: "2026-09-21",
        wakeTime: "06:10",
        sleepTime: "23:00",
        esMin: 40,
        mlMin: 120
      },
      courses: JSON.parse(JSON.stringify(D.COURSES)),
      days: {},
      body: [{ d: dstr(new Date()), w: 68.5, h: 170 }],
      createdAt: dstr(new Date())
    };
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw) {
      try {
        var s = JSON.parse(raw);
        if (s && s.profile && s.settings) return s;
      } catch (e) { /* 损坏则重建 */ }
    }
    return defaultState();
  }

  var saveTimer = null;
  function save(now) {
    if (now) { flushSave(); return; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 220);
  }
  function flushSave() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("保存失败：存储空间可能已满"); }
  }

  function dayRec(k, create) {
    if (!S.days[k]) {
      if (!create) return null;
      S.days[k] = { checks: {}, mlSec: 0, water: 0, workout: [], note: "" };
    }
    return S.days[k];
  }

  /* ================= 周次 ================= */
  function weekOf(date) {
    var start = parseD(S.settings.semesterStart);
    var a = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    var b = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    var days = Math.round((a - b) / DAY_MS);
    var w = Math.floor(days / 7) + 1;
    return { week: w, parity: w % 2 === 1 ? "odd" : "even", label: w % 2 === 1 ? "单周" : "双周" };
  }
  function isoDay(date) { var d = date.getDay(); return d === 0 ? 7 : d; }

  function period(n) {
    for (var i = 0; i < D.PERIODS.length; i++) if (D.PERIODS[i].n === n) return D.PERIODS[i];
    return { n: n, start: "--:--", end: "--:--" };
  }

  function coursesFor(date) {
    var p = weekOf(date).parity;
    var day = isoDay(date);
    return S.courses
      .filter(function (c) { return c.day === day && (c.weeks === "all" || c.weeks === p); })
      .sort(function (a, b) { return a.start - b.start; });
  }

  /* ================= 打卡判定 ================= */
  function isDone(k, key) {
    var r = S.days[k];
    if (!r) return false;
    if (key === "water") return (r.water || 0) >= S.profile.dailyWater;
    if (key === "ml") return (r.mlSec || 0) >= S.settings.mlMin * 60;
    if (key === "train") {
      var wo = D.WORKOUTS[isoDay(parseD(k))];
      if (!wo || !wo.items.length) return !!r.checks.train;
      return (r.workout || []).length >= wo.items.length;
    }
    return !!r.checks[key];
  }
  function doneCount(k) {
    var n = 0;
    for (var i = 0; i < D.TASKS.length; i++) if (isDone(k, D.TASKS[i].key)) n++;
    return n;
  }
  function streak() {
    var n = 0, cur = new Date();
    if (doneCount(dstr(cur)) < 5) cur = addDays(cur, -1);
    for (var i = 0; i < 500; i++) {
      if (doneCount(dstr(cur)) >= 5) { n++; cur = addDays(cur, -1); } else break;
    }
    return n;
  }
  function weekRate() {
    var now = new Date();
    var day = isoDay(now);
    var sum = 0, cnt = 0;
    for (var i = 0; i < day; i++) {
      var d = addDays(now, -(day - 1 - i));
      sum += doneCount(dstr(d)) / D.TASKS.length;
      cnt++;
    }
    return cnt ? Math.round((sum / cnt) * 100) : 0;
  }

  /* ================= 今日建议 ================= */
  var DAY_PLAN = {
    1: { ml: ["09:00", "11:00"], train: ["16:00", "17:00"], note: "周一没课，整块时间给机器学习" },
    2: { ml: ["21:00", "22:30"], train: ["20:50", "21:50"], note: "满课日，学习拆成中午+晚上" },
    3: { ml: ["08:00", "10:00"], train: ["17:50", "18:40"], note: "上午空档两小时，别睡过去" },
    4: { ml: ["08:00", "09:40"], train: ["15:00", "16:00"], note: "早上先学，下午练腿" },
    5: { ml: ["17:00", "18:50"], train: ["21:00", "21:50"], note: "课多，抓住 17 点这段空档" },
    6: { ml: ["14:00", "16:00"], train: ["10:00", "11:00"], note: "周末是拉开差距的地方" },
    7: { ml: ["14:00", "16:00"], train: ["—", "—"], note: "今天只恢复，不动铁" }
  };

  function nowHint() {
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var k = dstr(now);
    var cs = coursesFor(now);

    for (var i = 0; i < cs.length; i++) {
      var s = toMin(period(cs[i].start).start), e = toMin(period(cs[i].end).end);
      if (mins >= s && mins < e) return "正在上 <b>" + esc(cs[i].name) + "</b> · " + esc(cs[i].room);
    }
    for (var j = 0; j < cs.length; j++) {
      var st = toMin(period(cs[j].start).start);
      if (st > mins && st - mins <= 120) {
        return "下一节 <b>" + esc(cs[j].name) + "</b> " + period(cs[j].start).start + " · " + esc(cs[j].room);
      }
    }

    if (mins < toMin(S.settings.wakeTime)) return "还没到起床时间，先睡够。";
    if (mins >= 23 * 60 || mins < 5 * 60) return "该睡了。<b>熬夜是长高和增肌的头号敌人</b>。";

    var next = null;
    for (var t = 0; t < D.TASKS.length; t++) {
      if (!isDone(k, D.TASKS[t].key)) { next = D.TASKS[t]; break; }
    }
    if (!next) return "今天全打满了。<b>这不是运气，是习惯。</b>";

    var plan = DAY_PLAN[isoDay(now)];
    if (next.key === "ml" && plan) return "接下来：<b>机器学习</b> · 建议 " + plan.ml[0] + "-" + plan.ml[1];
    if (next.key === "train" && plan) return "接下来：<b>训练</b> · 建议 " + plan.train[0] + "-" + plan.train[1];
    if (next.key === "es") return "接下来：<b>西班牙语</b> · 40 分钟，先开 Anki";
    if (next.key === "sleep") return "剩下的就是 <b>23:00 前躺下</b>，别刷手机。";
    return "还没完成：<b>" + next.label + "</b> · " + next.meta;
  }

  /* ================= 渲染：今日 ================= */
  function renderToday() {
    var now = new Date();
    var k = dstr(now);
    var wi = weekOf(now);
    var total = D.TASKS.length;
    var done = doneCount(k);
    var pct = Math.round((done / total) * 100);
    var rec = S.days[k] || { water: 0, mlSec: 0, checks: {}, workout: [] };
    var mlMin = Math.floor((rec.mlSec || 0) / 60);
    var st = streak();
    var cs = coursesFor(now);
    var plan = DAY_PLAN[isoDay(now)];
    var wo = D.WORKOUTS[isoDay(now)];

    var C = 2 * Math.PI * 42;
    var off = C * (1 - pct / 100);

    var head = function () {
      return '' +
        '<div class="topbar">' +
          '<div class="brand">' +
            '<div class="brand-mark">薄</div>' +
            '<div><div class="brand-name">薄肌</div>' +
            '<div class="date-sub">' + esc(S.settings.name || "自律系统") + '</div></div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div class="date-main">' + (now.getMonth() + 1) + " 月 " + now.getDate() + " 日 · " + WD_CN[now.getDay()] + '</div>' +
            '<div class="date-sub">第 ' + wi.week + ' 周 · ' + wi.label + '</div>' +
          '</div>' +
        '</div>';
    };

    var hero = '' +
      '<div class="hero">' +
        '<div class="hero-top">' +
          '<div>' +
            '<div class="hero-hello">Today</div>' +
            '<div class="hero-title">' + heroTitle(done, total) + '</div>' +
          '</div>' +
          '<div class="hero-streak">' + ico("fire") + '<span class="num">' + st + '</span> 天</div>' +
        '</div>' +
        '<div class="hero-body">' +
          '<div class="ring-wrap">' +
            '<svg viewBox="0 0 96 96">' +
              '<circle cx="48" cy="48" r="42" class="ring-bg"/>' +
              '<circle cx="48" cy="48" r="42" class="ring-fg" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
            '</svg>' +
            '<div class="ring-txt"><div><b class="num">' + done + '</b><span>共 ' + total + ' 项</span></div></div>' +
          '</div>' +
          '<div class="hero-stats">' +
            '<div class="hstat"><span class="k">机器学习</span><span class="v num">' + mlMin + '<small>/ ' + S.settings.mlMin + ' 分钟</small></span></div>' +
            '<div class="hstat"><span class="k">饮水</span><span class="v num">' + Math.round((rec.water || 0)) + '<small>/ ' + S.profile.dailyWater + ' ml</small></span></div>' +
            '<div class="hstat"><span class="k">今日训练</span><span class="v">' + esc(wo.tag) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="hero-now"><span class="now-dot"></span><span class="now-txt">' + nowHint() + '</span></div>' +
      '</div>';

    /* 任务清单 */
    var taskHtml = D.TASKS.map(function (t) {
      var ok = isDone(k, t.key);
      var side = "";
      if (t.key === "water") {
        var cups = Math.round((rec.water || 0) / (S.profile.dailyWater / 8));
        side = cups + "/8 杯";
      } else if (t.key === "ml") {
        side = mlMin + "/" + S.settings.mlMin + " 分";
      } else if (t.key === "train") {
        var wd = S.days[k] ? (S.days[k].workout || []) : [];
        side = wd.length + "/" + wo.items.length;
      } else if (ok) {
        side = "完成";
      }
      return '' +
        '<div class="task' + (ok ? " is-done" : "") + '" data-task="' + t.key + '">' +
          '<div class="t-icon t-' + t.color + '">' + ico(t.icon) + '</div>' +
          '<div class="t-body">' +
            '<div class="t-name">' + esc(t.label) + '</div>' +
            '<div class="t-meta">' + esc(taskMeta(t, k)) + '</div>' +
            (t.key === "water" ? waterDots(rec.water || 0) : "") +
          '</div>' +
          '<div class="t-side num">' + side + '</div>' +
          '<div class="tick">' + ico("check") + '</div>' +
        '</div>';
    }).join("");

    /* 今日课程 */
    var courseHtml = "";
    if (cs.length) {
      courseHtml = '<div class="card">' +
        '<div class="between" style="margin-bottom:8px">' +
          '<div style="font-size:13.5px;font-weight:700">今日课程 · ' + cs.length + ' 节</div>' +
          '<button class="btn btn-sm btn-ghost" data-act="go-schedule">课表</button>' +
        '</div>' +
        cs.map(function (c) {
          var col = D.COLORS[c.color] || D.COLORS.blue;
          return '<div class="today-course">' +
            '<div class="tc-time">' + period(c.start).start + '<br><span style="color:var(--ink-3);font-weight:500">' + period(c.end).end + '</span></div>' +
            '<div class="tc-bar" style="background:' + col.bar + '"></div>' +
            '<div class="tc-body"><div class="tc-name">' + esc(c.name) + '</div>' +
            '<div class="tc-meta">' + esc(c.room) + ' · ' + c.start + "-" + c.end + ' 节' + (c.note ? " · " + esc(c.note) : "") + '</div></div>' +
          '</div>';
        }).join("") +
      '</div>';
    } else {
      courseHtml = '<div class="card" style="display:flex;align-items:center;gap:12px">' +
        '<div class="t-icon t-green" style="width:38px;height:38px;border-radius:12px">' + ico("sun") + '</div>' +
        '<div style="flex:1"><div style="font-size:14px;font-weight:650">今天没有课</div>' +
        '<div class="tiny">' + esc(plan ? plan.note : "整块时间，别浪费") + '</div></div></div>';
    }

    /* 今日训练卡 */
    var trainCard = '<div class="card" data-act="go-train" style="cursor:pointer">' +
      '<div class="between">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<div class="t-icon t-red" style="width:38px;height:38px;border-radius:12px">' + ico("dumbbell") + '</div>' +
          '<div><div style="font-size:14.5px;font-weight:700">' + esc(wo.name) + '</div>' +
          '<div class="tiny">' + esc(wo.duration) + ' 分钟 · 约 ' + esc(wo.kcal) + ' kcal · 建议 ' +
            esc(plan ? plan.train[0] + "-" + plan.train[1] : "自选") + '</div></div>' +
        '</div>' +
        '<svg class="ico" style="width:18px;height:18px;color:var(--ink-3)"><use href="#i-right"/></svg>' +
      '</div>' +
    '</div>';

    /* 小贴士 */
    var tips = [
      "薄肌的关键不是练得多，是<strong>体脂够低</strong>。管住嘴占七成。",
      "每天 2 小时机器学习，一年就是 730 小时。这比任何天赋都硬。",
      "西语每天 40 分钟，坚持 6 个月能到 A2。别贪多，别断。",
      "训练完 30 分钟内补蛋白，吸收最好。",
      "23:00 睡，比任何补剂都管用。"
    ];
    var tip = tips[now.getDate() % tips.length];

    /* 学习配方 */
    var recipe = '<div class="card card-tight">' +
      '<div class="recipe">' +
        '<div>' +
          '<div class="r-head">西班牙语 · ' + S.settings.esMin + ' 分钟</div>' +
          D.SPANISH.map(function (x) {
            return '<div class="r-item"><span style="color:var(--ink-2)">' + esc(x.name) + '</span><span>' + x.min + "'</span></div>";
          }).join("") +
        '</div>' +
        '<div>' +
          '<div class="r-head">机器学习 · ' + S.settings.mlMin + ' 分钟</div>' +
          D.ML_PLAN.map(function (x) {
            return '<div class="r-item"><span style="color:var(--ink-2)">' + esc(x.name) + '</span><span>' + x.min + "'</span></div>";
          }).join("") +
        '</div>' +
      '</div>' +
    '</div>';

    return head() + hero +
      '<div class="sec-head"><div class="sec-title">今日打卡</div><div class="sec-more num">' + pct + '%</div></div>' +
      '<div class="task-list">' + taskHtml + '</div>' +
      '<div class="sec-head"><div class="sec-title">今天怎么练</div></div>' +
      recipe +
      '<div class="sec-head"><div class="sec-title">今天</div></div>' +
      courseHtml + trainCard +
      '<div class="card" style="background:var(--surface-2);border-style:dashed">' +
        '<div class="tiny" style="line-height:1.6">' + tip + '</div>' +
      '</div>';
  }

  function heroTitle(done, total) {
    if (done === 0) return "现在开始，<em>别想了</em>";
    if (done <= 2) return "动起来了，<em>继续</em>";
    if (done <= 4) return "已经过半，<em>别停</em>";
    if (done < total) return "就差 <em>" + (total - done) + "</em> 项";
    return "今天赢了，<em>明天继续</em>";
  }

  function taskMeta(t, k) {
    if (t.key === "wake") return S.settings.wakeTime + " 起床 · 不赖床";
    if (t.key === "es") return S.settings.esMin + " 分钟 · 晨读 + Anki + 跟读";
    if (t.key === "ml") return S.settings.mlMin + " 分钟 · 点击开始专注计时";
    if (t.key === "train") return (D.WORKOUTS[isoDay(new Date())] || {}).name || "按今日计划完成";
    if (t.key === "water") return "目标 " + S.profile.dailyWater + " ml · 点一次加一杯";
    return t.meta;
  }

  function waterDots(ml) {
    var per = S.profile.dailyWater / 8;
    var cups = Math.round(ml / per);
    var h = "";
    for (var i = 0; i < 8; i++) h += '<i class="' + (i < cups ? "on" : "") + '"></i>';
    return '<div class="water-dots">' + h + '</div>';
  }

  /* ================= 渲染：课表 ================= */
  function renderSchedule() {
    var base = addDays(new Date(), weekOffset * 7);
    var wi = weekOf(base);
    var todayIso = isoDay(new Date());
    var isThisWeek = weekOffset === 0;

    // 表头
    var head = '<div class="sched-head">' +
      '<div><div style="font-size:19px;font-weight:750;letter-spacing:-.02em">课表</div>' +
      '<div class="tiny">第 ' + wi.week + ' 周 · ' + wi.label + '</div></div>' +
      '<div class="week-nav">' +
        '<button data-act="wk-prev" aria-label="上一周">' + ico("left") + '</button>' +
        '<button data-act="wk-today" style="width:auto;padding:0 9px;font-size:11.5px;font-weight:650">本周</button>' +
        '<button data-act="wk-next" aria-label="下一周">' + ico("right") + '</button>' +
      '</div>' +
    '</div>';

    // 网格
    var grid = '<div class="grid-scroll"><div class="sched-grid">';
    grid += '<div class="gh"></div>';
    for (var d = 1; d <= 7; d++) {
      var dd = addDays(base, d - isoDay(base));
      var isToday = isThisWeek && d === todayIso;
      grid += '<div class="gh' + (isToday ? " is-today" : "") + '">' +
        '<div class="d">' + WD_S[d % 7] + '</div><div class="n">' + dd.getDate() + '</div></div>';
    }
    // 时间列 + 空行
    for (var p = 1; p <= 10; p++) {
      grid += '<div class="gt" style="grid-row:' + (p + 1) + '">' + p + '</div>';
      for (var d2 = 1; d2 <= 7; d2++) {
        grid += '<div class="cell" style="grid-column:' + (d2 + 1) + ';grid-row:' + (p + 1) + '"></div>';
      }
    }
    // 课程块
    var parity = wi.parity;
    S.courses.forEach(function (c) {
      if (c.weeks !== "all" && c.weeks !== parity) return;
      var col = D.COLORS[c.color] || D.COLORS.blue;
      var span = c.end - c.start + 1;
      grid += '<div class="blk" data-course="' + c.id + '" ' +
        'style="grid-column:' + (c.day + 1) + ';grid-row:' + (c.start + 1) + ';grid-row-end:span ' + span + ';' +
        'background:' + col.bg + ';color:' + col.fg + ';border-left-color:' + col.bar + '">' +
        '<div class="cname">' + esc(c.name) + '</div>' +
        '<div class="croom">' + esc(c.room) + '</div>' +
        (c.weeks !== "all" ? '<div class="cwk">' + (c.weeks === "odd" ? "单周" : "双周") + '</div>' : '') +
      '</div>';
    });
    grid += '</div></div>';

    // 当天课程
    var dayCourses = coursesFor(base);
    var list = "";
    if (dayCourses.length) {
      list = '<div class="card">' + dayCourses.map(function (c) {
        var col = D.COLORS[c.color] || D.COLORS.blue;
        return '<div class="today-course">' +
          '<div class="tc-time">' + period(c.start).start + '<br><span style="color:var(--ink-3);font-weight:500">' + period(c.end).end + '</span></div>' +
          '<div class="tc-bar" style="background:' + col.bar + '"></div>' +
          '<div class="tc-body"><div class="tc-name">' + esc(c.name) + '</div>' +
          '<div class="tc-meta">' + esc(c.room) + ' · ' + c.start + "-" + c.end + ' 节' + (c.note ? " · " + esc(c.note) : "") + '</div></div>' +
        '</div>';
      }).join("") + '</div>';
    } else {
      list = '<div class="card"><div class="empty" style="padding:20px"><b>这天没有课</b>整块时间，安排学习或训练</div></div>';
    }

    var legend = '<div class="sched-legend">' + (function () {
      var seen = {}, out = "";
      S.courses.forEach(function (c) {
        var key = c.name;
        if (seen[key]) return;
        seen[key] = 1;
        var col = D.COLORS[c.color] || D.COLORS.blue;
        out += '<span class="lg"><i style="background:' + col.bar + '"></i>' + esc(c.name.length > 9 ? c.name.slice(0, 9) + "…" : c.name) + '</span>';
      });
      return out;
    })() + '</div>';

    return head + grid +
      '<div class="swipe-hint">← 左右滑动看完整一周 →</div>' +
      legend +
      '<div class="sec-head"><div class="sec-title">' +
        (weekOffset === 0 ? "今天" : WD_CN[base.getDay()]) + ' 的课</div>' +
        '<div class="row" style="gap:6px">' +
          '<button class="btn btn-sm btn-ghost" data-act="import-course">批量导入</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="add-course">' + ico("plus") + '加课</button>' +
        '</div></div>' +
      list +
      '<p class="tiny" style="margin:14px 2px;line-height:1.6">点课程块可以编辑或删除。单双周按学期起始日自动计算，起始日在「数据 → 设置」里改。</p>';
  }

  /* ================= 渲染：训练 ================= */
  function renderTrain() {
    var day = trainDayPick || isoDay(new Date());
    var wo = D.WORKOUTS[day];
    var todayK = dstr(new Date());
    var isToday = day === isoDay(new Date());
    var k = isToday ? todayK : dstr(addDays(new Date(), day - isoDay(new Date())));
    var rec = S.days[k] || { workout: [] };
    var doneArr = rec.workout || [];
    var pct = wo.items.length ? Math.round((doneArr.length / wo.items.length) * 100) : 0;

    var weekPlan = "";
    for (var d = 1; d <= 7; d++) {
      var w = D.WORKOUTS[d];
      weekPlan += '<div class="wp-day' + (d === isoDay(new Date()) ? " is-today" : "") + '" data-train-day="' + d + '">' +
        '<div class="wd">' + WD_S[d % 7] + '</div><div class="wk">' + esc(SHORT_TAG[w.key] || w.tag) + '</div></div>';
    }

    var exHtml = wo.items.map(function (it, i) {
      var on = doneArr.indexOf(i) > -1;
      return '<div class="ex-item' + (on ? " done" : "") + '" data-ex="' + i + '">' +
        '<div class="tick">' + ico("check") + '</div>' +
        '<div class="ex-body">' +
          '<div class="ex-name">' + esc(it.name) + '</div>' +
          '<div class="ex-sets num">' + esc(it.sets) + '</div>' +
          '<div class="ex-cue">' + esc(it.cue) + '</div>' +
        '</div>' +
        '<div class="ex-rest">休 ' + esc(it.rest) + '</div>' +
      '</div>';
    }).join("");

    var stretch = '<div class="card">' +
      '<div class="between" style="margin-bottom:4px">' +
        '<div style="font-size:13.5px;font-weight:700">长高 / 体态 · 每天 10 分钟</div>' +
        '<span class="tiny">睡前做</span>' +
      '</div>' +
      D.STRETCH.map(function (s, i) {
        return '<div class="rule-item"><div class="idx num">' + (i + 1) + '</div>' +
          '<div><b style="color:var(--ink);font-weight:650">' + esc(s.name) + '</b> · ' + esc(s.sets) +
          '<div class="tiny" style="margin-top:1px">' + esc(s.cue) + '</div></div></div>';
      }).join("") +
    '</div>';

    var pullup = '<div class="card">' +
      '<div class="between" style="margin-bottom:10px">' +
        '<div style="font-size:13.5px;font-weight:700">引体向上 0 → 1</div>' +
        '<span class="tiny">你现在在这条路上</span>' +
      '</div>' +
      D.PULLUP_STAGES.map(function (s, i) {
        return '<div class="stage">' +
          '<div class="stage-dot">' + (i + 1) + '</div>' +
          '<div class="stage-body">' +
            '<div class="stage-head"><b>' + esc(s.name) + '</b><span>' + esc(s.stage) + '</span></div>' +
            s.items.map(function (x) { return '<div class="stage-item">' + esc(x) + '</div>'; }).join("") +
            '<div class="stage-goal">目标：' + esc(s.goal) + '</div>' +
          '</div>' +
        '</div>';
      }).join("") +
      '<div class="tiny" style="margin-top:10px;line-height:1.6;padding-top:10px;border-top:1px solid var(--line-2)">' +
        '单杠在哪：学校操场、体育馆、宿舍楼下一般都有。实在没有，买一根门上单杠，五十块，不占地。' +
      '</div>' +
    '</div>';

    return '' +
      '<div class="topbar" style="padding-bottom:8px">' +
        '<div><div style="font-size:19px;font-weight:750;letter-spacing:-.02em">训练</div>' +
        '<div class="tiny">' + (isToday ? "今天" : WD_CN[day]) + ' · 目标：薄肌（低体脂 + 线条）</div></div>' +
      '</div>' +
      '<div class="week-plan">' + weekPlan + '</div>' +
      '<div class="train-hero">' +
        '<div class="th-tag">' + esc(wo.tag) + ' · ' + (isToday ? "今日" : WD_CN[day] + " " + k.slice(5).replace("-", "/")) + '</div>' +
        '<div class="th-name">' + esc(wo.name) + '</div>' +
        '<div class="th-meta">' +
          '<div><b class="num">' + wo.duration + '</b><span>分钟</span></div>' +
          '<div><b class="num">' + wo.items.length + '</b><span>个动作</span></div>' +
          '<div><b class="num">~' + wo.kcal + '</b><span>kcal</span></div>' +
        '</div>' +
        '<div class="progress-line"><i style="width:' + pct + '%"></i></div>' +
        '<div class="between" style="margin-top:8px">' +
          '<span class="tiny num">' + doneArr.length + ' / ' + wo.items.length + ' 完成</span>' +
          '<button class="btn btn-sm btn-outline" data-act="train-all">全部打勾</button>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="tiny" style="margin-bottom:6px"><b style="color:var(--ink-2)">热身</b> · ' + esc(wo.warm) + '</div>' +
        exHtml +
      '</div>' +
      '<div class="sec-head"><div class="sec-title">本周计划</div></div>' +
      '<div class="card card-tight">' +
        '<div class="tiny" style="line-height:1.7">' +
          '<b style="color:var(--ink)">推 / 腿 / 游泳 / 拉 / 跑步 / 循环 / 休息</b>，全程零器械。' +
          '周三游泳课算有氧，周五专门跑步，周日只恢复。' +
          '练薄肌要<strong>次数偏多、组间短、不追大重量</strong>，把体脂压下去线条自然出来。' +
        '</div>' +
      '</div>' +
      stretch +
      pullup;
  }

  /* ================= 渲染：饮食 ================= */
  function renderDiet() {
    var now = new Date();
    var plan = D.MEAL_PLANS[(now.getDate() + dietIdx) % D.MEAL_PLANS.length];
    var rec = S.days[dstr(now)] || { water: 0 };
    var water = rec.water || 0;
    var cups = Math.round(water / (S.profile.dailyWater / 8));

    var macros = '<div class="macro-row">' +
      '<div class="macro"><div class="m-k">热量目标</div><div class="m-v num">' + plan.kcal + '<small>kcal</small></div></div>' +
      '<div class="macro"><div class="m-k">蛋白</div><div class="m-v num">' + plan.protein + '<small>g</small></div></div>' +
      '<div class="macro"><div class="m-k">饮水</div><div class="m-v num">' + cups + '<small>/8 杯</small></div></div>' +
    '</div>';

    var meals = plan.meals.map(function (m) {
      return '<div class="card card-tight meal">' +
        '<div class="meal-head">' +
          '<div class="meal-name">' + esc(m.name) + '<span>' + esc(m.time) + '</span></div>' +
          '<div class="meal-kcal num">' + m.kcal + ' kcal · ' + m.protein + 'g 蛋白</div>' +
        '</div>' +
        '<ul class="meal-list">' + m.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul>' +
      '</div>';
    }).join("");

    var rules = D.RULES.eat.map(function (r, i) {
      return '<div class="rule-item"><div class="idx num">' + (i + 1) + '</div><div>' + r + '</div></div>';
    }).join("");

    var grow = D.RULES.grow.map(function (r, i) {
      return '<div class="rule-item"><div class="idx num">' + (i + 1) + '</div><div>' + r + '</div></div>';
    }).join("");

    var truth = D.RULES.truth.map(function (t) { return "<div>" + t + "</div>"; }).join("");

    var canteen = D.CANTEEN.map(function (r, i) {
      return '<div class="rule-item"><div class="idx num">' + (i + 1) + '</div><div>' + r + '</div></div>';
    }).join("");

    var swaps = D.SWAPS.map(function (s) {
      return '<div class="swap-row">' +
        '<div class="swap-miss">没有 ' + esc(s.miss) + '</div>' +
        '<div class="swap-use">' + esc(s.use) + '</div>' +
      '</div>';
    }).join("");

    return '' +
      '<div class="topbar" style="padding-bottom:8px">' +
        '<div><div style="font-size:19px;font-weight:750;letter-spacing:-.02em">饮食</div>' +
        '<div class="tiny">' + esc(plan.name) + ' · 清淡高蛋白</div></div>' +
        '<button class="btn btn-sm btn-ghost" data-act="next-plan">换一套</button>' +
      '</div>' +
      macros +
      '<div class="sec-head" style="margin-top:6px"><div class="sec-title">今日三餐</div>' +
        '<span class="tiny">' + plan.kcal + ' kcal / 蛋白 ' + plan.protein + 'g</span></div>' +
      meals +
      '<div class="card" style="display:flex;align-items:center;gap:12px">' +
        '<div class="t-icon t-cyan" style="width:38px;height:38px;border-radius:12px">' + ico("drop") + '</div>' +
        '<div style="flex:1"><div style="font-size:14px;font-weight:650">今天喝了 ' + water + ' ml</div>' +
        '<div class="tiny">目标 ' + S.profile.dailyWater + ' ml · 训练日 3000 ml</div></div>' +
        '<button class="btn btn-sm btn-primary" data-task="water">+1 杯</button>' +
      '</div>' +
      '<div class="sec-head"><div class="sec-title">吃的原则</div></div>' +
      '<div class="card card-tight">' + rules + '</div>' +
      '<div class="sec-head"><div class="sec-title">食堂怎么点</div></div>' +
      '<div class="card card-tight">' + canteen + '</div>' +
      '<div class="sec-head"><div class="sec-title">没有就换</div><span class="tiny">别为了一顿饭跑三个食堂</span></div>' +
      '<div class="card card-tight">' + swaps + '</div>' +
      '<div class="sec-head"><div class="sec-title">长高 / 体态</div></div>' +
      '<div class="card card-tight">' + grow + '</div>' +
      '<div class="sec-head"><div class="sec-title">说点实话</div></div>' +
      '<div class="warn-box"><b>关于长高，别被骗</b>' + truth + '</div>';
  }

  /* ================= 渲染：数据 ================= */
  function renderStats() {
    var totalDays = Object.keys(S.days).filter(function (k) { return doneCount(k) > 0; }).length;
    var fullDays = Object.keys(S.days).filter(function (k) { return doneCount(k) >= D.TASKS.length; }).length;
    var body = S.body || [];
    var lastW = body.length ? body[body.length - 1].w : S.profile.weight;
    var firstW = body.length ? body[0].w : S.profile.weight;
    var delta = (lastW - firstW).toFixed(1);

    var cells = '' +
      '<div class="stat-grid">' +
        '<div class="stat-cell"><div class="s-k">连续打卡</div><div class="s-v num">' + streak() + '<small>天</small></div></div>' +
        '<div class="stat-cell"><div class="s-k">本周完成率</div><div class="s-v num">' + weekRate() + '<small>%</small></div></div>' +
        '<div class="stat-cell"><div class="s-k">累计打卡</div><div class="s-v num">' + totalDays + '<small>天</small></div></div>' +
        '<div class="stat-cell"><div class="s-k">体重变化</div><div class="s-v num">' + (delta > 0 ? "+" : "") + delta + '<small>kg</small></div></div>' +
      '</div>';

    // 体重曲线
    var wchart = "";
    if (body.length >= 2) {
      var pts = body.slice(-20);
      var W = 320, H = 120, PAD = 12;
      var ws = pts.map(function (p) { return p.w; });
      var mn = Math.min.apply(null, ws) - 0.5, mx = Math.max.apply(null, ws) + 0.5;
      var span = Math.max(0.6, mx - mn);
      var coords = pts.map(function (p, i) {
        var x = PAD + (i / (pts.length - 1)) * (W - PAD * 2);
        var y = H - PAD - ((p.w - mn) / span) * (H - PAD * 2);
        return [x, y];
      });
      var line = coords.map(function (c, i) { return (i ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1); }).join(" ");
      var area = line + " L" + coords[coords.length - 1][0].toFixed(1) + " " + (H - PAD) + " L" + coords[0][0].toFixed(1) + " " + (H - PAD) + " Z";
      wchart = '<div class="card"><div class="between" style="margin-bottom:6px">' +
        '<div style="font-size:13.5px;font-weight:700">体重曲线</div>' +
        '<span class="tiny num">目标 ' + S.profile.targetWeight + ' kg</span></div>' +
        '<div class="chart-box"><svg viewBox="0 0 ' + W + ' ' + H + '">' +
          '<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#E4552B" stop-opacity=".22"/>' +
            '<stop offset="100%" stop-color="#E4552B" stop-opacity="0"/>' +
          '</linearGradient></defs>' +
          '<path d="' + area + '" fill="url(#wg)"/>' +
          '<path d="' + line + '" fill="none" stroke="#E4552B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
          coords.map(function (c, i) {
            return '<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + (i === coords.length - 1 ? 4 : 2.6) + '" fill="#fff" stroke="#E4552B" stroke-width="2"/>';
          }).join("") +
        '</svg></div>' +
        '<div class="between" style="margin-top:2px">' +
          '<span class="tiny">' + pts[0].d.slice(5) + '</span>' +
          '<span class="tiny">' + pts[pts.length - 1].d.slice(5) + '</span>' +
        '</div>' +
      '</div>';
    } else {
      wchart = '<div class="card"><div class="empty" style="padding:18px"><b>体重记录还太少</b>每周固定同一天、早起空腹称，记两次以上就能看趋势</div></div>';
    }

    // 热力图 8 周
    var heat = "";
    var startD = addDays(new Date(), -55);
    for (var i = 0; i < 56; i++) {
      var d = addDays(startD, i);
      var n = doneCount(dstr(d));
      var lv = n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4;
      heat += '<i class="' + (lv ? "l" + lv : "") + '" title="' + dstr(d) + " " + n + '/8"></i>';
    }

    var settings = '' +
      '<div class="card card-tight">' +
        settingRow("身高（cm）", "身体数据，用于计算", "profile.height", S.profile.height, "number") +
        settingRow("体重（kg）", "每周称一次即可", "profile.weight", S.profile.weight, "number") +
        settingRow("目标体重（kg）", "薄肌路线：先降到 63-64", "profile.targetWeight", S.profile.targetWeight, "number") +
        settingRow("每日热量（kcal）", "有轻微缺口才能掉脂", "profile.dailyKcal", S.profile.dailyKcal, "number") +
        settingRow("每日蛋白（g）", "约 1.7g × 体重", "profile.dailyProtein", S.profile.dailyProtein, "number") +
        settingRow("每日饮水（ml）", "训练日再加 500", "profile.dailyWater", S.profile.dailyWater, "number") +
      '</div>' +
      '<div class="card card-tight">' +
        settingRow("起床时间", "早起打卡基准", "settings.wakeTime", S.settings.wakeTime, "time") +
        settingRow("睡觉时间", "23:00 前最好", "settings.sleepTime", S.settings.sleepTime, "time") +
        settingRow("西语时长（分钟）", "每天固定投入", "settings.esMin", S.settings.esMin, "number") +
        settingRow("机器学习时长（分钟）", "每天固定投入", "settings.mlMin", S.settings.mlMin, "number") +
        settingRow("学期起始日", "用于算单双周", "settings.semesterStart", S.settings.semesterStart, "date") +
      '</div>';

    return '' +
      '<div class="topbar" style="padding-bottom:8px">' +
        '<div><div style="font-size:19px;font-weight:750;letter-spacing:-.02em">数据</div>' +
        '<div class="tiny">记录不会骗人</div></div>' +
      '</div>' +
      cells +
      wchart +
      '<div class="card">' +
        '<div class="between" style="margin-bottom:2px">' +
          '<div style="font-size:13.5px;font-weight:700">近 8 周打卡</div>' +
          '<span class="tiny">深色 = 完成得多</span>' +
        '</div>' +
        '<div class="heat">' + heat + '</div>' +
      '</div>' +
      '<div class="card" style="display:flex;gap:9px">' +
        '<button class="btn btn-dark" style="flex:1" data-act="log-weight">' + ico("scale") + '记体重</button>' +
        '<button class="btn btn-ghost" style="flex:1" data-act="export">' + ico("note") + '导出备份</button>' +
      '</div>' +
      '<div class="sec-head"><div class="sec-title">设置</div></div>' +
      settings +
      '<div class="card" style="display:flex;gap:9px">' +
        '<button class="btn btn-outline" style="flex:1" data-act="import">导入备份</button>' +
        '<button class="btn btn-outline" style="flex:1;color:#B4382C" data-act="reset">清空数据</button>' +
      '</div>' +
      '<p class="tiny" style="text-align:center;margin:16px 0 8px;line-height:1.7">' +
        '数据存在这台设备的浏览器里<br>换设备或清缓存前先导出备份' +
      '</p>';
  }

  function settingRow(label, desc, path, val, type) {
    return '<div class="setting-row">' +
      '<div><div class="sr-k">' + esc(label) + '</div><div class="sr-d">' + esc(desc) + '</div></div>' +
      '<input type="' + type + '" value="' + esc(val) + '" data-set="' + path + '"' +
        (type === "number" ? ' step="0.1" inputmode="decimal"' : "") + '>' +
    '</div>';
  }

  /* ================= 路由渲染 ================= */
  function render() {
    var map = { today: renderToday, schedule: renderSchedule, train: renderTrain, diet: renderDiet, stats: renderStats };
    ["today", "schedule", "train", "diet", "stats"].forEach(function (t) {
      var el = document.getElementById("page-" + t);
      el.innerHTML = map[t]();
      el.classList.toggle("is-active", t === activeTab);
    });
    $$(".tab").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-tab") === activeTab);
    });
    window.scrollTo(0, 0);
  }

  function switchTab(t) {
    activeTab = t;
    if (location.hash !== "#" + t) history.replaceState(null, "", "#" + t);
    render();
  }

  /* ================= 交互：打卡 ================= */
  function onTask(key) {
    var k = dstr(new Date());
    var rec = dayRec(k, true);

    if (key === "water") {
      var per = Math.ceil(S.profile.dailyWater / 8);
      if ((rec.water || 0) >= S.profile.dailyWater) {
        rec.water = 0;
        toast("已重置饮水记录");
      } else {
        rec.water = Math.min(S.profile.dailyWater, (rec.water || 0) + per);
        toast("+" + per + " ml · 共 " + rec.water + " ml");
      }
      save(); render(); return;
    }
    if (key === "ml") { openTimer(); return; }
    if (key === "train") { switchTab("train"); return; }

    rec.checks[key] = !rec.checks[key];
    if (rec.checks[key]) toast("打卡：" + (labelOf(key)) + " ✓");
    save(); render();
  }

  function labelOf(key) {
    for (var i = 0; i < D.TASKS.length; i++) if (D.TASKS[i].key === key) return D.TASKS[i].label;
    return key;
  }

  /* ================= 计时器 ================= */
  var timer = { mode: 50, left: 3000, running: false, endAt: 0, tick: null };

  function openTimer() {
    var sheet = $("#timerSheet");
    sheet.classList.add("show");
    sheet.setAttribute("aria-hidden", "false");
    updateTimerUI();
  }
  function closeTimer() {
    var sheet = $("#timerSheet");
    sheet.classList.remove("show");
    sheet.setAttribute("aria-hidden", "true");
  }
  function updateTimerUI() {
    var m = Math.floor(timer.left / 60), s = timer.left % 60;
    $("#timerTime").textContent = pad(m) + ":" + pad(s);
    var C = 2 * Math.PI * 86;
    var total = timer.mode * 60;
    var prog = 1 - timer.left / total;
    var fg = $("#ringFg");
    fg.setAttribute("stroke-dasharray", C.toFixed(1));
    fg.setAttribute("stroke-dashoffset", (C * (1 - prog)).toFixed(1));

    var rec = S.days[dstr(new Date())] || { mlSec: 0 };
    $("#timerSub").textContent = "今日累计 " + Math.floor((rec.mlSec || 0) / 60) + " / " + S.settings.mlMin + " 分钟";

    var btn = $("#timerToggle");
    btn.innerHTML = timer.running ? ico("pause") + "暂停" : ico("play") + (timer.left === timer.mode * 60 ? "开始" : "继续");
  }
  function startTimer() {
    timer.endAt = Date.now() + timer.left * 1000;
    timer.running = true;
    clearInterval(timer.tick);
    timer.tick = setInterval(function () {
      timer.left = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
      updateTimerUI();
      if (timer.left <= 0) finishTimer();
    }, 250);
    updateTimerUI();
  }
  function pauseTimer() {
    timer.running = false;
    clearInterval(timer.tick);
    updateTimerUI();
  }
  function finishTimer() {
    clearInterval(timer.tick);
    timer.running = false;
    var k = dstr(new Date());
    var rec = dayRec(k, true);
    rec.mlSec = (rec.mlSec || 0) + timer.mode * 60;
    save(true);
    timer.left = timer.mode * 60;
    updateTimerUI();
    render();
    toast("完成 " + timer.mode + " 分钟 · 累计 " + Math.floor(rec.mlSec / 60) + " 分钟");
    if (rec.mlSec >= S.settings.mlMin * 60) {
      closeTimer();
      toast("今天的学习目标达成了 🎯");
    }
  }

  /* ================= 弹窗 ================= */
  function openSheet(html) {
    $("#sheetCard").innerHTML = html;
    var sh = $("#sheet");
    sh.classList.add("show");
    sh.setAttribute("aria-hidden", "false");
  }
  function closeSheet() {
    $("#sheet").classList.remove("show");
    $("#sheet").setAttribute("aria-hidden", "true");
  }

  function courseSheet(id) {
    var c = id ? S.courses.filter(function (x) { return x.id === id; })[0] : null;
    var isNew = !c;
    c = c || { id: "", name: "", day: isoDay(new Date()), start: 1, end: 2, room: "", weeks: "all", color: "blue" };

    var dayOpts = "", perOpts = "", weeksOpts = "", colorOpts = "";
    for (var d = 1; d <= 7; d++) dayOpts += '<option value="' + d + '"' + (c.day === d ? " selected" : "") + '>' + WD_CN[d] + '</option>';
    for (var p = 1; p <= 10; p++) perOpts += '<option value="' + p + '"' + (c.start === p ? " selected" : "") + '>' + p + '</option>';
    for (var p2 = 1; p2 <= 10; p2++) perOpts += '';
    [["all", "每周"], ["odd", "单周"], ["even", "双周"]].forEach(function (w) {
      weeksOpts += '<option value="' + w[0] + '"' + (c.weeks === w[0] ? " selected" : "") + '>' + w[1] + '</option>';
    });
    Object.keys(D.COLORS).forEach(function (k) {
      colorOpts += '<option value="' + k + '"' + (c.color === k ? " selected" : "") + '>' + (COLOR_NAME[k] || k) + '</option>';
    });
    var endOpts = "";
    for (var e = 1; e <= 10; e++) endOpts += '<option value="' + e + '"' + (c.end === e ? " selected" : "") + '>' + e + '</option>';

    openSheet('' +
      '<div class="sheet-title">' + (isNew ? "添加课程" : "编辑课程") + '</div>' +
      '<div class="sheet-sub">按你学校实际节次时间调整</div>' +
      '<div class="field"><label>课程名</label><input id="f-name" value="' + esc(c.name) + '" placeholder="例如：工程力学"></div>' +
      '<div class="field-row">' +
        '<div class="field"><label>星期</label><select id="f-day">' + dayOpts + '</select></div>' +
        '<div class="field"><label>开始节</label><select id="f-start">' + perOpts + '</select></div>' +
        '<div class="field"><label>结束节</label><select id="f-end">' + endOpts + '</select></div>' +
      '</div>' +
      '<div class="field-row">' +
        '<div class="field"><label>教室</label><input id="f-room" value="' + esc(c.room) + '" placeholder="教二-101"></div>' +
        '<div class="field"><label>周次</label><select id="f-weeks">' + weeksOpts + '</select></div>' +
      '</div>' +
      '<div class="field"><label>颜色</label><select id="f-color">' + colorOpts + '</select></div>' +
      '<div style="display:flex;gap:9px;margin-top:16px">' +
        (isNew ? "" : '<button class="btn btn-outline" style="flex:0 0 auto;color:#B4382C" data-act="del-course" data-id="' + c.id + '">删除</button>') +
        '<button class="btn btn-ghost" style="flex:1" data-act="close-sheet">取消</button>' +
        '<button class="btn btn-primary" style="flex:1.4" data-act="save-course" data-id="' + (c.id || "") + '">保存</button>' +
      '</div>'
    );
  }

  function saveCourse(id) {
    var name = $("#f-name").value.trim();
    if (!name) { toast("课程名不能为空"); return; }
    var start = +$("#f-start").value, end = +$("#f-end").value;
    if (end < start) { var t = start; start = end; end = t; }
    var obj = {
      id: id || ("c" + Date.now()),
      name: name,
      day: +$("#f-day").value,
      start: start,
      end: end,
      room: $("#f-room").value.trim(),
      weeks: $("#f-weeks").value,
      color: $("#f-color").value
    };
    if (id) {
      for (var i = 0; i < S.courses.length; i++) if (S.courses[i].id === id) { S.courses[i] = obj; break; }
    } else {
      S.courses.push(obj);
    }
    save(true); closeSheet(); render(); toast("已保存");
  }

  function deleteCourse(id) {
    S.courses = S.courses.filter(function (c) { return c.id !== id; });
    save(true); closeSheet(); render(); toast("已删除");
  }

  /* ================= 课表批量导入 ================= */
  function importSheet() {
    openSheet('' +
      '<div class="sheet-title">批量导入课表</div>' +
      '<div class="sheet-sub">从教务系统复制课表，整段粘进来。一行一门课，顺序无所谓。</div>' +
      '<div class="field"><textarea id="f-paste" rows="8" placeholder="工程力学 周二 1-2节 教二-101&#10;大学物理(B)II 周二 3-4节 教六-201&#10;大学物理实验 周四 6-7节 实验中心 双周"></textarea></div>' +
      '<div class="paste-tip">能认：周X / 星期X、1-2节 / 第1-2节、单周 / 双周、教二-101 这类教室。<br>认不出的行会跳过，导入后还能逐门改。</div>' +
      '<div style="display:flex;gap:9px;margin-top:16px">' +
        '<button class="btn btn-ghost" style="flex:1" data-act="close-sheet">取消</button>' +
        '<button class="btn btn-primary" style="flex:1.4" data-act="do-import">导入</button>' +
      '</div>'
    );
  }

  function parseScheduleText(text) {
    var out = [];
    var skipped = 0;
    var lines = String(text || "").split(/\r?\n/);

    lines.forEach(function (raw) {
      var line = raw.replace(/\u00a0/g, " ").trim();
      if (!line || line.length < 4) return;

      var rest = " " + line + " ";
      var day = 0, start = 0, end = 0, room = "", weeks = "all";
      var m;

      // 周次：1-16周 / 第1-16周 / 单周 / 双周
      if ((m = rest.match(/(?:第)?\s*(\d{1,2})\s*[-~—－至]\s*(\d{1,2})\s*周/))) {
        rest = rest.replace(m[0], " ");
        if (/单/.test(line)) weeks = "odd";
        else if (/双/.test(line)) weeks = "even";
      } else if ((m = rest.match(/(单|双)周/))) {
        weeks = m[1] === "单" ? "odd" : "even";
        rest = rest.replace(m[0], " ");
      }

      // 星期
      if ((m = rest.match(/(?:星期|周)\s*([一二三四五六日天1-7])/))) {
        var ch = m[1];
        day = /[1-7]/.test(ch) ? +ch : "一二三四五六日".indexOf(ch === "天" ? "日" : ch) + 1;
        rest = rest.replace(m[0], " ");
      }
      if (!day) { skipped++; return; }

      // 节次
      if ((m = rest.match(/(?:第)?\s*(\d{1,2})\s*[-~—－至]\s*(\d{1,2})\s*节/))) {
        start = +m[1]; end = +m[2];
        rest = rest.replace(m[0], " ");
      } else if ((m = rest.match(/第\s*(\d{1,2})\s*节/))) {
        start = end = +m[1];
        rest = rest.replace(m[0], " ");
      }
      if (!start) { skipped++; return; }
      if (end < start) { var tmp = start; start = end; end = tmp; }
      if (start < 1 || start > 10) { skipped++; return; }
      end = Math.min(end, 10);

      // 教室
      if ((m = rest.match(/(?:教室|地点|上课地点)\s*[:：]?\s*([^\s,，;；|]+)/))) {
        room = m[1];
        rest = rest.replace(m[0], " ");
      } else if ((m = rest.match(/([\u4e00-\u9fa5A-Za-z]{1,6}\s*[-－]\s*\d{2,4})/))) {
        room = m[1].replace(/\s+/g, "");
        rest = rest.replace(m[0], " ");
      }

      var name = rest.replace(/[|｜,，;；:：]/g, " ").replace(/\s+/g, " ").trim();
      if (!name || name.length > 30) { skipped++; return; }

      out.push({ name: name, day: day, start: start, end: end, room: room, weeks: weeks });
    });

    return { list: out, skipped: skipped };
  }

  function doImportCourses() {
    var ta = $("#f-paste");
    if (!ta) return;
    var res = parseScheduleText(ta.value);
    if (!res.list.length) {
      toast("一门都没认出来，检查一下格式");
      return;
    }
    var keys = Object.keys(D.COLORS);
    var added = 0;
    res.list.forEach(function (c) {
      var dup = S.courses.some(function (x) {
        return x.name === c.name && x.day === c.day && x.start === c.start;
      });
      if (dup) return;
      c.id = "c" + Date.now().toString(36) + "_" + added;
      c.color = keys[(S.courses.length + added) % keys.length];
      S.courses.push(c);
      added++;
    });
    save(true);
    closeSheet();
    render();
    toast("导入 " + added + " 门" + (res.skipped ? "，跳过 " + res.skipped + " 行" : ""));
  }

  function weightSheet() {    var now = new Date();
    var last = (S.body && S.body.length) ? S.body[S.body.length - 1].w : S.profile.weight;
    openSheet('' +
      '<div class="sheet-title">记录体重</div>' +
      '<div class="sheet-sub">每周固定一天、早上空腹称，看趋势不看单日</div>' +
      '<div class="field-row">' +
        '<div class="field"><label>体重（kg）</label><input id="f-w" type="number" step="0.1" inputmode="decimal" value="' + last + '"></div>' +
        '<div class="field"><label>身高（cm）</label><input id="f-h" type="number" step="0.5" inputmode="decimal" value="' + S.profile.height + '"></div>' +
      '</div>' +
      '<div style="display:flex;gap:9px;margin-top:14px">' +
        '<button class="btn btn-ghost" style="flex:1" data-act="close-sheet">取消</button>' +
        '<button class="btn btn-primary" style="flex:1.4" data-act="save-weight">保存</button>' +
      '</div>'
    );
  }

  /* ================= 导入导出 ================= */
  function exportData() {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "boji-backup-" + dstr(new Date()) + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("备份已导出");
  }

  function importData() {
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = "application/json,.json";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var obj = JSON.parse(r.result);
          if (!obj.profile || !obj.settings) throw new Error("格式不对");
          S = obj;
          if (!S.courses || !S.courses.length) S.courses = JSON.parse(JSON.stringify(D.COURSES));
          if (!S.days) S.days = {};
          if (!S.body) S.body = [];
          save(true); render(); toast("导入成功");
        } catch (e) { toast("导入失败：文件格式不对"); }
      };
      r.readAsText(f);
    };
    inp.click();
  }

  /* ================= 事件绑定 ================= */
  function bind() {
    document.addEventListener("click", function (e) {
      var t = e.target;

      // tab
      var tab = t.closest ? t.closest(".tab") : null;
      if (tab) { switchTab(tab.getAttribute("data-tab")); return; }

      // 任务
      var task = t.closest ? t.closest("[data-task]") : null;
      if (task) { onTask(task.getAttribute("data-task")); return; }

      // 训练日切换
      var tday = t.closest ? t.closest("[data-train-day]") : null;
      if (tday) { trainDayPick = +tday.getAttribute("data-train-day"); render(); return; }

      // 动作勾选
      var ex = t.closest ? t.closest("[data-ex]") : null;
      if (ex) {
        var day = trainDayPick || isoDay(new Date());
        var k = dstr(addDays(new Date(), day - isoDay(new Date())));
        var rec = dayRec(k, true);
        var i = +ex.getAttribute("data-ex");
        rec.workout = rec.workout || [];
        var idx = rec.workout.indexOf(i);
        if (idx > -1) rec.workout.splice(idx, 1); else rec.workout.push(i);
        save(); render(); return;
      }

      // 课程块
      var blk = t.closest ? t.closest("[data-course]") : null;
      if (blk) { courseSheet(blk.getAttribute("data-course")); return; }

      // 通用动作
      var actEl = t.closest ? t.closest("[data-act]") : null;
      if (!actEl) return;
      var act = actEl.getAttribute("data-act");

      switch (act) {
        case "go-schedule": switchTab("schedule"); break;
        case "go-train": switchTab("train"); break;
        case "wk-prev": weekOffset--; render(); break;
        case "wk-next": weekOffset++; render(); break;
        case "wk-today": weekOffset = 0; render(); break;
        case "add-course": courseSheet(null); break;
        case "import-course": importSheet(); break;
        case "do-import": doImportCourses(); break;
        case "save-course": saveCourse(actEl.getAttribute("data-id")); break;
        case "del-course": deleteCourse(actEl.getAttribute("data-id")); break;
        case "close-sheet": closeSheet(); break;
        case "train-all": {
          var day2 = trainDayPick || isoDay(new Date());
          var k2 = dstr(addDays(new Date(), day2 - isoDay(new Date())));
          var r2 = dayRec(k2, true);
          var wo = D.WORKOUTS[day2];
          r2.workout = (r2.workout && r2.workout.length === wo.items.length) ? [] : wo.items.map(function (_, i) { return i; });
          save(); render(); toast(r2.workout.length ? "全部完成，干得漂亮" : "已取消");
          break;
        }
        case "next-plan": dietIdx++; render(); break;
        case "log-weight": weightSheet(); break;
        case "save-weight": {
          var w = parseFloat($("#f-w").value), h = parseFloat($("#f-h").value);
          if (!isFinite(w) || w < 30 || w > 200) { toast("体重填得不对"); return; }
          S.profile.weight = w;
          if (isFinite(h) && h > 100) S.profile.height = h;
          S.body = S.body || [];
          var today = dstr(new Date());
          var ex = S.body.filter(function (x) { return x.d === today; })[0];
          if (ex) { ex.w = w; ex.h = h; } else S.body.push({ d: today, w: w, h: h });
          save(true); closeSheet(); render(); toast("已记录");
          break;
        }
        case "export": exportData(); break;
        case "import": importData(); break;
        case "reset":
          if (confirm("确定清空所有打卡记录？这会删掉全部数据，建议先导出备份。")) {
            S = defaultState(); save(true); render(); toast("已重置");
          }
          break;
      }
    });

    // 设置输入
    document.addEventListener("change", function (e) {
      var el = e.target;
      if (!el.getAttribute || !el.getAttribute("data-set")) return;
      var path = el.getAttribute("data-set").split(".");
      var v = el.type === "number" ? parseFloat(el.value) : el.value;
      if (el.type === "number" && !isFinite(v)) return;
      S[path[0]][path[1]] = v;
      save(true);
      if (path[0] === "profile" && path[1] === "weight") {
        S.body = S.body || [];
        var tk = dstr(new Date());
        var ex2 = S.body.filter(function (x) { return x.d === tk; })[0];
        if (ex2) ex2.w = v; else S.body.push({ d: tk, w: v, h: S.profile.height });
      }
      render();
      toast("已保存");
    });

    // 计时器
    $("#timerClose").addEventListener("click", function () {
      if (timer.running) { pauseTimer(); }
      closeTimer();
    });
    $("#timerToggle").addEventListener("click", function () {
      if (timer.running) pauseTimer(); else startTimer();
    });
    $("#timerReset").addEventListener("click", function () {
      pauseTimer(); timer.left = timer.mode * 60; updateTimerUI();
    });
    $("#timerModes").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-min]");
      if (!b) return;
      $$("#timerModes button").forEach(function (x) { x.classList.remove("is-on"); });
      b.classList.add("is-on");
      pauseTimer();
      timer.mode = +b.getAttribute("data-min");
      timer.left = timer.mode * 60;
      updateTimerUI();
    });

    // 遮罩关闭
    $("#timerSheet").addEventListener("click", function (e) {
      if (e.target.id === "timerSheet") { if (timer.running) pauseTimer(); closeTimer(); }
    });
    $("#sheet").addEventListener("click", function (e) {
      if (e.target.id === "sheet") closeSheet();
    });

    // 键盘
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeSheet(); if (timer.running) pauseTimer(); closeTimer(); }
    });

    // 浏览器前进/后退、外部改 hash 时同步页面
    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace("#", "");
      if (["today", "schedule", "train", "diet", "stats"].indexOf(h) > -1 && h !== activeTab) {
        activeTab = h;
        render();
      }
    });

    // 页面要关了 / 切到后台，先把没落盘的数据写进去
    window.addEventListener("beforeunload", flushSave);
    window.addEventListener("pagehide", flushSave);

    // 回到前台时刷新
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) flushSave();
      else render();
    });
  }

  /* ================= 启动 ================= */
  function boot() {
    S = load();
    if (!S.days) S.days = {};
    if (!S.body) S.body = [];
    if (!S.courses || !S.courses.length) S.courses = JSON.parse(JSON.stringify(D.COURSES));
    var h = (location.hash || "").replace("#", "");
    if (["today", "schedule", "train", "diet", "stats"].indexOf(h) > -1) activeTab = h;
    bind();
    render();
    flushSave();

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
