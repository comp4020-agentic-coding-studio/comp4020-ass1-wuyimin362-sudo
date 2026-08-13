# COMP4020 Assignment 1 · 执行计划

**作品代号：《拍面骗了你》（The Bat Lied to You）**
交互式解释器 · 静态站点 · GitHub Pages
截止：2026-08-17 中午 12:00

---

## 0. 给 Claude Code 的元指令（先读完这一节再动手）

1. **这份文件是合同，不是灵感。** 第 2、4、5、6 节里的规格是不可协商的。如果实现和规格冲突，改实现，不改规格；如果确实认为规格错了，**停下来问人，不要自己改**。
2. **先去读课程 starter 仓库**里自带的 `PROCESS.md` 模板和 invariant checks（`npm run check` 或等价命令），并**以 starter 的检查为准**。这份计划里的检查是在 starter 之上追加的，不是替代。
3. **契约先行**：每个阶段先写测试和 `CLAUDE.md` 规则，再写实现。禁止"先写完再补测试"。
4. **小步提交**：每完成一个可验证的小块就 commit。禁止把一个阶段压成一个大 commit。提交历史本身是被评分的证据。
5. **`PROCESS.md` 和 `reflections/assignment-1.md` 不要由你（agent）撰写。** 你的任务是在每个阶段结束时把证据整理进 `notes/evidence.md`（commit SHA、失败的测试输出、被丢弃的分支名），叙述由人来写。原因见第 11 节。
6. **禁止使用任何外部网络资源**：无 CDN、无网络字体、无图片素材、无 npm 运行时依赖。测试可以用 Node 内置 `node:test`。

---

## 1. 评分映射（每个决定都要对得上这张表）

| 评分项 | 权重 | 本计划中对应的东西 |
| --- | --- | --- |
| Legibility of process | 45% | 第 5 节不变量、第 9 节的 harness 修正点、第 10 节 git 策略、`CLAUDE.md` 的演进史 |
| Working deployed artefact | 20% | 第 6 节可访问性与双视口规格、Phase 5、第 12 节检查清单 |
| Response to the brief | 35% | 第 2 节的论点与"只有一个机制"、第 2.4 节的排除项 |

HD 档的三句原话，贴在这里当北极星：

- process：*failures diagnosed and fixed at the harness level rather than retried, output verified before it was accepted, judgement visible in what was thrown away*
- artefact：*holds up under use it wasn't designed for: the keyboard, a resize mid-interaction, a slow connection*
- brief：*a pointed, surprising answer to the provocation, scoped with judgement: one idea, carried all the way*

---

## 2. 作品定义

### 2.1 论点（point of view）

> 接不好下旋球，跟力气、反应、天赋都没关系。是因为**正确的拍面角度和人的直觉是反的**——球在往下钻，你却必须把拍面仰起来往上兜。而当来球换成上旋，正确答案会整个翻转过去。你的手不需要更快，只需要知道该信哪一个。

这句话必须在页面上以某种形式说出来，并且**必须被一条自动化测试证明为真**（见 INV-9、INV-10）。如果测试证明它不成立，改的是发球参数，不是文案。

### 2.2 唯一的核心机制

**两个滑块 → 一条完整的接球轨迹，实时重算。**

- 滑块 A：`bat angle` 拍面角度，范围 **−30°（前倾/closed）到 +70°（后仰/open）**，0° = 拍面垂直于台面
- 滑块 B：`swing direction` 挥拍方向，范围 **−60°（向下切）到 +80°（向上拉）**，0° = 水平向前
- 挥拍速度**固定** 7.0 m/s，不给滑块
- 来球由预设决定，访客不能编辑，只能在 Act 3 切换 backspin / topspin

**可写成测试的核心交互陈述（写进 spec，也写进 README）：**

> 给定来球预设 P、拍面角度 θ、挥拍方向 φ，页面渲染唯一确定的轨迹，并显示三种结果之一：`NET`（下网）/ `OUT`（出界）/ `IN`（上台，含落点 x 坐标）。滑块任一变化后，轨迹与结果在同一帧内更新。

