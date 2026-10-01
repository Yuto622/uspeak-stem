# U-Speak STEM カリキュラム — 日本の理科教科書を鏡にする

小学校3年から中学校3年までの「理科」を、学習指導要領（平成29年告示）と
主要教科書（東京書籍『新編 新しい理科』『新しい科学』、大日本図書『新版 たのしい理科』、
啓林館『わくわく理科』、教育出版）の単元構成に合わせて、島と実験に写したもの。
実験は「教科書で実際にやる定番実験」をそのまま3Dの舞台にし、数値も教科書の値を使う。

目的は2つ。学校で習う順に並んでいるので、先生が「今週の単元」をそのまま選べること。
そして子どもが、教室でやった実験を家でもう一度、予想→実行→測定→説明の順で、英語でやり直せること。

## 単元 → 島・駅・実験（化学は全単元）

凡例: 島 / 駅（station id）/ 実験 id。★は教科書の定番実験をそのまま写したもの。

### 小学校3年
| 単元（指導要領） | 教科書の単元名 | 島 / 駅 | 実験 | 中身 |
|---|---|---|---|---|
| A(1) 物と重さ | 物の重さ | LAB / balance-table | `lab.mass` ★ | ねんどの形を変えても重さは同じ。同じ体積で材料によって重さが違う（密度表） |
| A(2) 風とゴムの力 | 風やゴムのはたらき | FORCE / rubber-track | `force.rubber` ★ | ゴムを10・15・20 cm のばした車の距離（1.3 m / 3.5 m / 6 m） |
| A(3) 光と音 | 太陽の光 | FORCE / mirror-wall | `force.light` ★ | 鏡1〜3枚で光を集めて温度を測る |
| A(3) 光と音 | 音のせいしつ | FORCE / drum-stage | `force.sound` ★ | 大きい音は大きくふるえる。短い弦は高い（中1につながる） |
| A(4) 磁石 | じしゃくのせいしつ | FORCE / magnet-corner | `force.magnet` ★ | 鉄はつく、アルミ・銅・紙はつかない。離れると弱い。同じ極は反発 |
| A(5) 電気の通り道 | 電気の通り道 | MAKER / tester-bench | `maker.conductor` ★ | 回路のすきまに物をはさみ、金属は通す |
| B(1) 身の回りの生物 | チョウを育てよう | LIFE / butterfly-house | `life.butterfly` ★ | たまご→よう虫→さなぎ→せい虫。温度で日数が変わる |
| B(2) 太陽と地面 | 太陽とかげ | EARTH / shadow-post | `earth.shadow` ★ | かげは太陽の反対。西→北→東と動き、正午に最短。日なたは暖かい |

### 小学校4年
| 単元 | 教科書の単元名 | 島 / 駅 | 実験 | 中身 |
|---|---|---|---|---|
| A(1) 空気と水の性質 | とじこめた空気と水 | LAB / piston-bench | `lab.compress` ★ | 注射器。空気は縮んで押し返す、水は縮まない（ボイル） |
| A(2) 金属・水・空気と温度 | 物の体積と温度 | LAB / warm-bench | `lab.expansion` ★ | 空気＞水＞金属の順にふくらむ。金属の球と輪 |
| A(2) 金属・水・空気と温度 | 水のすがたと温度 | LAB / kettle-corner | `lab.states` ★ | 加熱曲線。0°Cと100°Cで温度が止まる（中1 状態変化へ） |
| A(3) 電流の働き | 電気のはたらき | MAKER / battery-rack | `maker.cells` ★ | 乾電池の直列（明るい）と並列（長持ち） |
| B(1) 人の体のつくりと運動 | — | BODY / track | `life.heart` | 運動と心拍（小6 と合わせて） |
| B(3) 雨水の行方 | 雨水のゆくえと地面のようす | EARTH / soil-tubes | `earth.soil` ★ | れき・すな・つち・ねんどのしみこむ速さ |
| B(5) 月と星 | 月や星の動き | COSMOS / star-wheel | `cosmos.stars` ★ | 1時間に15°。東は右上、北は北極星のまわり |
| B(5) 月と星 | 月の形 | COSMOS / phase-hill | `cosmos.moon.phases` | 月の満ち欠け（小6 と共通） |

