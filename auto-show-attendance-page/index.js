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
//   2. extractor.js が非表示 iframe で「修学ポートフォリオ」ページを読み込む
//   3. 「修学ポートフォリオ」ページ内の「出欠調査状況表」ボタンの onclick 属性から
//      遷移先 URL を正規表現で抽出する
//   4. 抽出した URL を表示用 iframe にセットして内容を表示する
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
  // メインページの描画が安定するまで初期待機する
  // -------------------------------------------------------
  overlay.startCountdown(
    "起動待機中...\n開始まで少々お待ちください",
    config.DELAY_BEFORE_START,
  );
  await sleep(config.DELAY_BEFORE_START);
  overlay.stopTimer();
  overlay.el.style.background = "#d9534f";
  overlay.setStatus("初期化中...\nページを読み込んでいます");

  // -------------------------------------------------------
  // URL 抽出処理（extractor.js に委譲）
  // onPageLoaded コールバックで iframe ロード完了後にオーバーレイを更新する
  // -------------------------------------------------------
  let attendanceUrl;
  try {
    attendanceUrl = await extractAttendanceUrl(config, {
      onPageLoaded: () => {
        overlay.stopTimer();
        overlay.el.style.background = "#f0ad4e";
        overlay.startCountdown(
          "ページ読み込み完了\n要素を待機中...",
          config.DELAY_BEFORE_FIND,
        );
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

    // --- iframe の内容を表示してエラーを確認できるようにする ---
    if (
      err.type === "parse_error" ||
      err.type === "access_blocked" ||
      err.type === "not_found"
    ) {
      const statusMessages = {
        parse_error: "エラー:\nURLの抽出に失敗しました",
        access_blocked: "エラー:\nアクセスがブロックされました",
        not_found: "エラー:\nボタンが見つかりません",
      };
      overlay.el.style.background = "#333";
      overlay.setStatus(statusMessages[err.type]);

      if (err.iframe) {
        const errorIframe = err.iframe;
        errorIframe.style.display = "block";
        errorIframe.style.width = "100%";
        errorIframe.style.height = "600px";
        errorIframe.style.border = "2px solid #d9534f";
        wrapper.replaceChild(errorIframe, visibleIframe);
      }
      return;
    }

    return;
  }

  // -------------------------------------------------------
  // URL 抽出成功 — 表示用 iframe にセットする
  // -------------------------------------------------------
  overlay.stopTimer();
  overlay.el.style.background = "#5bc0de";
  overlay.startCountdown(
    "ボタンを検出しました\nURLを解析中...",
    config.DELAY_AFTER_FIND,
  );
  await sleep(config.DELAY_AFTER_FIND);
  overlay.stopTimer();

  overlay.el.style.background = "#5cb85c";
  overlay.setStatus("成功!\nコンテンツを表示しています...");

  visibleIframe.src = attendanceUrl;

  // 3秒後にオーバーレイをフェードアウトさせて DOM から削除する
  overlay.fadeOutAndRemove(3000);
}

// ページの全リソース（画像・スクリプト等）の読み込みが完了してから実行する
window.addEventListener("load", extractUrlAndEmbedWithOverlay);
