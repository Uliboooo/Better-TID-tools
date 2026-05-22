// =====================================================================
// utils.js
// 概要: 汎用ユーティリティ関数を定義する
// =====================================================================

// sleep: 指定したミリ秒だけ処理を一時停止するヘルパー関数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// randInt: min 以上 max 以下の整数をランダムに返す
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// waitForPageSettle: DOM の変化とネットワークリクエストの両方が quietMs ミリ秒間途切れるか、
// maxWaitMs を超えるまで待機する。
// MutationObserver で DOM の変化を、PerformanceObserver でリソース読み込みを監視することで、
// DOM が落ち着いた後に遅延ロードされる JS ファイル（ScriptResource.axd 等）も検出できる。
// 引数 win: 監視対象の window オブジェクト（iframe の場合は iframe.contentWindow）
function waitForPageSettle(win, quietMs = 300, maxWaitMs = 3000) {
  return new Promise((resolve) => {
    let quietTimer;

    const done = () => {
      domObserver.disconnect();
      try {
        netObserver.disconnect();
      } catch (e) {
        /* PerformanceObserver 非対応時は無視 */
      }
      clearTimeout(fallbackTimer);
      clearTimeout(quietTimer);
      resolve();
    };

    const resetQuietTimer = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(done, quietMs);
    };

    // DOM の変化（スクリプトの動的挿入や描画更新）を監視する
    const domObserver = new MutationObserver(resetQuietTimer);
    domObserver.observe(win.document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // ネットワークリクエスト（JS・CSS・XHR 等）の完了を監視する
    // DOM が落ち着いた後に setTimeout 経由で遅延起動するスクリプトローダーを検出するために使用する
    let netObserver;
    try {
      netObserver = new win.PerformanceObserver(resetQuietTimer);
      netObserver.observe({ type: "resource", buffered: false });
    } catch (e) {
      netObserver = { disconnect: () => {} }; // PerformanceObserver 非対応時は DOM のみで判定
    }

    const fallbackTimer = setTimeout(done, maxWaitMs);
    resetQuietTimer();
  });
}
