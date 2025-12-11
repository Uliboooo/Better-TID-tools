// ==UserScript==
// @name  AAA - Enterキー拡張機能
// @namespace "better AAA"
// @description  AAAの出席コード入力画面でEnterキーで送信する機能を追加
// @version  0.2
// @match  https://aaaportal.tid.ac.jp/aa_web/portal/mt0010.aspx
// @grant  none
// ==/UserScript==

// @namespaceはスクリプトの識別ID, @grantはスクリプトの権限 - "none"は権限なし、一番安全

// 「Tampermonkey」という拡張機能をブラウザに追加して、「Create a new script...」をクリック。そこのテキストを全部消して、このスクリプトをそこにコピペして「File > Save」で保存。

function addFloatingButton() {
    const btn = document.createElement('div');
    btn.innerText = "Active Enter-AAA\nPlease Enter";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.background = "#d9534f"; // 赤色
    btn.style.color = "white";
    btn.style.padding = "10px";
    btn.style.cursor = "pointer";
    btn.style.borderRadius = "5px";
    btn.style.zIndex = "999999";
    btn.style.fontSize = "14px";
    btn.style.fontWeight = "bold";

    document.body.appendChild(btn);
}
addFloatingButton();
(function() {
    'use strict'

    // 出席ボタンのID/selector
    const BTN_ID = '#ibtnOK'

    // キーボードが押される度に実行
    document.addEventListener('keydown', function(event) {
        // Enterキーかどうか判定
        if (event.key === 'Enter') {
            // 出席ボタンのエレメントを取得
            const button = document.querySelector(BTN_ID)
            // AAAのホーム画面にいると
            // 出席ボタンは常にDOMにあるがCSSで隠されているようなので
            // offsetParentで実際に画面に見えるかどうか判定
            if (button && button.offsetParent !== null) {
                button.click()
            }
        }
    })
})() // すぐに関数を実行
