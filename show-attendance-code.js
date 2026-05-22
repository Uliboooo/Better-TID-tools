(function () {
  // 出席コードを入力欄で確認できるようにする（デフォルトで表示）
  const passwordField = document.getElementById("txtPassword");
  if (!passwordField) return;

  // 絵文字定数
  const EMOJI_VISIBLE = "🙉"; // テキスト表示中
  const EMOJI_HIDDEN = "🙈"; // 非表示中

  // ボタンを重ねるためにラッパーで囲む
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative;display:inline-block;width:170px;";
  passwordField.style.cssText +=
    ";width:100%;box-sizing:border-box;padding-right:28px;";
  passwordField.parentNode.insertBefore(wrapper, passwordField);
  wrapper.appendChild(passwordField);

  // 表示切り替えボタンを作成
  const eyeBtn = document.createElement("button");
  eyeBtn.type = "button";
  eyeBtn.title = "パスワードを表示/非表示";
  eyeBtn.style.cssText =
    "position:absolute;right:4px;top:50%;transform:translateY(-50%);" +
    "background:none;border:none;cursor:pointer;padding:0;font-size:16px;line-height:1;";
  wrapper.appendChild(eyeBtn);

  // 表示状態を管理（初期値：表示）
  let visible = true;

  function updateField() {
    passwordField.type = visible ? "text" : "password";
    eyeBtn.textContent = visible ? EMOJI_VISIBLE : EMOJI_HIDDEN;
  }

  // クリックで表示/非表示を切り替え
  eyeBtn.addEventListener("click", function () {
    visible = !visible;
    updateField();
  });

  updateField(); // 初期状態を反映
})();
