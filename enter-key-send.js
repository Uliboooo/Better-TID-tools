(function () {
  "use strict";

  const BTN_SUBMIT = "#ibtnOK";
  const BTN_CLOSE = "#ibtnClose";

  // ボタンの右横にヒントテキストを挿入
  function addInlineHint(buttonSelector, hintId, hintText) {
    const button = document.querySelector(buttonSelector);
    if (button && !document.getElementById(hintId)) {
      // ボタンをインラインにしてヒントを右に並べる
      button.style.display = "inline-block";
      button.style.verticalAlign = "middle";

      const hint = document.createElement("span");
      hint.id = hintId;
      hint.innerText = hintText;
      hint.style.color = "#0066cc";
      hint.style.fontSize = "13px";
      hint.style.marginLeft = "8px";
      hint.style.verticalAlign = "middle";
      button.parentNode.insertBefore(hint, button.nextSibling);
    }
  }

  addInlineHint(BTN_SUBMIT, "enter-key-hint", "Enterキー");
  addInlineHint(BTN_CLOSE, "esc-key-hint", "ESCキー");

  // キーボードが押される度に実行
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      // 出席ボタンのエレメントを取得
      // AAAのホーム画面にいると
      // 出席ボタンは常にDOMにあるがCSSで隠されているようなので
      // offsetParentで実際に画面に見えるかどうか判定
      const button = document.querySelector(BTN_SUBMIT);
      if (button && button.offsetParent !== null) {
        button.click();
      }
    } else if (event.key === "Escape") {
      const button = document.querySelector(BTN_CLOSE);
      if (button && button.offsetParent !== null) {
        button.click();
      }
    }
  });
})(); // すぐに関数を実行
