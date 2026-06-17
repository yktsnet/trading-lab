# Trading Lab

A demo of a backtesting pipeline and live trading console for an automated FX system.
**[→ Live Demo](https://trading-lab.pages.dev)**

> **Note:** このデモのデータはすべて架空（合成データ）です。バックエンドへの接続はありません。動作の詳細は後述の [How the demo works](#how-the-demo-works) を参照してください。

---

## Overview

普段ターミナル上で行っていた自動売買やバックテストの運用導線を、より全体を俯瞰し判断しやすい Web console に置き直した内製ツールです。
最初はバックテスト側の整理から開始しましたが、現在は戦略の選出（Ranking）だけでなく、現在価格やポジション、各プロセスの実行状態（Live / State）まで統合して監視・操作できる形に広がっています。

深く調査・修正する作業自体は引き続きターミナルが強力ですが、「異常に気づく」「全体状態を追う」「次にどこを見るべきかを判断する」といった入口としての役割を本 console が担っています。

## Pages

コンソールは用途に合わせて大きく4つの画面で構成されています。

| Page | Content |
|---|---|
| **Live** | 現在価格、保有ポジション、当日の決済履歴、5分足バーなどを監視し、現在の市場と運用のリアルタイムな状況を把握します。 |
| **State** | 注文送信キュー、エントリーフラグ、送信済み注文、発生したエラー等の実行ログを追跡し、処理フローのどこで滞留や異常が発生しているかを特定します。 |
| **Pipeline** | バックテスト（S1〜S8）の進捗状況を確認し、必要に応じて各ステージの手動実行やインラインログの確認を行います。 |
| **Ranking** | セッション別（TYO / LON / NYC）の戦略ランキングや最大ドローダウン（DD）フィルタを確認し、稼働候補とする戦略を選定・判断します。 |

## How the demo works

本リポジトリで公開しているデモ版はフロントエンド単体（React + Vite）で動作し、バックエンドとの通信を行わない完全なモックとして構築されています。すべてのデータは [src/lib/api.js](file:///home/widget/projects/clone-repos/trading-lab/src/lib/api.js) 内で動的に生成されます。

* **Price**: サイン波の2重合成とドリフト（149.1〜150.0の間）を利用し、3秒ごとに現在価格を動的に再計算します。
* **Position**: 固定のUSDJPYロング（10万通貨、平均建値 149.234）を表示します。含み損益は現在価格の動きにリアルタイムに連動します。
* **Bars**: シード値固定 of 乱数によるランダムウォークを用いた200本のOHLCデータを表示します。時間は `HH:MM` のみで、実際の実データとは無関係です。
* **Pipeline**: 各ステージの実行はモック化されており、実行ボタン押下後約0.9秒後に成功ステータスを返します。S8のパラメータスライダーもステートへの保存のみを行います。
* **Ranking**: ハードコードされた架空の戦略スコアを表示します。
* **Metrics**: 固定シード乱数から生成された時系列データです。本番環境では実際の注文レイテンシーとデータの鮮度（遅延）を可視化します。

## Production setup (private)

実運用環境では、処理自体は VPS 上で実行され、FastAPI を介してデータをやり取りします。手元の Raspberry Pi 3 をローカル Web サーバーの入口として使い、静的ファイルの配信と API リクエストのプロキシ（トンネル経由）を行っています。Tailscale を導入することで、どの端末（ノートPCやスマートフォン）からもセキュアかつ同じ画面へシームレスにアクセスできます。

```
[phone / laptop]
      │ Tailscale
      ▼
  rpi3 :3000
  ├─ nginx → /var/lib/trading-lab  (ビルド済み静的ファイル配信)
  └─ nginx /api/* → localhost:8765
      │ autossh tunnel (SSHトンネル)
      ▼
  het (VPS) :8765
  └─ FastAPI
      ├─ /api/status|run|log     バックテストパイプライン管理
      ├─ /api/rank|config/s8     戦略ランキング・S8設定
      └─ /api/live/*             価格・ポジション・バー・Stateデータのリアルタイム配信
```

* **デプロイフロー**: 開発機から `rsync` を使用し、ビルド済みの `dist/` ディレクトリを直接 rpi3 の `/var/lib/trading-lab` へ同期します（`npm run build` 後に rsync を実行）。
* **リポジトリ管理**: 実装の本体は非公開の dotfiles リポジトリで管理しています。バックテストパイプラインは NixOS + Python + systemd timers で動作し、ブローカー接続には国内外の FX ブローカー API を使用しています。

## Tech Stack

| Layer | Tech | Role / Reason |
|---|---|---|
| Frontend | React + Vite | UIの迅速な構築と高速な開発サイクル |
| Icons | Lucide React | 直感的な各種ステータスアイコン表示 |
| Styling | CSS Variables (Poimandres palette) | ダークテイストの統一感あるデザインシステム |
| Deploy (Demo) | Cloudflare Pages | パブリックデモ用の迅速な配信 |
| Host (Prod) | Nginx on NixOS (rpi3) | 常時稼働のローカル配信・トンネル・プロキシ制御 |
| Backend (Prod) | FastAPI + uvicorn | バックテスト管理およびリアルタイムAPI配信 |
| Infra (Prod) | NixOS, systemd, autossh, Tailscale | 堅牢なサービス管理、トンネル維持、セキュアなリモートアクセス |
