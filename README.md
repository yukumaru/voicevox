# VoiceChat - VOICEVOX × Claude 音声会話アプリ

## 必要なもの
- Node.js（インストール済み）
- VOICEVOX（起動しておく）
- Anthropic APIキー

## セットアップ

### 1. 依存パッケージをインストール
```bash
cd voicevox-chat
npm install
```

### 2. アプリを起動
```bash
npm start
```

### 3. APIキーを設定
アプリ起動後、上部の黄色いバーにAnthropicのAPIキーを入力して「保存」ボタンを押してください。
APIキーは `https://console.anthropic.com` で取得できます。

## 使い方
- **マイクボタン** → 押して話しかけると音声入力
- **テキスト入力** → キーボードで入力してEnterまたは送信ボタン
- **話者切替** → 右上のドロップダウンから変更

## アプリとしてビルド（オプション）
```bash
npm run build
```
`dist/` フォルダにインストーラーが生成されます。

## トラブルシューティング
- **VOICEVOXに繋がらない** → VOICEVOXが起動しているか確認（ポート50021）
- **マイクが動かない** → VOICEVOXが起動していれば自動的に許可されます
- **APIエラー** → APIキーが正しく入力されているか確認
