# Trading Lab

A demo of a backtesting pipeline console for an automated FX trading system. Built with React + Vite, deployed on Cloudflare Pages.

**[→ Live Demo](https://trading-lab.pages.dev)**

<details>
<summary>🇯🇵 日本語による説明を表示する</summary>

## 概要

自動売買システムのバックテストを S1〜S8 のパイプラインで管理する内製ウェブコンソールのデモ版。戦略ごとの成績集計・DDフィルタ・ランキングをブラウザから確認・操作できる。

本リポジトリはデモ用途のモック実装。実際のパイプライン（NixOS + Python + FastAPI）は非公開の dotfiles リポジトリで管理している。データはすべてモックであり、実際の取引・戦略とは無関係。

</details>

## Features

- **Pipeline** — Real-time status of S1–S8 stages with last-run timestamps
- **Manual Run** — Trigger each stage manually; errors surface inline with journal log output
- **Ranking** — Score strategies by session (avg pips / total pips) with DD filter applied
- **Config** — Adjust S8 parameters (DD threshold, ranking period, min entries) and re-run from the UI

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Icons | Lucide React |
| Styling | CSS Variables (Poimandres palette) |
| Deploy | Cloudflare Pages |

## Note

This repository is the demo version only. All data is static mock — no backend connection is required.  
The production pipeline runs on a private NixOS VPS with Python + FastAPI + systemd timers.
