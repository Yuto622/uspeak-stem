# Claude Code 引き継ぎメモ — U-Speak STEM

英語版（`uspeak_meta`）と同じ流儀。日本語の UI 文はひらがな寄り（小1が読める）。
**見た目は英語版と同じにする**（島の部品も HUD の色も英語版から持ってきた）。

## 構成

| 場所 | 中身 |
|---|---|
| `shared/sim/` | 物理と化学。**純粋関数だけ。** ブラウザとサーバーが同じファイルを読む。`run.js` が実験 → 測定の1本の入口。`chem.js` は溶解度・pH と指示薬・ろうそく |
| `shared/experiments/` | 実験の定義（JSON、6本）と読み込み・検証（`index.js`）。**答えは書かない**（物理が出す）。`REGIONS` が島の一覧 |
| `server/src/lab/judge.js` | 判定：予想・測定（再計算して比較）・英語の説明（aims）・5つの力 |
| `server/src/rooms/LabRoom.js` | 1クラス1部屋。**予想 → 結果** の順番を部屋が強制する |
| `server/src/lab/records.js` | クラスごとの JSON と追記ログ（保護者レポートの元） |
| `client/island-kit.js` | **英語版 `client/dist/island-kit.js` のコピー**（import 先だけ `vendor/` に変えた）。直すなら英語版と一緒に |
| `client/island.js` | 2つの島（COSMOS・LAB）を `createIsland` で建てる。空・海・遠くの海岸・カメラ・歩き・他の子 |
| `client/islands.json` | 島のデータ（英語版の `school.json` と同じ形）。座標の定義元 |
| `client/app.js` / `panels.js` / `draw.js` / `i18n.js` / `style.css` | 起動・実験の画面・計器の canvas・英日・HUD（英語版 `style.css` の値そのまま） |

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

## 検査

- `npm test`：物理が教科書の値と合うか（ISS 92分・静止軸 42,164 km・HD 209458 b の半径）、化学の表、判定、部屋（実ソケット）。16件。
- `npm run test:e2e`：実ブラウザ 17項目。このコンテナは数 fps しか出ないので、歩きは `stem.walkTo()` でワープさせている。
  島の看板の文字は `stem.signs()` で読める（英語版の `island.signs` と同じ）。