### 小学校5年
| 単元 | 教科書の単元名 | 島 / 駅 | 実験 | 中身 |
|---|---|---|---|---|
| A(1) 物の溶け方 | 物のとけ方 | LAB / dissolving-bench | `lab.solubility` ★ | 食塩・ミョウバン・ホウ酸の溶解度曲線、再結晶 |
| A(2) 振り子 | ふりこの性質 | FORCE / swing-frame | `force.pendulum` ★ | 周期はひもの長さだけ、重さは関係ない |
| A(3) 電流がつくる磁力 | 電磁石の性質 | MAKER / coil-crane | `maker.electromagnet` ★ | 巻数・電流とクリップの数 |
| B(1) 発芽・成長 | 植物の発芽と成長 | LIFE / seed-tray | `life.germination` ★ | 水・空気・適温。光はいらない。条件を1つずつ変える |
| B(1) 発芽・成長 | 植物の成長 | LIFE / windowsill | `life.plant` | 水・光・温度と成長 |
| B(2) 動物の誕生 | メダカのたんじょう | LIFE / medaka-tank | `life.medaka` ★ | 25°Cで約10日。水温と日数 |
| B(3) 流れる水 | 流れる水のはたらき | EARTH / stream-table | `earth.river` ★ | 侵食・運搬・堆積。曲がりの外側が削れる |
| B(4) 天気の変化 | 雲と天気 | EARTH / weather-tower | `earth.cloud` | 露点と雲底 |
| 算数 プログラミング | 正多角形 | DATA / turtle-plaza | `data.polygon` ★ | くりかえし・まがる。360 ÷ 辺の数 |

### 小学校6年
| 単元 | 教科書の単元名 | 島 / 駅 | 実験 | 中身 |
|---|---|---|---|---|
| A(1) 燃焼 | 物の燃え方と空気 | LAB / burning-corner | `lab.candle` ★ | 酸素21%→約16%で消える。石灰水 |
| A(2) 水溶液の性質 | 水よう液の性質 | LAB / indicator-shelf | `lab.acid-base` ★ | リトマス・BTB・むらさきキャベツ・フェノールフタレイン |
| A(2) 水溶液の性質 | 金属と水溶液 | LAB / metal-vat | `lab.metal-acid` ★ | 塩酸にアルミ・鉄・亜鉛・マグネシウムは泡（水素）、銅は変化なし。アルミは水酸化ナトリウムにも |
| A(3) てこ | てこのはたらき | FORCE / seesaw | `force.lever` ★ | モーメントのつりあい |
| A(4) 電気の利用 | 電気と私たちの生活 | MAKER / crank-house | `maker.generator` ★ | 手回し発電→コンデンサー→豆電球より LED が長持ち |
| B(1) 人の体 | 消化（だ液） | BODY / spit-bench | `body.saliva` ★ | でんぷん＋だ液＋体温→ヨウ素液が変わらない |
| B(1) 人の体 | 呼吸 | BODY / breath-bag | `body.breath` ★ | 吐く息は酸素が減り CO2 が増える。石灰水が白くにごる |
| B(1) 人の体 | 心臓と血液 | BODY / track | `life.heart` | 運動と心拍・呼吸 |
| B(2) 植物の養分 | 植物の養分と水の通り道 | LIFE / leaf-lab | `life.photosynthesis` ★ | アルミ箔でおおった葉。ヨウ素でんぷん反応 |
| B(3) 生物と環境 | 生物どうしの関わり | LIFE / rabbit-meadow | `life.meadow` | 食べる・食べられる（ロトカ＝ヴォルテラ） |
| B(4) 土地のつくり | 土地のつくりと変化 | EARTH / strata-cliff | `earth.strata` ★ | れき→砂→泥の順にしずんで地層 |
| B(4) 土地のつくり | 地震 | EARTH / seismo-house | `earth.quake` | P波・S波（中1 と共通） |
| B(5) 月と太陽 | 月の形と太陽 | COSMOS / phase-hill | `cosmos.moon.phases` ★ | 太陽・地球・月の角度と見える形 |