### 2.3 三幕结构（同一个机制，三次使用）

**Act 1 — 接一个下旋发球**
滑块默认值设在直觉位置：`θ = 0°, φ = +5°`（拍面立着，往前平推）。这个默认值**必须下网**（INV-7）。文案只有一句："这是一个下旋发球。把它打回去。"不给提示，不给正确答案。

**Act 2 — 为什么**
同样两个滑块，但打开击球瞬间的放大视图：来球旋转方向、接触点滑移方向、摩擦冲量、出球旋转、飞行中的马格努斯力矢量。用户改滑块时，这些矢量跟着变。

**Act 3 — 解空间地图 + 翻转**
显示一张二维地图：横轴 θ，纵轴 φ，每格着色为 NET / OUT / IN，当前滑块位置是图上一个游标。然后给一个 backspin ↔ topspin 切换，**"能打进的那块地"整个搬到对面去**。收尾论断。

### 2.4 明确排除项（non-goals，任何一条被做出来都要删掉）

- ❌ 不做计分、连击、关卡、时机判定 → 那是第 6 周的 game brief，做了就是 off-brief
- ❌ 不做侧旋、不做 3D、不做多球对拉
- ❌ 不做发球方参数编辑器
- ❌ 不做"选择你的打法风格"之类的第二条主线
- ❌ 不放真实比赛视频或球员照片（版权 + 体积）
- ❌ 不加第三个滑块，除非删掉一个现有的

---

## 3. 技术架构

**零构建步骤、零运行时依赖、纯 ES modules。**

```
index.html
src/
  physics.js      纯函数。禁止出现 document / window / canvas / requestAnimationFrame
  solver.js       解空间网格扫描，只依赖 physics.js
  render.js       canvas 绘制
  ui.js           滑块绑定、aria 播报
  main.js         装配
  copy.js         所有文案集中在这里（便于 review 措辞）
test/
  physics.test.js
  invariants.test.js
  purity.test.js
CLAUDE.md
PROCESS.md
reflections/assignment-1.md
notes/evidence.md      给 agent 记录证据用，不提交给 marker 也无所谓
```

- 测试：`node --test test/`，零依赖
- 部署：仓库根目录直接发 GitHub Pages（`main` 分支 `/`）
- **架构硬约束**：`physics.js` 必须能在 Node 里裸 import 并跑完整仿真。这条由 `purity.test.js` 自动检查（INV-12）。

---

## 4. 物理规格（确定性合同）

### 4.1 单位与坐标

SI 单位。x 沿台长，**正方向 = 球被打回去的方向**；y 竖直向上，y=0 为台面。网在 x=0，台面为 `x ∈ [−1.37, 1.37]`。接球方在 x < 0 一侧。

```
m = 0.0027 kg          球质量
r = 0.020 m            球半径
A = π r² = 1.2566e-3   迎风面积
I = (2/3) m r²         空心球壳转动惯量
g = 9.81
rho = 1.204            空气密度
netHeight = 0.1525
tableHalf = 1.37
```

### 4.2 旋转符号约定（这是最容易错的地方，INV-1 守它）

`omega` 是标量，**逆时针为正**（标准数学坐标系）。

马格努斯力用叉乘导出，不要手写符号：

```
cross(omegaVec, v) 的 2D 结果 = (-omega * vy, omega * vx)
F_magnus = 0.5 * rho * C_L * A * |v|² * normalize(cross(omegaVec, v))
```

由此可推出（**必须由测试验证，不要靠人脑记**）：对于向 +x 飞行的球，`omega > 0` 是**下旋 backspin**，产生向上的力。

UI 层不允许直接写 `omega` 的正负，必须用 `SPIN.BACKSPIN` / `SPIN.TOPSPIN` 常量，映射关系只在一处定义。

### 4.3 系数

```
C_D = 0.40                         阻力系数，常数
S   = r * |omega| / |v|            自旋参数
C_L = Math.min(0.33, 1.5 * S)      升力系数，分段线性近似 + 封顶
```

