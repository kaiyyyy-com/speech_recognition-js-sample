COTOHA API 音声認識サンプルクライアント(Node.js)
====
ストリーミング音声認識APIを利用して、wavファイルのテキスト化を行うNode.jsプログラムです。

# Usage
1. コマンド`npm install`でパッケージをインストールしてください。
1. `src/sample.json`を参考にあなたの認証情報を記載したjsonファイルを任意の名前で作成してください。
1. `src/ConnectRequest.js`内の認証情報へのパス、音声ファイル名、モデル名を編集してください。
1. `src`ディレクトリに移動し、コマンド`node ConnectRequest.js`を実行してください。
