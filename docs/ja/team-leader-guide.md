# チームリーダーガイド

Language: [English](../team-leader-guide.md) | [简体中文](../zh-CN/team-leader-guide.md) | 日本語

このガイドは、Project、Project メンバー、API Key、チーム利用レポートを管理するチームリーダー向けです。

## チームリーダーの範囲

| 能力 | 説明 |
| --- | --- |
| Project Spaces | チーム所有の Project を作成または管理します |
| Project Members | Project を開き、右側詳細パネルでメンバーを管理します |
| Key Management | Project ロールが許可する場合に Project Key を発行します |
| Team Reports | メンバー、Project、モデル、Cost Center 別に利用量を確認します |
| Cost Attribution | 消費を `Payments Assistant`、`Customer Support Copilot` などの Project に配賦します |

## Project 統制モデル

Project は企業 AI 消費の境界です。1 人のユーザーは複数 Project に参加でき、各 API Key は必ず 1 つの Project に属します。

| Project メンバーロール | 既定能力 |
| --- | --- |
| Owner | Project 設定、メンバー、API Key、クォータを管理します |
| Maintainer | Project メンバーと Key を保守します |
| Developer | Project API Key を作成、利用します |
| Viewer | Project 情報と利用量のみ閲覧します |

## メンバー管理

1. **Project Spaces** を開きます。
2. `Payments Assistant` などの Project を選択します。
3. 右側の Project 詳細パネルでメンバーを確認します。
4. 詳細パネルでユーザーを追加、編集、削除します。メンバー一覧はユーザーだけを表示し、ロールと Key 権限はメンバーフォームで編集します。
5. メンバー変更後にチーム利用量を確認し、コスト所有者を明確にします。

## Project Key の発行

1. **Key Management** を開きます。
2. Key の所属 Project を選びます。
3. アプリケーションに必要なモデルとクォータだけを許可します。
4. 新しい Key はすぐにコピーします。TokenHub は完全な Secret を一度だけ表示します。
5. アプリケーション Owner が変わったら Key をローテーションまたは無効化します。

## レポート確認

| 質問 | レポートディメンション |
| --- | --- |
| 誰が予算を消費したか？ | Member |
| どの製品またはアプリが消費したか？ | Project |
| どのモデルがコストを生んだか？ | Model |
| どの内部予算が負担するか？ | Cost center |

## スクリーンショット

![Overview](../assets/screenshots/overview-en.png)
