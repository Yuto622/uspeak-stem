# Claude Code 引き継ぎメモ — U-Speak STEM

英語版（`uspeak_meta`）と同じ流儀。日本語の UI 文はひらがな寄り（小1が読める）。
**見た目は英語版と同じにする**（島の部品も HUD の色も英語版から持ってきた）。

## 構成

| 場所 | 中身 |
|---|---|
| `shared/sim/` | 物理と化学。**純粋関数だけ。** ブラウザとサーバーが同じファイルを読む。`run.js` が実験 → 測定の1本の入口（21の sim）。`gravity/moon/transit`・`chem`・`force`（ふりこ・さか・てこ）・`life`（ウサギとキツネ・まめ・心拍）・`earth`（地震波・つなみ・露点）・`maker`（はり・オーム・歯車）・`data`（サイコロ・標識再捕獲・k-NN） |
| `shared/experiments/` | 実験の定義（JSON、21本）と読み込み・検証（`index.js`）。**答えは書かない**（物理が出す）。`REGIONS` が島の一覧 |
| `server/src/lab/judge.js` | 判定：予想・測定（再計算して比較）・英語の説明（aims）・5つの力 |
| `server/src/rooms/LabRoom.js` | 1クラス1部屋。**予想 → 結果** の順番を部屋が強制する |
| `server/src/lab/records.js` | クラスごとの JSON と追記ログ（保護者レポートの元） |
| `client/island-kit.js` | **英語版 `client/dist/island-kit.js` のコピー**（import 先だけ `vendor/` に変えた）。直すなら英語版と一緒に |
| `client/island.js` | 世界：空・海・遠くの海岸・雲・カメラ・歩き・他の子・昼夜（`setNight`）。島は `islands-build.js` の `BUILDERS[id]` で建てる |
| `client/islands-build.js` | 7つの島の `build` 関数（島ごとに建物と道具）と `animateIslands`（月・ふりこ・シーソー・歯車・雲が動く） |
| `client/world-clock.js` | 世界の時計。英語版と同じ 705 秒の1日。`phaseAt()` は壁時計の純粋関数（サーバー不要で全員同じ空） |
| `client/islands.json` | 島のデータ（英語版の `school.json` と同じ形）。座標の定義元 |
| `client/stage.js` | **実験の 3D の舞台。** 実験（`sim`）ごとに builder が1つ。`show({exp, params, result})` で建て直す。結果は計算しない（描くだけ）。最初の6本はここ、残り15本は `stage-more.js`（`moreBuilders`）。影・ACES・ビネット・入場ズーム・放置時のゆっくりした首ふりは `createStage` が持つ |
| `client/stage-look.js` | **舞台の見た目の部品。** 空のドーム（`dome`）、光だまりのある床（`ground`）、影つきの3灯（`studioLights`）、グロー（`glow`）、漂う粒（`motes`）、噴き出す粒（`emitter`）、手描きテクスチャ（木・石・惑星・クレーター・太陽・サイコロ）、角丸の箱・歯車・ハート・チューブ、木・丘・太陽。`THEMES.space/lab/sky/night` で1行で雰囲気が決まる。`anim(scene, fn)` に登録した関数は毎フレーム呼ばれる |
| `client/app.js` / `panels.js` / `draw.js` / `i18n.js` / `style.css` | 起動・実験の画面・クラスの散布図と力のレーダー（この2つだけ 2D）・英日・HUD（英語版 `style.css` の値そのまま） |

## 守ること

- **秘密はクライアントに置かない。** `TEACHER_KEY` は環境変数。ページは1回送って役割を受け取るだけ。
- **`shared/` に時計・`Math.random()`・DOM を持ち込まない。** 乱数は `rng(seed)`。種はサーバーが決める。
- **結果を予想より先に送らない。** `lab:ready` に結果を入れたくなったら、それは設計の変更。
- **深さはページに決めさせない。** `teacher:level` は先生だけ。
- **学習の中身は訳さない。** crash / orbit / escape、acid / base、red / blue は英語のまま、日本語は横に添える。
- **島の看板は `{en, ja}` で渡す**（`house(…, {en, ja})`）。文字列だけ渡すと言語で描き直されない。
- **島のデータを読む前に描画ループが走る。** `tick()` は `defs.get(current)` が無い間を飛ばす（最初にここで落ちた）。
- **ダイアログは `showModal()`。** `open` 属性だけだと、固定の `<canvas>` が上に乗ってクリックを吸う（実際に起きた）。
- 実験を足したら `npm test` が全レベルで回す（`sim.test.mjs` の最後の検査）。
- **実験の舞台は WebGL で、ダイアログの中にある。** このコンテナのソフトウェア描画では毎フレーム読み戻しが起きて極端に遅い。
  だから e2e は **DOM の有無で待つ**（`state: 'attached'`）し、クリックは英語版と同じく `press()`（ページの中で `el.click()`）。
  Playwright の本物のクリックは30秒止まることがある（実際に止まった）。実機の GPU では問題にならない。
- 舞台の時計は1コマ 0.25 秒まで。遅い端末でも実時間で進む。
- **パネルを閉じたら舞台は止める**（`dlg` の `close` で `stage.stop()`）。止めないと、閉じた後も裏で 30 fps 描きつづけ、島の歩きが飢える（このコンテナで実際に止まった）。
- **月の舞台だけ太陽が唯一の光**（`THEMES.space(scene, { lights: false })`）。スタジオの3灯を足すと、満ち欠けが嘘になる。
- 舞台の上のラベルは y ≤ 2.4 まで。それより上は 720×420 の枠から出る。
- **同じ名前の測定項目が島ごとに別の意味になることがある**（`period` は軌道では分、ふりこでは秒。`bucket`・`faster` も）。
  `panels.js` の `SIM_LABELS` / `SIM_QUESTIONS` に sim ごとの言葉を置く。共通の表に同じキーを2回書くと後ろが勝って静かに壊れる（実際に起きた）。

## 検査

- `npm test`：物理が教科書の値と合うか（ISS 92分・静止軸 42,164 km・HD 209458 b の半径）、化学の表、力・生命・地球・工作・データ（`sims2.test.mjs`）、判定、部屋（実ソケット）。21件。
- `npm run test:e2e`：実ブラウザ 35項目（COSMOS と LAB の全工程、残り5島の15の実験を1つずつ）。このコンテナは数 fps しか出ないので、歩きは `stem.walkTo()` でワープさせている。
  島の看板の文字は `stem.signs()` で読める（英語版の `island.signs` と同じ）。
