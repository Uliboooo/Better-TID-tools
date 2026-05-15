// =====================================================================
// config.js
// 概要: auto-show-attendance-page の設定値をまとめて定義する
// =====================================================================

const ASAP_CONFIG = Object.freeze({
  // 「出欠調査状況表」ボタンが存在するページのURL（学生情報ページ）
  BUTTON_PAGE_URL: "/aa_web/StudentCard/jc0110.aspx?me=IC&ou=no",

  // 上記ページ内にある「出欠調査状況表」ボタンのCSSセレクタ
  BUTTON_SELECTOR: "#ctl00_cphMain_ibtnShukketuJ",

  // メインページの load イベント後、開始するまでの初期待機時間（ミリ秒）
  // ページの描画が安定するまで待つために設ける
  DELAY_BEFORE_START: 4000,

  // hiddenIframe がページを読み込んでからボタンを探すまでの待機時間（ミリ秒）
  // ページの動的レンダリングが完了するのを待つために設ける
  DELAY_BEFORE_FIND: 4000,

  // ボタン発見後、onclick を解析して iframe をセットするまでの待機時間（ミリ秒）
  DELAY_AFTER_FIND: 1000,

  // リダイレクトエラーまたはセッション切れエラーの記録に使う localStorage のキー
  // 外部リダイレクトが検出された際にこのキーで "true" を保存し、次回以降の自動化を停止する
  STORAGE_KEY: "aaa_redirect_error_detected",

  // ラッパー要素のID（二重挿入防止のために使用）
  WRAPPER_ID: "automationWrapper",
});
