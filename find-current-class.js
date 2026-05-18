// =====================================================================
// find-current-class.js
// 概要: 現在時刻に一致する授業の「出席パスワード入力」要素を返す／操作する
//
// 【DOM への影響】
//   このスクリプトが HTML に追加する要素はヒントテキスト（hint div）のみ。
//   ヒントはポップアップ div（既存要素）の末尾に追加され、
//   マウスアウト時または Enter 押下時に自動で除去される。
//
// 【関数一覧】
//
//   findCurrentClassAttendanceButton()
//     現在時刻が授業時間内なら「出席パスワード入力」の <a> 要素を返す
//     授業時間外・ボタンなし・今週外の場合は null を返す
//
//   showCurrentClassPopup()
//     ページ読み込み時に現在授業のポップアップを自動表示し、
//     末尾に緑色の「Enterキーで入力」ヒントを追加する
//     ・Enter キーを押すと出席パスワード入力ボタンをクリックする
//     ・マウスアウト後はヒントとリスナーを除去し、
//       以降のホバーはページ本来の onmouseover/onmouseout に委ねる
// =====================================================================

// -------------------------------------------------------
// findCurrentClassAttendanceButton
// 現在時刻から今日の授業を特定し、
// 「出席パスワード入力」ボタン要素を返す
// -------------------------------------------------------
function findCurrentClassAttendanceButton() {
  const now = new Date();

  // 現在の日付を "MM/DD" 形式にする（ヘッダーのリンクテキストと一致させるため）
  const todayStr = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

  // 週カレンダーのヘッダー行から「今日」の列インデックスを特定する
  // 各 <td> に "05/18(月)" のようなリンクがあるため先頭の "MM/DD" で照合する
  const headerCells = document.querySelectorAll(
    "#tabCalender_tabPanelWeek_tblWRowHead td",
  );
  let todayColIndex = -1;
  headerCells.forEach((td, i) => {
    const link = td.querySelector("a.week_day");
    if (link && link.textContent.trim().startsWith(todayStr)) {
      todayColIndex = i;
    }
  });

  // 今日が今週の表示範囲外（先週・来週など）の場合は何もしない
  if (todayColIndex === -1) return null;

  // テーブルの2行目（授業データ行）から今日の列セルを取得する
  const dataRow = document.querySelector(
    "#tabCalender_tabPanelWeek_tblWeek tbody tr:nth-child(2)",
  );
  if (!dataRow) return null;

  const todayCell = dataRow.querySelectorAll("td")[todayColIndex];
  if (!todayCell) return null;

  // 比較しやすいよう現在時刻を「分」単位に変換する（例: 9:10 → 550分）
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // 今日のセル内にある全授業ブロック（.wscheduleWaku）を順に確認する
  for (const block of todayCell.querySelectorAll(".wscheduleWaku")) {
    // 授業ブロックの最初の .wschedule div に時刻が入っている（例: "09:10～10:50"）
    const timeText = block.querySelector(".wschedule")?.textContent.trim();
    if (!timeText) continue;

    // "HH:MM～HH:MM" 形式をパースする（全角チルダ ～ に注意）
    const match = timeText.match(/^(\d{2}):(\d{2})～(\d{2}):(\d{2})$/);
    if (!match) continue;

    const startMin = parseInt(match[1]) * 60 + parseInt(match[2]);
    const endMin = parseInt(match[3]) * 60 + parseInt(match[4]);

    // 現在時刻が授業時間内かどうかを確認する
    if (nowMinutes >= startMin && nowMinutes <= endMin) {
      // 授業ブロック内のリンクを走査して「出席パスワード入力」を探す
      // このリンクは出席管理がある授業にのみ存在する
      for (const link of block.querySelectorAll("a.jugyo_link_style")) {
        if (link.textContent.trim() === "出席パスワード入力") {
          return link;
        }
      }

      // 時刻は一致したが出席パスワード入力ボタンがない授業（出席管理なし）
      return null;
    }
  }

  // どの授業時間にも一致しなかった（授業と授業の間の休憩時間なども含む）
  return null;
}