**这三个数字是标定过的近似值。任何修改必须先跑通 INV-2、INV-3、INV-9、INV-10 才允许提交，并在 `CLAUDE.md` 里记一行为什么改。**

### 4.4 积分器

固定步长 `dt = 0.0005 s`，半隐式欧拉。**物理绝不能由 `requestAnimationFrame` 的 dt 驱动**——渲染与物理解耦，渲染只读取已算好的轨迹数组。这条同时服务于确定性（INV-13）和低端机可靠性。

### 4.5 台面反弹

法向：`e_table = 0.80`，`vy' = -e_table * vy`

切向（旋转耦合，**这是解释成立的关键，不能简化掉**）：

```
u  = vx + omega * r                接触点水平速度
Jn = (1 + e_table) * m * |vy|
Jt = -sign(u) * min(2 * m * |u| / 5, mu_table * Jn)     mu_table = 0.25
vx'    = vx + Jt / m
omega' = omega + r * Jt / I
```

推论（INV-3 验证）：下旋球触台后 vx 减小，够强时反向回跳；上旋球触台后 vx 增大前冲。

### 4.6 击球点

来球从对面发出 → 过网 → 在接球方半台弹一次 → 弹起。**击球点 = 弹起后轨迹第一次达到 y 的局部极大值处**。确定性可计算，也符合"接发球在最高点"的常识。不做时机判定。

### 4.7 球拍碰撞

```
n̂ = (cos(theta), sin(theta))                拍面法线，theta 为拍面角度
t̂ = (-sin(theta), cos(theta))
v_bat = 7.0 * (cos(phi), sin(phi))
v_rel = v_ball - v_bat

法向：
  vn = dot(v_rel, n̂)
  Jn = -(1 + e_bat) * m * vn          e_bat = 0.55（海绵吃球，恢复系数低于台面）
切向（含旋转的滑移）：
  u  = dot(v_rel, t̂) + omega * r
  Jt = -sign(u) * min(2 * m * |u| / 5, mu_bat * Jn)      mu_bat = 0.90（反胶摩擦大）
出球：
  v' = v_ball + (Jn * n̂ + Jt * t̂) / m
  omega' = omega + r * Jt / I
```

`mu_bat = 0.90` 是这个作品的物理核心：胶皮摩擦足够大，才使得"仰着拍面往上兜"能把下旋改造成上旋。若把它调低，整个论点会失效——所以它被 INV-9 锁住。

### 4.8 来球预设

```
BACKSPIN_SERVE:  出手 v = (-6.5, 1.2), omega = +180 rad/s   （对接球方而言是下旋）
TOPSPIN_SERVE:   出手 v = (-7.5, 0.6), omega = -190 rad/s
```

**这两组数字是可以调的，且很可能需要调。** 调它们的唯一合法理由是让 INV-7 / INV-9 / INV-10 通过。每次调整单独 commit，message 里写清哪条不变量原本红了。

### 4.9 结果判定

```
NET  球在 x ∈ [-0.02, 0.02] 处 y < netHeight，或球在过网前落地
OUT  球越过 x = 1.37 时 y > 0，或飞出 y > 2.0
IN   球在 x ∈ (0, 1.37] 且 y ≤ 0，记录落点 x
```

---

## 5. 不变量清单（harness · 这一节是 45% 分数所在）

全部写在 `test/invariants.test.js`，每条一个 `test()`，**id 写进 test 名字**，这样失败时 `PROCESS.md` 可以直接引用。

