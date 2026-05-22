// =====================================================================
// index.js
// 概要: AAAポータルのホーム画面 (#tabCalender の直下) に、
//       「出欠調査状況表」ページを自動的に iframe として埋め込むメイン処理。
//
// 依存ファイル（manifest のロード順に従いこのファイルより先に読み込まれる）:
//   config.js, utils.js, overlay.js, redirect-ui.js, extractor.js
//
// 【処理の流れ】
//   1. 表示用 iframe（ユーザーに見える）を DOM に挿入する
//   2. ポータルホームページを表示用 iframe に読み込み、DOM が落ち着くのを待つ
//   3. 「修学ポートフォリオ」ボタンをクリックし、学生情報ページへ遷移させる
//   4. 学生情報ページ内の「出欠調査状況表」ボタンの onclick から遷移先 URL を抽出する
//   5. 抽出した URL を表示用 iframe にセットして出欠調査状況表を表示する
//
//   処理中はオーバーレイ（左上の状態表示ボックス）で進捗を通知する。
// =====================================================================

async function extractUrlAndEmbedWithOverlay() {
  const config = ASAP_CONFIG;

  // -------------------------------------------------------
  // 挿入先の確認
  // #tabCalender（時間割タブ）が存在しないページでは何もしない
  // また、すでにラッパーが挿入済みの場合も二重作成を防ぐ
  // -------------------------------------------------------
  const targetDiv = document.querySelector("#tabCalender");
  if (!targetDiv || document.querySelector(`#${config.WRAPPER_ID}`)) return;

  // -------------------------------------------------------
  // 前回のアクセスでリダイレクトエラーが記録されていた場合は自動化を停止する
  // ラッパーを挿入してエラーメッセージと再試行ボタンを表示する
  // -------------------------------------------------------
  if (localStorage.getItem(config.STORAGE_KEY)) {
    const blockedWrapper = document.createElement("div");
    blockedWrapper.id = config.WRAPPER_ID;
    blockedWrapper.style.marginTop = "20px";
    blockedWrapper.style.maxWidth = "1050px";
    blockedWrapper.appendChild(
      buildRedirectBlockedEl(() => {
        localStorage.removeItem(config.STORAGE_KEY);
        blockedWrapper.remove();
        extractUrlAndEmbedWithOverlay();
      }),
    );
    targetDiv.insertAdjacentElement("afterend", blockedWrapper);
    return;
  }

  // -------------------------------------------------------
  // ラッパー（外枠）div を作成
  // 表示用 iframe と状態オーバーレイをこの div にまとめて入れる
  // -------------------------------------------------------
  const wrapper = document.createElement("div");
  wrapper.id = config.WRAPPER_ID;
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.maxWidth = "1050px";
  wrapper.style.marginTop = "20px";

  // -------------------------------------------------------
  // 表示用 iframe を作成
  // 最終的に抽出した URL をここにセットして出欠調査状況表を表示する
  // -------------------------------------------------------
  const visibleIframe = document.createElement("iframe");
  visibleIframe.style.width = "100%";
  visibleIframe.style.height = "600px";
  visibleIframe.style.border = "1px solid #ccc";
  visibleIframe.style.display = "block"; // inline だと余白がズレるので block に

  // -------------------------------------------------------
  // 状態表示オーバーレイ（左上に固定）を作成
  // -------------------------------------------------------
  const overlay = createOverlay();

  wrapper.appendChild(visibleIframe);
  wrapper.appendChild(overlay.el);
  targetDiv.insertAdjacentElement("afterend", wrapper);

  // -------------------------------------------------------
  // メインページの描画が安定するまで待機する（DOM の変化が落ち着くまで）
  // -------------------------------------------------------
  overlay.setStatus("起動待機中...\n準備を確認しています");
  await waitForPageSettle(window, 300, 2000);
  await sleep(randInt(config.SETTLE_DELAY_MIN, config.SETTLE_DELAY_MAX));

  // -------------------------------------------------------
  // URL 抽出処理（extractor.js に委譲）
  // コールバックで各ステップ完了後にオーバーレイを更新する
  // -------------------------------------------------------
  let attendanceUrl;
  try {
    attendanceUrl = await extractAttendanceUrl(config, visibleIframe, {
      onHomepageLoaded: () => {
        overlay.el.style.background = "#f0ad4e";
        overlay.setStatus("修学ポートフォリオを開いています...");
      },
      onPortfolioLoaded: () => {
        overlay.el.style.background = "#5bc0de";
        overlay.setStatus("出欠ボタンを探しています...");
      },
    });
  } catch (err) {
    overlay.stopTimer();

    // --- 外部リダイレクト検出 ---
    if (err.type === "redirect") {
      localStorage.setItem(config.STORAGE_KEY, "true");
      overlay.el.remove();
      wrapper.replaceChild(
        buildRedirectBlockedEl(() => {
          localStorage.removeItem(config.STORAGE_KEY);
          wrapper.remove();
          extractUrlAndEmbedWithOverlay();
        }),
        visibleIframe,
      );
      return;
    }

    // --- エラー状態をオーバーレイと iframe 枠線で表示する ---
    if (
      err.type === "parse_error" ||
      err.type === "access_blocked" ||
      err.type === "not_found"
    ) {
      const statusMessages = {
        parse_error: "エラー:\nURLの抽出に失敗しました",
        access_blocked: "エラー:\nページにアクセスできませんでした",
        not_found: "エラー:\nボタンが見つかりませんでした",
      };
      overlay.el.style.background = "#333";
      overlay.setStatus(statusMessages[err.type]);
      visibleIframe.style.border = "2px solid #d9534f";
      return;
    }

    return;
  }

  // -------------------------------------------------------
  // URL 抽出成功 — 表示用 iframe にセットする
  // -------------------------------------------------------
  overlay.el.style.background = "#5cb85c";
  overlay.setStatus("出欠調査状況表を読み込んでいます...");

  visibleIframe.src = attendanceUrl;

  // 3秒後にオーバーレイをフェードアウトさせて DOM から削除する
  overlay.fadeOutAndRemove(3000);
}

// ページの全リソース（画像・スクリプト等）の読み込みが完了してから実行する
window.addEventListener("load", extractUrlAndEmbedWithOverlay);