// -------------------------------------------------------
// showCurrentClassPopup
// ページ読み込み直後に現在授業のポップアップを開き、
// Enter キーショートカットと「Enterキーで入力」ヒントを設定する
// -------------------------------------------------------
function showCurrentClassPopup() {
  const btn = findCurrentClassAttendanceButton();

  // 現在時刻に授業がない・出席ボタンがない場合は何もしない
  if (!btn) return null;

  // btn の祖先要素を辿り、ポップアップ div（通常は display:none で隠れている）を取得する
  // id は "tabCalender_tabPanelWeek_div_week_XXX" 形式
  const popupDiv = btn.closest('div[id^="tabCalender_tabPanelWeek_div_week_"]');
  if (!popupDiv) return btn;

  // ポップアップ div のさらに親がホバー検知対象のブロック（.wscheduleWaku）
  const block = popupDiv.closest(".wscheduleWaku");
  if (!block) return btn;

  // openPopUp はページ側のグローバル関数だが、
  // Chrome 拡張の content script ではページの window と隔離されているため
  // 直接呼び出すことができない。
  //
  // page 側の openPopUp 実装は次のようになっている:
  // function openPopUp(mainCtl, targetId, ctltop, ctlleft) {
  //     var subCtl = document.getElementById(targetId);
  //     if (subCtl) {
  //         mainCtl.style.position = "relative";
  //         mainCtl.style.zIndex = "1999";
  //         subCtl.style.position = "absolute";
  //         subCtl.style.width = "130px";
  //         subCtl.style.top = ctltop;
  //         subCtl.style.left = ctlleft;
  //         subCtl.style.border = "1px solid #000000";
  //         subCtl.style.display = "block";
  //         subCtl.style.backgroundColor = "#ffffff";
  //         subCtl.style.fontSize = "12px";
  //         subCtl.style.zIndex = "2000";
  //     }
  // }
  //
  // この content script では page から openPopUp を呼べないため、
  // その挙動をそのまま再現して表示する。
  block.style.position = "relative";
  block.style.zIndex = "1999";
  popupDiv.style.position = "absolute";
  popupDiv.style.width = "130px";
  popupDiv.style.top = "80px";
  popupDiv.style.left = "5px";
  popupDiv.style.border = "1px solid #000000";
  popupDiv.style.display = "block";
  popupDiv.style.backgroundColor = "#ffffff";
  popupDiv.style.fontSize = "12px";
  popupDiv.style.zIndex = "2000";

  // 「Enterキーで入力」ヒントをポップアップ末尾に追加する
  // このスクリプトが HTML に追加する唯一の要素
  // ポップアップの表示・非表示と連動して自然に見え隠れする（除去しない）
  const hint = document.createElement("div");
  hint.className = "jugyo_link_style"; // 既存スタイルに合わせる
  hint.style.color = "green";
  hint.style.fontWeight = "bold";
  hint.textContent = "Enterキーで入力";
  popupDiv.appendChild(hint);

  // Enter キーが押されたら出席パスワード入力ボタンをクリックする
  // ポップアップが非表示でもボタンは DOM 上に存在するため常に有効
  //
  // ただし enter-key-send.js との競合を避けるため、
  // 出席コード送信モーダル（#ibtnOK）がすでに開いている場合はスキップする
  // enter-key-send.js 側が offsetParent チェックで送信ボタンの表示を確認して処理する
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;

    // 出席コード送信モーダルが開いている場合は enter-key-send.js に委ねる
    const submitBtn = document.querySelector("#ibtnOK");
    if (submitBtn && submitBtn.offsetParent !== null) return;

    btn.click();
  });

  return btn;
}

// ページ読み込み完了後にポップアップを自動表示する
showCurrentClassPopup();