| ID | 断言 | 为什么它值得存在 |
| --- | --- | --- |
| **INV-1** | v=(5,0) 且 omega>0 时 `F_magnus.y > 0`；omega<0 时 `< 0` | 锁住符号约定。agent 写马格努斯力时几乎必然翻错一次符号 |
| **INV-2** | 相同出射速度与角度下，`range(backspin) > range(nospin) > range(topspin)` | 把"物理直觉"变成可执行断言。agent 看不出轨迹像不像乒乓球 |
| **INV-3** | 台面反弹后：topspin 使 `|vx|` 增大，backspin 使 `|vx|` 减小；omega=+400 时 vx 反号 | 锁住旋转-摩擦耦合，防止被"简化"掉 |
| **INV-4** | 自由飞行段总机械能单调不增；每次碰撞后动能不大于（碰撞前动能 + 球拍动能） | 抓数值发散和符号错误 |
| **INV-5** | 所有碰撞满足 `|Jt| ≤ mu * Jn` | 库仑摩擦上界，防止"为了效果好"偷偷放大摩擦 |
| **INV-6** | θ 在 [−30°, 70°] 上以 0.5° 扫描，相邻落点差 < 0.15 m（跨越 NET/OUT 边界处豁免） | 抓数值不稳定与积分步长不足 |
| **INV-7** | 对 `BACKSPIN_SERVE`，直觉默认值 `θ=0°, φ=+5°` 的结果**必须是 NET** | 第一屏的失败是设计的，不是碰运气 |
| **INV-8** | 对两个预设，可行域（IN）都非空且面积占比 > 5% | 确保题目有解、不至于让人挫败到放弃 |
| **INV-9** | `centroid_θ(BACKSPIN 可行域) − centroid_θ(TOPSPIN 可行域) > 15°` | **论点的可执行版本**。这条红了，页面就在撒谎 |
| **INV-10** | 两个可行域的重叠面积 / 并集面积 < 0.25 | "同一个动作接不好两种旋转"——Act 3 的翻转必须是真的 |
| **INV-11** | 40×40 网格全扫描在 Node 上 < 3.0 s | 保证 Act 3 的地图能在浏览器里实时算出来 |
| **INV-12** | `src/physics.js` 与 `src/solver.js` 的源码不含 `document`/`window`/`canvas`/`localStorage` | 架构纯度，机器可查 |
| **INV-13** | 同一输入连续两次仿真，轨迹数组逐位相等 | 确定性。没有它，上面所有测试都是抽奖 |

---

## 6. 可访问性与双视口规格（artefact 的 20% 在这里）

marker 的原话：*opens the live URL at both marking viewports, uses the core interaction for a minute, resizes mid-use and tabs through it.*

**逐条对应：**

1. **键盘**：两个滑块用原生 `<input type="range">`，自带方向键支持。Act 切换与 spin 切换用真 `<button>`。焦点环必须可见且对比度足够，不许 `outline: none`。tab 顺序 = 视觉顺序。
2. **中途 resize 不丢状态**：物理世界始终以米为单位；resize 只重算「米 → 像素」的映射矩阵，**绝不重置滑块值、Act 状态或已算好的轨迹**。写一个 `resize` handler 的测试笔记，手动验证：拖到 320px 宽再拖回来，滑块值不变。
3. **canvas 不是唯一输出通道**：结果必须同时以文字形式存在于一个 `aria-live="polite"` 区域——"球下网了" / "球出界" / "球落在对方台面，距离球网 0.82 米"。滑块拖动时用 150ms 防抖播报，避免刷屏。
4. **手机（竖屏 ≤ 430px）**：场景在上、滑块在下；触摸目标 ≥ 44px；滑块拖动时禁用页面滚动（`touch-action: none` 只加在滑块上）。**不要做横屏专用布局**。
5. **慢连接**：零外部请求。总传输体积目标 **< 80 KB**（未压缩）。用 `python3 -m http.server` + Chrome DevTools 的 Slow 3G 实测首屏可交互时间，记进 `notes/evidence.md`。
6. **`prefers-reduced-motion: reduce`**：不做轨迹动画，直接绘出完整轨迹。这是默认降级，不是次等体验。
7. **无 JS 时**：`<noscript>` 给一句诚实说明 + 一张静态说明图（用 inline SVG，别加载文件）。

---

## 7. 视觉方向

**从题材本身取材，不要用通用配色。** 参照物是球台、边线、频闪摄影和红黑胶皮。