### 中学校1年
| 単元 | 教科書の単元名 | 島 / 駅 | 実験 | 中身 |
|---|---|---|---|---|
| 第1分野(1) 光と音 | 音の性質 | FORCE / drum-stage | `force.sound` ★ | 弦の長さ・張りと振動数 |
| 第1分野(1) 力の働き | 力とばね | FORCE / spring-post | `force.spring` ★ | フックの法則。のびは力に比例 |
| 第1分野(2) 身の回りの物質 | 密度 | ATOMS / density-dock | `atoms.density` ★ | 質量÷体積。1より小さいと浮く |
| 第1分野(2) 状態変化 | 蒸留 | ATOMS / still-house | `atoms.distill` ★ | エタノール78°C、水100°C。最初の試験管が燃える |
| 第1分野(2) 状態変化 | 融点と沸点 | LAB / kettle-corner | `lab.states` ★ | 加熱曲線（小4 と共通） |
| 第1分野(2) 水溶液 | 溶解度 | LAB / dissolving-bench | `lab.solubility` | 溶解度曲線（小5 と共通） |
| 第2分野(2) 火山 | 火山と火成岩 | EARTH / volcano-rim | `earth.volcano` ★ | 粘り気→形・噴火・岩の色 |
| 第2分野(2) 地震 | 地震の伝わり方 | EARTH / seismo-house | `earth.quake` ★ | 初期微動継続時間と震源距離 |
| 第2分野(2) 地層 | 地層のでき方 | EARTH / strata-cliff | `earth.strata` | 堆積の順序 |

### 中学校2年
| 単元 | 教科書の単元名 | 島 / 駅 | 実験 | 中身 |
|---|---|---|---|---|
| 第1分野(4) 化学変化 | 水の電気分解 | ATOMS / split-tank | `atoms.electrolysis` ★ | 水素：酸素＝2：1。ファラデーの法則で体積 |
| 第1分野(4) 化学変化 | 質量保存 | ATOMS / sealed-scale | `atoms.conservation` ★ | ふたをすると同じ。開けると CO2 が逃げて減る。銅は酸素がついて増える |
| 第1分野(4) 化学変化 | 定比例（銅・マグネシウム） | ATOMS / copper-kiln | `atoms.oxidation` ★ | Cu:O＝4:1、Mg:O＝3:2。原点を通る直線 |
| 第1分野(3) 電流 | オームの法則 | MAKER / circuit-shed | `maker.circuit` ★ | 電圧・抵抗・電流 |
| 第2分野(4) 気象 | 露点と雲 | EARTH / weather-tower | `earth.cloud` ★ | 露点・雲底 |
| 第2分野(3) 動物 | 消化・呼吸 | BODY / spit-bench, breath-bag | `body.saliva`, `body.breath` | 小6 と共通 |

### 中学校3年
| 単元 | 教科書の単元名 | 島 / 駅 | 実験 | 中身 |
|---|---|---|---|---|
| 第1分野(6) 化学変化とイオン | 酸・アルカリと中和 | ATOMS / drip-bench | `atoms.titration` ★ | BTB 黄→緑→青。中和点の体積。塩の結晶 |
| 第1分野(6) 化学変化とイオン | 電池 | ATOMS / cell-bench | `atoms.battery` ★ | 2種類の金属。反応しやすい方が − 極。電圧は差 |
| 第1分野(6) 化学変化とイオン | 金属とイオン化傾向 | LAB / metal-vat | `lab.metal-acid` | 小6 と共通 |
| 第1分野(5) 運動とエネルギー | 斜面と運動 | FORCE / slide-ramp | `force.ramp` ★ | 摩擦と加速度 |
| 第1分野(5) 運動とエネルギー | 工作 | MAKER / bridge-yard, gear-mill | `maker.bridge`, `maker.gears` | はりのたわみ・歯車 |
| 第2分野(5) 生命の連続性 | 遺伝 | BODY / pea-garden | `body.genetics` ★ | メンデルのエンドウ。3:1 |
| 第2分野(5) 生命の連続性 | 生態系 | LIFE / rabbit-meadow | `life.meadow` | 食物連鎖 |
| 第2分野(6) 地球と宇宙 | 季節と太陽の高さ | COSMOS / season-dial | `cosmos.seasons` ★ | 南中高度＝90−緯度＋赤緯。昼の長さ |
| 第2分野(6) 地球と宇宙 | 太陽系 | COSMOS / planet-walk | `cosmos.planets` ★ | ケプラー第3法則 |
| 第2分野(6) 地球と宇宙 | 天体の動き | COSMOS / star-wheel | `cosmos.stars` | 日周運動（小4 と共通） |
| 第2分野(7) 自然と人間 | 津波・防災 | EARTH / harbour-wall | `earth.tsunami` | √(gh) |

