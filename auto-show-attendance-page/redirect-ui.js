// =====================================================================
// redirect-ui.js
// 概要: 外部リダイレクトまたはセッション切れエラー検出時に表示するエラーメッセージ要素の生成を担う
// =====================================================================

// buildRedirectBlockedEl: エラー検出時に表示するメッセージ要素を生成する
// 引数 onRetry: 「再試行」ボタンを押した時に呼び出されるコールバック関数
function buildRedirectBlockedEl(onRetry) {
  const el = document.createElement("div");
  el.style.padding = "24px";
  el.style.background = "#fff3cd";
  el.style.border = "2px solid #ffc107";
  el.style.fontFamily = "sans-serif";
  el.style.lineHeight = "1.8";
  el.style.width = "100%";
  el.style.boxSizing = "border-box";

  const msg = document.createElement("p");
  msg.style.margin = "0 0 16px";
  msg.style.fontSize = "14px";
  msg.innerHTML =
    "<strong>問題が発生したため、出欠調査状況表の自動表示を一時停止しました。</strong>";

  const btn = document.createElement("button");
  btn.innerText = "再試行";
  btn.style.padding = "8px 16px";
  btn.style.fontSize = "14px";
  btn.style.cursor = "pointer";
  btn.style.border = "none";
  btn.style.borderRadius = "5px";
  btn.style.background = "#5cb85c";
  btn.style.color = "white";
  btn.style.fontWeight = "bold";
  btn.addEventListener("click", onRetry);

  el.appendChild(msg);
  el.appendChild(btn);
  return el;
}