```
--table    #12313D    球台蓝绿，页面底色
--table-lo #0B2029     台面阴影/远景
--line     #EDF1EE     边线白、球白
--rubber   #C8102E     红胶皮，唯一强调色，只用在"当前操作"上
--ghost    rgba(237,241,238,0.28)   频闪残影
--fail     #5C7A85     失败态不是红色，是"褪色"
```

**签名元素（signature）：频闪轨迹。** 轨迹不画成平滑曲线，画成**等时间间隔的一串球影**（每 8 ms 一个）——球影间距直接编码速度，密的地方是慢的地方。每个球影上带一个红色小点标记，随 `omega` 绕球心旋转，于是**旋转方向在轨迹上是肉眼可读的**。这一个元素同时承担了美感和信息密度，其余部分保持安静。

**字体预算 0 KB**：不加载任何网络字体（慢连接约束）。数字与标签用系统等宽栈做出记分牌质感，正文用系统 sans。

```css
--mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
--sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

个性放在频闪轨迹、解空间地图和数字排版上，不放在一张字体脸上——这是一个可以在 crit 上辩护的取舍。

**文案原则**：句子小写起始、动词直白、不卖弄。按钮说清楚按下去会发生什么。失败态给方向而不是情绪（"球下网了。它还在往下转。" 而不是 "哎呀，再试一次！"）。所有文案集中在 `src/copy.js`。

---

## 8. `CLAUDE.md` 初始内容（Phase 0 第一个 commit）

```markdown
# CLAUDE.md

## What this is
An interactive explainer: two sliders (bat angle, swing direction) determine a
single deterministic table-tennis return trajectory. One mechanic, three acts.
The claim the page makes: the correct bat angle for backspin is the opposite of
what intuition says, and it flips again for topspin.

## Non-negotiable rules

1. `src/physics.js` and `src/solver.js` are pure. No `document`, `window`,
   `canvas`, `localStorage`, `requestAnimationFrame`, `Math.random`, `Date.now`.
   They must run under bare `node`. Enforced by test/purity.test.js.
2. Physics uses a fixed timestep of 0.0005 s. Never drive physics from a
   rendering callback's delta time.
3. `omega` is a scalar, counter-clockwise positive. Never hand-write the sign of
   the Magnus force — always derive it from the cross product. The mapping from
   omega's sign to "topspin"/"backspin" lives in exactly one place: SPIN in
   physics.js.
4. Coefficients C_D, C_L, e_table, e_bat, mu_table, mu_bat and the serve presets
   are calibrated. Changing any of them requires INV-2, INV-3, INV-7, INV-9 and
   INV-10 to pass, plus a line in the changelog below saying which invariant was
   red and why this was the fix.
5. Zero runtime dependencies. Zero network requests. No CDN, no web fonts, no
   image files. Tests use node:test only.
6. Every slider must be a native `<input type="range">`. Never replace it with a
   custom drag handle.
7. Never remove `outline` on focus. Never add a third slider.
8. Before claiming a fix works, run `node --test test/` and paste the output.
   "It looks right now" is not evidence.

## Definition of done for any change
- `node --test test/` fully green
- the starter's own invariant checks pass
- works with keyboard alone at 1440px and at 390px
- diff is small enough to describe in one sentence

