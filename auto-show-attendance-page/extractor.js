// =====================================================================
// extractor.js
// 概要: 非表示 iframe を使って出欠調査状況表の遷移先 URL を抽出する
//
// extractAttendanceUrl(config, callbacks) の仕様:
//   config   - ASAP_CONFIG オブジェクト
//   callbacks.onPageLoaded - 隠し iframe のロード完了後に呼ばれるコールバック
//             （オーバーレイの状態更新など呼び出し元の UI 処理に使用する）
//
//   戻り値: Promise<string> — 抽出した遷移先 URL
//   エラー: 以下の型付きオブジェクトを throw する
//     { type: "redirect" }                     — 外部サイトへのリダイレクトを検出
//     { type: "parse_error", iframe: Element } — onclick から URL を抽出できなかった
//     { type: "not_found",   iframe: Element } — ボタンが見つからない（リダイレクトなし）
//     { type: "access_blocked", iframe: Element } — DOM アクセスエラー / CORS エラー
// =====================================================================

async function extractAttendanceUrl(config, { onPageLoaded } = {}) {
  const { BUTTON_PAGE_URL, BUTTON_SELECTOR, DELAY_BEFORE_FIND } = config;

  // 非表示 iframe を作成してボタン情報を取得する
  const hiddenIframe = document.createElement("iframe");
  hiddenIframe.style.display = "none";
  document.body.appendChild(hiddenIframe);

  // iframe のページ読み込み完了を Promise でラップする
  await new Promise((resolve) => {
    hiddenIframe.onload = () => {
      // about:blank が読み込まれた場合（初期状態）は無視する
      if (hiddenIframe.contentWindow.location.href === "about:blank") return;
      resolve();
    };
    hiddenIframe.src = BUTTON_PAGE_URL;
  });

  // ページ読み込み完了を呼び出し元に通知する（オーバーレイ更新などに使用）
  onPageLoaded?.();

  // ページの動的レンダリングが終わるまで待機する
  await sleep(DELAY_BEFORE_FIND);

  try {
    // hiddenIframe 内のドキュメントを取得する
    const innerDoc =
      hiddenIframe.contentDocument || hiddenIframe.contentWindow.document;

    const button = innerDoc.querySelector(BUTTON_SELECTOR);

    if (!button) {
      // ボタンが見つからない場合は fetch でリダイレクト先を確認する
      try {
        // credentials: "include" でセッション Cookie を送信し、
        // redirect: "follow" で最終的なリダイレクト先を response.url から取得する
        const res = await fetch(BUTTON_PAGE_URL, {
          redirect: "follow",
          credentials: "include",
        });

        if (new URL(res.url).origin !== window.location.origin) {
          // 外部サイトへのリダイレクトを検出
          console.warn("外部リダイレクトを検出しました:", res.url);
          hiddenIframe.remove();
          throw { type: "redirect" };
        }
      } catch (err) {
        if (err && err.type === "redirect") throw err;
        // fetch 自体が例外をスローした場合も外部リダイレクトとみなす
        // （CORS エラーやネットワークエラーの可能性）
        console.warn(
          "fetch() が例外をスローしました（外部リダイレクトの可能性）:",
          err,
        );
        hiddenIframe.remove();
        throw { type: "redirect" };
      }

      // ボタンが見つからないがリダイレクトもない場合 —
      // iframe の内容をそのまま表示して状況を確認できるようにする
      throw { type: "not_found", iframe: hiddenIframe };
    }

    // ボタンの onclick 属性の文字列を丸ごと取得する
    // "javascript:win7= subopen1('/aa_web/rollManagement/rz0030.aspx?me=IC', ...)"
    const onclickText = button.getAttribute("onclick");

    // 正規表現で subopen1() の第1引数（遷移先 URL）のみを抽出する
    // シングルクォートとダブルクォートの両方に対応
    const match = onclickText?.match(/subopen1\s*\(\s*['"]([^'"]+)['"]/);

    if (!match?.[1]) {
      throw { type: "parse_error", iframe: hiddenIframe };
    }

    hiddenIframe.remove();
    return match[1];
  } catch (e) {
    // 型付きエラーはそのまま再 throw する
    if (e && e.type) throw e;

    // クロスドメインポリシー違反やその他の DOM アクセスエラー
    console.error("Extraction Error:", e);
    throw { type: "access_blocked", iframe: hiddenIframe };
  }
}
