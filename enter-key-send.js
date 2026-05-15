(function () {
  "use strict";

  // 出席ボタンのID/selector
  const BTN_ID = "#ibtnOK";

  // 出席ボタンの直下に青いテキストを挿入
  function addHintText() {
    const button = document.querySelector(BTN_ID);
    if (button && !document.getElementById("enter-key-hint")) {
      const hint = document.createElement("div");
      hint.id = "enter-key-hint";
      hint.innerText = "Enterキーでコードを送信できるようになりました！";
      hint.style.color = "#0066cc";
      hint.style.fontSize = "13px";
      hint.style.marginTop = "6px";
      button.parentNode.insertBefore(hint, button.nextSibling);
    }
  }
  addHintText();

  // キーボードが押される度に実行
  document.addEventListener("keydown", function (event) {
    // Enterキーかどうか判定
    if (event.key === "Enter") {
      // 出席ボタンのエレメントを取得
      const button = document.querySelector(BTN_ID);
      // AAAのホーム画面にいると
      // 出席ボタンは常にDOMにあるがCSSで隠されているようなので
      // offsetParentで実際に画面に見えるかどうか判定
      if (button && button.offsetParent !== null) {
        button.click();
      }
    }
  });
})(); // すぐに関数を実行
