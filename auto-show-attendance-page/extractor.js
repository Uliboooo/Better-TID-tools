// =====================================================================
// extractor.js
// 概要: 表示用 iframe を使って出欠調査状況表の遷移先 URL を抽出する
//
// extractAttendanceUrl(config, iframe, callbacks) の仕様:
//   config   - ASAP_CONFIG オブジェクト
//   iframe   - ポータルの読み込みと表示に使用する iframe 要素（可視）
//   callbacks.onHomepageLoaded  - ホームページの DOM が落ち着いた後に呼ばれる
//   callbacks.onPortfolioLoaded - 学生情報ページの DOM が落ち着いた後に呼ばれる
//
//   戻り値: Promise<string> — 抽出した遷移先 URL
//   エラー: 以下の型付きオブジェクトを throw する
//     { type: "redirect" }       — 外部サイトへのリダイレクトを検出
//     { type: "parse_error" }    — onclick から URL を抽出できなかった
//     { type: "not_found" }      — ボタンが見つからない
//     { type: "access_blocked" } — DOM アクセスエラー / CORS エラー
// =====================================================================

async function extractAttendanceUrl(
  config,
  iframe,
  { onHomepageLoaded, onPortfolioLoaded } = {},
) {
  const {
    BUTTON_SELECTOR,
    PORTFOLIO_BUTTON_SELECTOR,
    SETTLE_DELAY_MIN,
    SETTLE_DELAY_MAX,
    DOM_QUIET_TIMEOUT,
  } = config;

  // -------------------------------------------------------
  // Step 1: ポータルホームページを iframe に読み込む
  // -------------------------------------------------------
  await new Promise((resolve, reject) => {
    iframe.onload = () => {
      try {
        const href = iframe.contentWindow.location.href;
        if (href === "about:blank") return;
        if (new URL(href).origin !== window.location.origin) {
          reject({ type: "redirect" });
          return;
        }
        resolve();
      } catch (e) {
        // SecurityError: 外部サイトへのリダイレクトを検出
        reject({ type: "redirect" });
      }
    };
    iframe.src = window.location.href;
  });

  const homeDoc = iframe.contentDocument || iframe.contentWindow.document;
  await waitForPageSettle(iframe.contentWindow, 300, DOM_QUIET_TIMEOUT);
  await sleep(randInt(SETTLE_DELAY_MIN, SETTLE_DELAY_MAX));
  onHomepageLoaded?.();

  // -------------------------------------------------------
  // Step 2: 「修学ポートフォリオ」ボタンを探してクリックする
  // ASP.NET のポストバックにより iframe が学生情報ページへ遷移する
  // -------------------------------------------------------
  let portfolioButton;
  try {
    portfolioButton = homeDoc.querySelector(PORTFOLIO_BUTTON_SELECTOR);
  } catch (e) {
    console.error("Extraction Error (portfolio button):", e);
    throw { type: "access_blocked" };
  }

  if (!portfolioButton) {
    throw { type: "not_found" };
  }

  await new Promise((resolve, reject) => {
    iframe.onload = () => {
      try {
        const href = iframe.contentWindow.location.href;
        if (href === "about:blank") return;
        if (new URL(href).origin !== window.location.origin) {
          reject({ type: "redirect" });
          return;
        }
        resolve();
      } catch (e) {
        // SecurityError: 外部サイトへのリダイレクトを検出
        reject({ type: "redirect" });
      }
    };
    // input[type=image] は ASP.NET がクリック座標（.x / .y）をフォームデータに含める。
    // 要素内のランダムな座標でクリックすることで人間的なばらつきを持たせる。
    // 端から 20% の内側に収めることで誤って枠外を押す状況を避ける。
    const rect = portfolioButton.getBoundingClientRect();
    const insetX = Math.round(rect.width * 0.2);
    const insetY = Math.round(rect.height * 0.2);
    const cx = randInt(insetX, Math.round(rect.width - insetX));
    const cy = randInt(insetY, Math.round(rect.height - insetY));
    portfolioButton.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + cx,
        clientY: rect.top + cy,
      }),
    );
  });

  const portfolioDoc = iframe.contentDocument || iframe.contentWindow.document;
  await waitForPageSettle(iframe.contentWindow, 300, DOM_QUIET_TIMEOUT);
  await sleep(randInt(SETTLE_DELAY_MIN, SETTLE_DELAY_MAX));
  onPortfolioLoaded?.();

  // -------------------------------------------------------
  // Step 3: 「出欠調査状況表」ボタンを探して onclick から URL を抽出する
  // -------------------------------------------------------
  try {
    const button = portfolioDoc.querySelector(BUTTON_SELECTOR);

    if (!button) {
      throw { type: "not_found" };
    }

    // ボタンの onclick 属性の文字列を丸ごと取得する
    // "javascript:win7= subopen1('/aa_web/rollManagement/rz0030.aspx?me=IC', ...)"
    const onclickText = button.getAttribute("onclick");

    // 正規表現で subopen1() の第1引数（遷移先 URL）のみを抽出する
    // シングルクォートとダブルクォートの両方に対応
    const match = onclickText?.match(/subopen1\s*\(\s*['"]([^'"]+)['"]/);

    if (!match?.[1]) {
      throw { type: "parse_error" };
    }

    return match[1];
  } catch (e) {
    // 型付きエラーはそのまま再 throw する
    if (e && e.type) throw e;

    // クロスドメインポリシー違反やその他の DOM アクセスエラー
    console.error("Extraction Error:", e);
    throw { type: "access_blocked" };
  }
}
