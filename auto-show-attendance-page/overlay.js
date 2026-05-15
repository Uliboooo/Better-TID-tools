// =====================================================================
// overlay.js
// 概要: 処理状態を表示するオーバーレイ要素の生成と管理を担う
//
// createOverlay() はオーバーレイ要素と操作メソッドをまとめたオブジェクトを返す:
//   el              - オーバーレイの DOM 要素
//   setStatus(msg)  - テキストを即時更新する
//   startCountdown(msg, durationMs) - カウントダウン付きで状態を表示する
//   stopTimer()     - カウントダウンタイマーを停止する
//   fadeOutAndRemove(delayMs) - 指定した遅延後にフェードアウトして DOM から削除する
// =====================================================================

// createOverlay: オーバーレイ要素を生成し、状態管理メソッドを含むオブジェクトを返す
function createOverlay() {
  const el = document.createElement("div");
  el.style.position = "absolute"; // ラッパーの左上を基準に配置
  el.style.top = "20px";
  el.style.left = "20px";
  el.style.background = "#d9534f"; // 初期色: 赤（初期化中）
  el.style.color = "white";
  el.style.padding = "10px";
  el.style.cursor = "default";
  el.style.borderRadius = "5px";
  el.style.zIndex = "999999";
  el.style.fontSize = "14px";
  el.style.fontWeight = "bold";
  el.style.whiteSpace = "pre-line"; // \n で改行できるようにする
  el.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  el.innerText = "初期化中...\nページを読み込んでいます";

  let timerInterval = null;
  let statusMessage = "";

  // ミリ秒を残り秒数形式に整形する
  const formatRemainingSeconds = (ms) => Math.max(0, (ms / 1000).toFixed(1));

  // メッセージを即時セットするヘルパー
  const setStatus = (message) => {
    statusMessage = message;
    el.innerText = message;
  };

  // タイマーを停止してメモリを解放する
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  // カウントダウン付きのステータスメッセージを開始する
  // 100ms ごとに残り時間を更新する
  const startCountdown = (message, durationMs) => {
    statusMessage = message;
    const endTime = Date.now() + durationMs;

    const update = () => {
      const remainingMs = endTime - Date.now();
      if (remainingMs <= 0) {
        el.innerText = `${statusMessage}\n(完了！)`;
        stopTimer();
        return;
      }
      el.innerText = `${statusMessage}\n(${formatRemainingSeconds(remainingMs)}秒)`;
    };

    update();
    timerInterval = setInterval(() => {
      if (!el.parentNode) {
        stopTimer();
        return;
      }
      update();
    }, 100);
  };

  // 指定した遅延後にフェードアウトさせて DOM から削除する
  const fadeOutAndRemove = (delayMs = 0) => {
    setTimeout(() => {
      stopTimer();
      el.style.transition = "opacity 0.5s ease";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 500); // フェード完了後に削除
    }, delayMs);
  };

  return { el, setStatus, startCountdown, stopTimer, fadeOutAndRemove };
}
