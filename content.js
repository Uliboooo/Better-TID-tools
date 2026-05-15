function addFloatingButton() {
  const btn = document.createElement("div");
  btn.innerText = "Better AAA Portal\nExtension is Active";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.background = "#2ab300"; // 赤色
  btn.style.color = "white";
  btn.style.padding = "10px";
  btn.style.cursor = "pointer";
  btn.style.borderRadius = "5px";
  btn.style.zIndex = "999999";
  btn.style.fontSize = "14px";
  btn.style.fontWeight = "bold";

  document.body.appendChild(btn);
}
addFloatingButton();
