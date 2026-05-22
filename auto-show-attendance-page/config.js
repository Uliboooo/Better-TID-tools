// =====================================================================
// config.js
// 概要: auto-show-attendance-page の設定値をまとめて定義する
// =====================================================================

const ASAP_CONFIG = Object.freeze({
  // ポータルホームページのサイドバーにある「修学ポートフォリオ」ボタンのCSSセレクタ
  PORTFOLIO_BUTTON_SELECTOR:
    "#repMenuCategory_ctl05_repSubMenu_ctl01_lbtnSubMenu",

  // 「修学ポートフォリオ」ページ内にある「出欠調査状況表」ボタンのCSSセレクタ
  BUTTON_SELECTOR: "#ctl00_cphMain_ibtnShukketuJ",

  // DOM の変化が落ち着いてからさらにランダムに待機する時間の範囲（ミリ秒）
  // 人間的なばらつきを持たせるために min〜max の乱数を使用する
  SETTLE_DELAY_MIN: 800,
  SETTLE_DELAY_MAX: 1800,

  // DOM が落ち着くまでの最大待機時間（ミリ秒）
  // この時間が経過した場合は強制的に次の処理へ進む
  DOM_QUIET_TIMEOUT: 3000,

  // リダイレクトエラーまたはセッション切れエラーの記録に使う localStorage のキー
  // 外部リダイレクトが検出された際にこのキーで "true" を保存し、次回以降の自動化を停止する
  STORAGE_KEY: "aaa_redirect_error_detected",

  // ラッパー要素のID（二重挿入防止のために使用）
  WRAPPER_ID: "automationWrapper",
});