### 発展（教科書の先）
| 島 / 駅 | 実験 | 中身 |
|---|---|---|
| COSMOS / launch-pad | `cosmos.orbit.launch` | 軌道（ニュートン重力） |
| COSMOS / observatory | `cosmos.exoplanet.hunter` | トランジット法 |
| DATA / dice-table, counting-pond, sorting-machine | `data.dice`, `data.pond`, `data.classify` | 確率・標識再捕獲・k-NN |

## 化学だけ取り出すと

| 学年 | 教科書の実験 | 実験 id | 教科書の数値 |
|---|---|---|---|
| 小3 | ねんどの形と重さ、同体積の材料 | `lab.mass` | 鉄 7.87、アルミ 2.70、木 0.5、プラ 1.05 g/cm³ |
| 小4 | 注射器の空気と水 | `lab.compress` | 空気は縮む・押し返す、水は縮まない |
| 小4 | 空気・水・金属のふくらみ、球と輪 | `lab.expansion` | 空気 1/273 /K、水 2.1×10⁻⁴、鉄 3.6×10⁻⁵ |
| 小4 | 氷→水→水蒸気の加熱曲線 | `lab.states` | 0°C と 100°C で平ら。約5分とけて、約11分で沸騰（コンロ中） |
| 小5 | 溶解度と再結晶 | `lab.solubility` | 食塩 36 g、ミョウバン 20°C 11 g → 60°C 57 g |
| 小6 | ろうそくと集気びん、石灰水 | `lab.candle` | O2 21%→16%、CO2 0.04%→3% |
| 小6 | 指示薬と身近な水溶液 | `lab.acid-base` | リトマス・BTB・キャベツ・フェノールフタレイン |
| 小6 | 金属と塩酸・水酸化ナトリウム | `lab.metal-acid` | Mg＞Al＞Zn＞Fe＞Cu。アルミはどちらにも |
| 中1 | 密度と浮き沈み | `atoms.density` | 1 g/cm³ より小さいと浮く |
| 中1 | 水とエタノールの蒸留 | `atoms.distill` | 78°C / 100°C。1本目が燃える |
| 中2 | 質量保存（密閉・開放） | `atoms.conservation` | 重曹＋酢で CO2、銅＋酸素で増加 |
| 中2 | 銅・マグネシウムの加熱 | `atoms.oxidation` | Cu:O 4:1、Mg:O 3:2 |
| 中2 | 水の電気分解 | `atoms.electrolysis` | H2:O2 2:1。1 A × 60 s ≒ 7.6 mL |
| 中3 | 中和滴定（BTB） | `atoms.titration` | 黄→緑→青。cA·vA = cB·vB |
| 中3 | 2種類の金属の電池 | `atoms.battery` | Zn/Cu 1.1 V。標準電極電位の差 |

## 作り方の約束（島に足すとき）

1. 実験は教科書の「実験○」をそのまま。先生が見て「あの実験だ」と分かる形にする。
2. 3つの深さは、学年に合わせる。Explore は小3〜小4、Investigate は小5〜中1、Engineer は中2〜中3 の問いにする。
3. 数値は教科書の表の値。出典は `standards.jp` に単元名で書く。
4. 「英語で説明する」の aims は、教科書の「まとめ」の一文を英語にしたもの。
5. 島は科目でなく「場所」で分ける。LAB は小学校の化学室、ATOMS は中学校の化学室。

## 出典

- 文部科学省『小学校学習指導要領（平成29年告示）解説 理科編』『中学校学習指導要領（平成29年告示）解説 理科編』
- 文部科学省「小学校理科の観察、実験の手引き」
- 東京書籍『新編 新しい理科』年間指導計画（単元一覧表）3〜6年、『新しい科学』1〜3年
- 大日本図書『新版 たのしい理科』単元一覧、啓林館『わくわく理科』年間指導計画、教育出版 単元一覧
- 定番実験の数値: 溶解度表、定比例（銅 4:1・マグネシウム 3:2）、水の電気分解 2:1、ゴムの力（10 cm→1.3 m、15 cm→3.7 m、20 cm→5.9 m）、発芽の三条件、メダカ 25°C 約10日
