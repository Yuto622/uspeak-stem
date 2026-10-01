# Claude Code 引き継ぎメモ — U-Speak STEM

英語版（`uspeak_meta`）と同じ流儀。日本語の UI 文はひらがな寄り（小1が読める）。

## 構成

| 場所 | 中身 |
|---|---|
| `shared/sim/` | 物理。**純粋関数だけ。** ブラウザとサーバーが同じファイルを読む。`run.js` が実験 → 測定の1本の入口 |
| `shared/experiments/` | 実験の定義（JSON）と読み込み・検証（`index.js`）。**答えは書かない**（物理が出す） |
| `server/src/lab/judge.js` | 判定：予想・測定（再計算して比較）・英語の説明（aims）・5つの力 |
| `server/src/rooms/LabRoom.js` | 1クラス1部屋。**予想 → 結果** の順番を部屋が強制する |
| `server/src/lab/records.js` | クラスごとの JSON と追記ログ（保護者レポートの元） |
| `client/` | `app.js`（起動）/ `island.js`（three.js の島）/ `panels.js`（実験の画面）/ `draw.js`（計器の canvas）/ `i18n.js`（英日） |
| `client/vendor/` | three.js r160・colyseus.js（英語版からそのまま） |

## 守ること

- **秘密はクライアントに置かない。** `TEACHER_KEY` は環境変数。ページは1回送って役割を受け取るだけ。
- **`shared/` に時計・`Math.random()`・DOM を持ち込まない。** 乱数は `rng(seed)`。種はサーバーが決める。
- **結果を予想より先に送らない。** `lab:ready` に結果を入れたくなったら、それは設計の変更。
- **深さはページに決めさせない。** `teacher:level` は先生だけ。
- **学習の中身は訳さない。** crash / orbit / escape、waxing crescent は英語のまま、日本語は横に添える。
- **実験を足したら `npm test` が全レベルで回す**（`sim.test.mjs` の最後の検査）。

## 検査

- `npm test`：物理が教科書の値と合うか（ISS 92分・静止軌道 42,164 km・HD 209458 b の半径）、判定、部屋（実ソケット）。
- `npm run test:e2e`：実ブラウザ。このコンテナは数 fps しか出ないので、歩きは `stem.walkTo()` でワープさせている。
