## Better-TID-tools とは

学校向けサイトでの操作を自動化・簡略化する Chrome 拡張機能です。

### 主な機能

1. **AAA出席サポート**（`aaaportal.tid.ac.jp`）
   - **Enterキー**で出席送信、**Escキー**で閉じる操作に対応
   - ボタン横にキー操作ヒントを表示
   - 出席パスワード入力欄を表示状態に変更
   - 時間割から現在授業を判定し、出席ポップアップを自動表示

2. **ポータル自動リダイレクト**（`portal.tid.ac.jp`）
   - `/login` に来たとき `/api/saml/login` へ自動遷移
   - SPA の URL 変更（pushState / replaceState など）にも追従

3. **Panopto字幕取得機能**（`tid.ap.panopto.com`）
   - 字幕テキストをコピー
   - **TXT / VTT（時間付き）** 形式でダウンロード可能

4. **IT/DXテスト自動回答補助**（`itl.jikeigroup.net`, `itlexam.jikeigroup.net`）
   - 画面上にバナーとスイッチを表示
   - スイッチON時、内蔵データをもとに自動で回答選択

> [!NOTE]
> より良い manaba ツールやモダンな UI など、さらに機能を追加する予定です。

[chrome web store](https://chromewebstore.google.com/detail/fhliefojlilcbccokigkgonbaoimdcla?utm_source=item-share-cb)

## インストール方法

1. [リリース](https://github.com/Uliboooo/Better-TID-tools/releases)から `Better-TID-tools.zip` を解凍します。
2. Chrome拡張機能の設定を開きます: `chrome://extensions/` またはChrome UI。
3. 右上のボタンで**開発者モード**をオンにします。
4. 解凍したフォルダを`load unpacked`ボタンでインポートして使用します。

開発者モードをオンにする

<img width="369" height="139" alt="Screenshot 2025-12-11 at 14 06 55" src="https://github.com/user-attachments/assets/6210f91e-752b-4f1e-ae3d-dda99cdd77c4" /><br>

フォルダをインポートする

<img width="498" height="228" alt="Screenshot 2025-12-11 at 14 07 01 1" src="https://github.com/user-attachments/assets/3c284e1a-a75a-4a28-b69d-eff55faccb2e" /><br>

インストールを確認する

<img width="423" height="265" alt="Screenshot 2025-12-11 at 14 06 14" src="https://github.com/user-attachments/assets/1ac6d763-3ad0-4dd6-b5bc-e2178d3d3a79" /><br>
