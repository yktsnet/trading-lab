# Trading Lab

A demo of a backtesting pipeline and live trading console for an automated FX system.
Built with React + Vite, deployed on Cloudflare Pages.

**[→ Live Demo](https://trading-lab.pages.dev)**

> **All data in this demo is synthetic.** No backend connection is made. See [How the demo works](#how-the-demo-works) below.

---

<details>
<summary>🇯🇵 日本語で読む</summary>

## 概要

自動売買システムのバックテスト管理・ライブ監視コンソールのデモ版。
React + Vite 製、Cloudflare Pages でホスト。

> **このデモのデータはすべて架空です。** バックエンド接続は一切ありません。動作の仕組みは [デモの仕組み](#デモの仕組み) を参照してください。

### ページ構成

| ページ | 内容 |
|---|---|
| **Live** | 現在価格・ポジション・決済履歴・5分足バー・レイテンシー/フレッシュネスグラフ |
| **State** | 注文送信キュー・エントリー・送信済み・エラー等の実行ログ |
| **Pipeline** | S1〜S8 バックテストパイプラインの状態と手動実行 |
| **Ranking** | セッション別（TYO / LON / NYC）戦略ランキング、DDフィルタ適用済み |

### デモの仕組み

バックエンドへの通信は一切なく、`src/lib/api.js` がすべてのデータを生成します。

**現在価格**
サイン波2重合成で 149.1〜150.0 の間を永続的にループ。3秒ごとに再計算されます。

**ポジション**
USDJPY ロング固定（10万通貨、avgOpen 149.234）。
含み損益は現在価格に連動して動きます。

**バー（5分足）**
固定シード乱数によるランダムウォーク200本。時刻は `HH:MM` のみで日付なし。
特定の実在する相場データとは無関係です。

**パイプライン**
ステージ実行ボタンはモック（0.9秒後に成功を返す）。S8 パラメータのスライダーも同様です。

**ランキング**
ハードコードされた架空の戦略スコアです。実際のバックテスト結果とは無関係です。

**メトリクス（Latency / Freshness）**
固定シード乱数で生成した架空の時系列データです。本番環境では注文レイテンシーとバーデータの遅延をリアルタイムで表示します。

### 本番構成（非公開）

```
[phone / laptop]
      │ Tailscale
      ▼
  rpi3 :3000
  ├─ nginx → /var/lib/trading-lab  (静的ファイル)
  └─ nginx /api/* → localhost:8765
      │ autossh tunnel
      ▼
  het (VPS) :8765
  └─ FastAPI
      ├─ /api/status|run|log     バックテストパイプライン
      ├─ /api/rank|config/s8     戦略ランキング
      └─ /api/live/*             価格・ポジション・バー・State
```

実装は非公開の dotfiles リポジトリで管理。バックテストパイプラインは NixOS + Python + systemd timer、ブローカー接続は国内外の FX ブローカー API を使用。

</details>

---

## Pages

| Page | Content |
|---|---|
| **Live** | Current price, open position, closed trades, 5m OHLC bars, latency/freshness charts |
| **State** | Execution queue, entries, sent orders, errors, EOD/event/spark snaps |
| **Pipeline** | S1–S8 backtest pipeline status and manual triggers |
| **Ranking** | Strategy ranking by session (TYO / LON / NYC) with DD filter |

## How the demo works

No backend. Everything is generated in `src/lib/api.js`.

**Price**
A dual sine wave oscillates perpetually between 149.1–150.0 using `Date.now()` as input. Recalculated every 3 seconds.

**Position**
Fixed USDJPY long (100k units, avgOpen 149.234).
Unrealised P&L tracks the current price in real time.

**Bars**
200 bars of seeded random-walk OHLC. Timestamps are `HH:MM` only — no date, no real market data.

**Pipeline**
Stage run buttons are mocked (resolve after ~0.9s). S8 parameter sliders save to state only.

**Ranking**
Hardcoded fictional strategy scores across TYO / LON / NYC sessions.

**Metrics (Latency / Freshness)**
Seeded random time-series data. In production, shows real order latency and bar data freshness.

## Production setup (private)

```
[phone / laptop]
      │ Tailscale
      ▼
  rpi3 :3000
  ├─ nginx → /var/lib/trading-lab  (static build)
  └─ nginx /api/* → localhost:8765
      │ autossh tunnel
      ▼
  het (VPS) :8765
  └─ FastAPI
      ├─ /api/status|run|log     pipeline control
      ├─ /api/rank|config/s8     strategy ranking
      └─ /api/live/*             price · positions · bars · state
```

Backtest pipeline runs on NixOS with Python + systemd timers.
Broker connection via a retail FX broker API. Implementation in a private dotfiles repo.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Icons | Lucide React |
| Styling | CSS Variables (Poimandres palette) |
| Deploy | Cloudflare Pages |
| Backend (prod) | FastAPI + uvicorn |
| Infra (prod) | NixOS, systemd, autossh, Tailscale |