## Changelog of rule changes
<!-- append: date, rule added/changed, the failure that caused it -->
```

> **这个文件会长大。** 每次因为踩坑而新增一条规则，都要单独 commit 且写进 changelog——`PROCESS.md` 的 moment 就引用这些 commit。规则从 8 条长到 12–14 条是好事，说明 harness 在被真实的失败塑造。

---

## 9. 分阶段执行（Phase 0–7）

每个阶段格式统一：**目标 → 任务 → 验收（机器可查）→ 提交**。

---

### Phase 0 · 骨架与契约（约 1 小时）

**目标**：仓库能跑、测试能跑、规则先落地。

**任务**
1. 从课程 starter 初始化仓库，**先读 starter 的 invariant checks 和 `PROCESS.md` 模板**，记录它要求什么
2. 建第 3 节的目录结构，所有 `src/*.js` 先放空导出
3. 写入第 8 节的 `CLAUDE.md`
4. 写 `test/purity.test.js`（INV-12）——它现在应该是**绿的**（文件是空的），这没关系，它是防退化的
5. 开 GitHub Pages，确认一个只有 `<h1>` 的 `index.html` 能线上访问

**验收**：`node --test test/` 绿；线上 URL 返回 200

**提交**：`chore: scaffold`、`docs: initial CLAUDE.md with 8 rules`、`test: purity check for physics modules`、`chore: enable GitHub Pages`

---

### Phase 1 · 飞行物理（约 2 小时）

**目标**：一个球能正确地飞。

**任务**
1. **先写测试**：INV-1、INV-2、INV-4、INV-13。此时全红。
2. 实现 `physics.js` 的常数、`magnusForce`、`dragForce`、`step`、`simulateFlight`
3. 跑绿

**预期会踩的坑（这是设计好的）**：INV-1 大概率第一次就红——马格努斯力方向反了。
**要求：不许直接翻符号了事。** 正确动作是把叉乘写成独立的、被单独测试的函数，并在 `CLAUDE.md` 加规则 3。修在 harness，不是修在结果。**这一次失败请完整保留终端输出到 `notes/evidence.md`，它是 `PROCESS.md` 的 moment #1。**

**验收**：INV-1/2/4/13 全绿

**提交**：`test: INV-1..4, INV-13 (red)`、`feat: drag and magnus forces`、`fix: derive magnus direction from cross product, not by hand` ← 这个 commit 是证据

---

### Phase 2 · 碰撞与论点校准（约 3 小时）

**目标**：台面反弹、球拍击球，并让论点在数值上成立。

**任务**
1. 先写 INV-3、INV-5，实现 4.5 台面反弹
2. 先写 INV-7，实现 4.7 球拍碰撞与 4.6 击球点搜索
3. 实现 4.9 结果判定
4. 写 `solver.js`：网格扫描 + 可行域质心/面积计算
5. 写 INV-8、INV-9、INV-10、INV-11 —— **这是全项目最关键的一步**

**如果 INV-9 或 INV-10 红了**：说明当前参数下"直觉是反的"这个说法不成立。
合法的修法（按优先级）：调 4.8 的发球预设 → 调 `mu_bat` → 调 `C_L` 上限。
**非法的修法**：放宽阈值、改文案、删测试。
每次调参单独 commit，message 写明"INV-9 red at Δθ=8°, raised serve backspin to 180 rad/s → Δθ=23°"。
**这一整段是 `PROCESS.md` 的 moment #2，也是最能拿 HD 的一段**——它证明你把自己的主张写成了可证伪的测试，而不是写成一句漂亮话。

**验收**：INV-1 至 INV-13 全绿

**提交**：至少 6 个小 commit，含每一次参数校准

---

### Phase 3 · 渲染（约 3 小时）

**目标**：把轨迹画出来，频闪风格。

**任务**
1. `render.js`：米→像素映射矩阵（单一真源，resize 只改它）
2. 球台、网、边线
3. 频闪残影轨迹（每 8 ms 一个球影 + 红点旋转标记）
4. 三种结果的收尾表现（下网褪色 / 出界冲出画面 / 上台冲击环）
5. devicePixelRatio 处理，避免高分屏发糊

**验收**：手动在 1440px 与 390px 各截一张图存进 `notes/`；resize 过程中滑块值不变

**提交**：按功能分 4–5 个 commit

---

### Phase 4 · 三幕与交互（约 4 小时）

**目标**：页面成立。

**任务**
1. `ui.js`：两个原生 range 滑块，input 事件 → 重算 → 重绘，**同帧完成**
2. `aria-live` 结果播报（150ms 防抖）
3. Act 1：默认值 `θ=0°, φ=+5°`，第一次交互就下网
4. Act 2：击球瞬间放大视图 + 力矢量
5. Act 3：解空间地图（**P0：20×20 预计算并缓存；P1：40×40 Web Worker 渐进细化**）+ backspin/topspin 切换
6. 文案全部走 `src/copy.js`

**时间不够时的降级顺序**：先砍 Act 3 的 40×40 → 用 20×20；再砍 Act 2 的力矢量动画 → 用静态标注。**Act 1 和 Act 3 的翻转不能砍**，它们是论点本身。

**验收**：只用键盘（Tab + 方向键）能完整走完三幕；`node --test` 仍绿

---

### Phase 5 · 加固（约 2 小时）

**目标**：扛住 marker 的"非设计用途"测试。

**任务**
1. 键盘全流程走一遍，修焦点顺序与焦点环
2. 拖到 320px → 拖回 1440px，中途改滑块，确认状态不丢
3. Slow 3G 实测，记录首屏可交互时间
4. `prefers-reduced-motion` 分支
5. `<noscript>` 兜底
6. 移动端真机（或 DevTools 触摸模拟）测滑块拖动不带动页面滚动

**这一阶段极可能产生 `PROCESS.md` 的 moment #4**：某个先做出来的东西必须整个丢掉（典型：自定义拖拽挥拍手势键盘不可达、或者第三个滑块被砍）。**丢弃时请单独开一个 `revert:` 或 `remove:` commit，不要偷偷覆盖掉**——*judgement visible in what was thrown away* 是 HD 的原话，被丢掉的东西必须在历史里看得见。

---

### Phase 6 · 部署与体积（约 1 小时）

**任务**
1. 确认线上 URL 就是最终版本（不是本地能跑而已）
2. 总体积核对 < 80 KB，`grep -r "http" src/ index.html` 确认零外链
3. 在**另一台设备或手机**上打开线上 URL 走一遍
4. starter 的 invariant checks 最后跑一次

---

### Phase 7 · 文档（人来写，约 2 小时）

见第 11 节。agent 在此阶段只做一件事：把 `notes/evidence.md` 整理成一张表——每个候选 moment 对应的 commit SHA、失败测试的原始输出、被删掉的文件名。

---

## 10. Git 与证据策略

- **每个 commit 只做一件能用一句话说清的事**
- message 格式：`type: what` + 必要时正文写"为什么不是显而易见的那个做法"
- **`CLAUDE.md` 的每次修改单独 commit**，且 message 里写清是哪次失败导致的。这些 commit 就是 moment 的引用锚点
- 测试先红后绿要分成两个 commit（`test: INV-9 (red)` → `fix: recalibrate serve backspin to satisfy INV-9`），这样"先有标准后有实现"在历史里是可见的
- 被丢弃的尝试用 `remove:` / `revert:` 显式提交，**不要 force push，不要 rebase 掉历史**
- 禁止在最后一天集中提交。marker 会看 *a commit history that grew with the work*

---

## 11. `PROCESS.md` 与 reflection（这部分必须你自己写）

### 为什么不能让 agent 代写

marker 明说会核对：*a record that contradicts the account* 直接判 N；P 档是 *process asserted rather than shown*。moment 要写"你做了什么 **instead of** the obvious thing"和"你怎么知道结果是对的"——这两样只有真正经历过的人写得出来，而且要能对上 commit。上面第 9 节标出的 moment 位置是**预测**，不是剧本；真实发生的失败可能完全不同，**以真实发生的为准**。

### 格式要求（brief 原文）

- 400–600 词
- **三到四个** moment，不能更多
- 每个 moment 必须能被 repo 佐证（引 commit SHA / 文件 / 测试名）
- 最强的 moment 是「修正落在 harness 上」而不是「重试到通过」

### 一个 moment 的骨架（照着填，别照抄内容）

```
### Moment 2 — 把论点写成一条会失败的测试

显而易见的做法是：写好文案，然后调参数直到动画看起来支持它。
我做的是先写 INV-9（两种来球的可行域质心角度差 > 15°），它在
[SHA] 处是红的：Δθ 只有 8°，意味着页面上"直觉是反的"这句话
在我自己的模型里并不成立。

我知道它对了，是因为 [SHA] 之后 INV-9 与 INV-10 同时转绿
（重叠率 0.19），而我改的是发球的旋转量，没有动阈值、没有动文案。
如果当时改的是阈值，这条测试就永远只会告诉我我想听的话。
```

### reflection（`reflections/assignment-1.md`）

这就是第 4 周 retro 上要讲的 breakthrough，**不要写第二遍**。它应该回答：哪一刻这个项目"啪"地一下讲得通了？我的猜测是 INV-9 第一次转绿的那一刻——你第一次拥有了一个能判断"我的观点是不是真的"的仪器，而不只是一个能判断"代码有没有报错"的仪器。但请以你实际的体验为准。

---

## 12. 提交前检查清单

**机器可查**
- [ ] `node --test test/` 全绿，INV-1 至 INV-13 齐全
- [ ] starter 自带 invariant checks 通过
- [ ] `grep -rn "document\|window\|canvas" src/physics.js src/solver.js` 无输出
- [ ] `grep -rn "http" src/ index.html` 无外部资源
- [ ] 总体积 < 80 KB
- [ ] 线上 GitHub Pages URL 可访问，且内容 = 最新 commit

**人工核查**
- [ ] 1440px 与 390px 都能完整走完三幕
- [ ] 全程只用键盘可完成核心交互，焦点环始终可见
- [ ] 拖动窗口改变尺寸时，滑块值与 Act 状态不丢
- [ ] Slow 3G 下 3 秒内可交互
- [ ] 打开页面第一次拖滑块，默认设置确实下网（Act 1 的设计意图成立）
- [ ] Act 3 切换 spin，可行域确实整块搬家（论点在视觉上成立）

**提交物**
- [ ] 部署 URL
- [ ] 源码仓库
- [ ] `PROCESS.md`（400–600 词，3–4 个 moment，全部有 SHA 佐证）
- [ ] `CLAUDE.md`（含 changelog，规则数应多于初始的 8 条）
- [ ] `reflections/assignment-1.md`
- [ ] commit history 跨越多天，非最后一天集中提交

---

## 13. 时间安排（8 月 12 日周三 → 8 月 17 日周一中午）

| 时间 | 阶段 | 硬性产出 |
| --- | --- | --- |
| 周三晚 | Phase 0 + 1 起步 | 仓库上线，`CLAUDE.md` 就位，INV-1 红过一次并修在 harness 上 |
| 周四 | Phase 1 完成 + Phase 2 | **INV-9 转绿 = 论点被证明成立**。这是最重要的里程碑 |
| 周五 | Phase 3 + Phase 4 起步 | 频闪轨迹能看，Act 1 成立 |
| 周六 | Phase 4 完成 | 三幕跑通，Act 3 的翻转能看见 |
| 周日 | Phase 5 + 6 | 键盘、双视口、慢网、部署定稿 |
| 周一上午 | Phase 7 | `PROCESS.md` 与 reflection，走第 12 节清单 |

**周四结束时如果 INV-9 还没绿，立刻停下来重新评估选题范围**——论点不成立的话，后面四天做的都是装修。

**如果周五发现来不及**：extensions 是 *easy to arrange before the deadline*，但 *there are no late submissions*。要延就在周五申请，不要拖到周日。

---

## 附：给 Claude Code 的启动提示词

```
读 ./COMP4020-A1-execution-plan.md 全文，然后：

1. 复述第 2.2 节的核心机制和第 5 节的 INV-9，确认你理解了它们
2. 列出你打算在 Phase 0 提交的 commit 清单
3. 停下来等我确认，再开始执行 Phase 0

规则：不要跳阶段；每个阶段结束时跑 `node --test test/` 并把完整输出贴给我；
不要替我写 PROCESS.md 或 reflection；遇到与计划冲突的情况，停下来问，不要自己改规格。
```
