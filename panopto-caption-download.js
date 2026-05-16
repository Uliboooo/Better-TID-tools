(function () {
  "use strict";

  const TOOLBAR_ID = "better-tid-panopto-caption-actions";
  const STYLE_ID = "better-tid-panopto-caption-styles";
  const DEFAULT_LAST_CUE_DURATION_MS = 3000;
  const DISPLAY_TIME_PATTERN = /^(\d{1,2})(?:[:：](\d{2}))?(?:[:：](\d{2}))?$/;

  function normalizeText(value) {
    return (value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\n+\s*/g, " ")
      .trim();
  }

  function parseDisplayTime(value) {
    const match = normalizeText(value).match(DISPLAY_TIME_PATTERN);
    if (!match) {
      return null;
    }

    const parts = match.slice(1).filter(Boolean).map(Number);
    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return (minutes * 60 + seconds) * 1000;
    }

    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return ((hours * 60 + minutes) * 60 + seconds) * 1000;
    }

    return null;
  }

  function parseStartFromTranscriptId(id, displayedStartMs) {
    const raw = id.replace(/^UserCreatedTranscript-/, "");
    if (!/^\d+$/.test(raw) || displayedStartMs === null) {
      return displayedStartMs;
    }

    const displayedSeconds = displayedStartMs / 1000;
    const candidates = [];

    for (let splitIndex = 1; splitIndex < raw.length; splitIndex += 1) {
      const candidate = Number(
        `${raw.slice(0, splitIndex)}.${raw.slice(splitIndex)}`,
      );
      if (Number.isFinite(candidate)) {
        candidates.push(candidate);
      }
    }

    if (candidates.length === 0) {
      return displayedStartMs;
    }

    const bestCandidate = candidates.reduce((best, candidate) => {
      return Math.abs(candidate - displayedSeconds) <
        Math.abs(best - displayedSeconds)
        ? candidate
        : best;
    }, candidates[0]);

    return Math.round(bestCandidate * 1000);
  }

  function extractCues(pane) {
    const cues = Array.from(
      pane.querySelectorAll("li.index-event[id^='UserCreatedTranscript-']"),
    )
      .map((item) => {
        const text = normalizeText(
          item.querySelector(".event-text span")?.textContent,
        );
        const displayedStartMs = parseDisplayTime(
          item.querySelector(".event-time")?.textContent,
        );
        const startMs = parseStartFromTranscriptId(item.id, displayedStartMs);

        if (!text || startMs === null) {
          return null;
        }

        return {
          startMs,
          text,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.startMs - b.startMs);

    return cues.map((cue, index) => {
      const nextCue = cues[index + 1];
      return {
        ...cue,
        endMs: nextCue
          ? Math.max(cue.startMs + 1, nextCue.startMs)
          : cue.startMs + DEFAULT_LAST_CUE_DURATION_MS,
      };
    });
  }

  function formatVttTime(milliseconds) {
    const totalMs = Math.max(0, Math.round(milliseconds));
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    return (
      [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0"),
      ].join(":") +
      "." +
      String(ms).padStart(3, "0")
    );
  }

  function toTxt(cues) {
    return cues.map((cue) => cue.text).join("\n");
  }

  function toVtt(cues) {
    const body = cues
      .map((cue) => {
        return `${formatVttTime(cue.startMs)} --> ${formatVttTime(cue.endMs)}\n${cue.text}`;
      })
      .join("\n\n");

    return `WEBVTT\n\n${body}\n`;
  }

  function sanitizeFilename(value) {
    return (
      (value || "panopto-captions")
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, " ")
        .trim() || "panopto-captions"
    );
  }

  function triggerDownload(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // 少し時間を置いてからURLを解放
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  }

  async function copyText(content) {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(content);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function getCuesOrAlert() {
    const pane = document.querySelector("#transcriptTabPane");
    if (!pane) {
      return null;
    }

    const cues = extractCues(pane);
    if (cues.length === 0) {
      alert(
        "字幕を取得できませんでした。キャプション一覧が表示されてから再試行してください。",
      );
      return null;
    }

    return cues;
  }

  function handleDownload(format) {
    const cues = getCuesOrAlert();
    if (!cues) {
      return;
    }

    const baseName = sanitizeFilename(document.title);
    if (format === "txt") {
      triggerDownload(
        `${baseName}.txt`,
        toTxt(cues),
        "text/plain;charset=utf-8",
      );
      return;
    }

    triggerDownload(`${baseName}.vtt`, toVtt(cues), "text/vtt;charset=utf-8");
  }

  async function handleCopy(format, feedbackTarget) {
    const cues = getCuesOrAlert();
    if (!cues) {
      return;
    }

    try {
      await copyText(format === "vtt" ? toVtt(cues) : toTxt(cues));
      showFeedback(feedbackTarget, "コピーしました");
    } catch (error) {
      console.error("Better-TID-tools: copy failed", error);
      alert("コピーに失敗しました。");
    }
  }

  function applyButtonBaseStyle(button) {
    button.type = "button";
    button.classList.add("better-tid-panopto-button");
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${TOOLBAR_ID} .better-tid-panopto-button {
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: rgba(0, 0, 0, 0.78);
        color: #fff;
        cursor: pointer;
        font-size: 12px;
        line-height: 1.2;
        transition:
          background 120ms ease,
          box-shadow 120ms ease;
      }

      #${TOOLBAR_ID} .better-tid-panopto-button:hover {
        background: rgba(42, 42, 42, 0.96);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
      }

      #${TOOLBAR_ID} .better-tid-panopto-button:focus-visible {
        outline: 2px solid rgba(120, 180, 255, 0.95);
        outline-offset: 2px;
      }

      #${TOOLBAR_ID} .better-tid-panopto-menu {
        background: rgba(0, 0, 0, 0.78);
        border: 1px solid rgba(255, 255, 255, 0.16);
      }
    `;
    document.head.appendChild(style);
  }

  function showFeedback(button, message) {
    const originalText = button.textContent;
    button.textContent = message;
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  }

  function createMenuButton(label, onClick) {
    const button = document.createElement("button");
    applyButtonBaseStyle(button);
    button.textContent = label;
    button.style.width = "100%";
    button.style.padding = "8px 10px";
    button.style.borderRadius = "0";
    button.style.borderTop = "0";
    button.style.textAlign = "left";
    button.style.whiteSpace = "nowrap";
    button.addEventListener("click", onClick);
    return button;
  }

  function ensureToolbar() {
    const pane = document.querySelector("#transcriptTabPane");
    const header = document.querySelector("#transcriptPaneHeader");
    if (!pane || !header || document.querySelector(`#${TOOLBAR_ID}`)) {
      return;
    }

    ensureStyles();

    if (getComputedStyle(header).position === "static") {
      header.style.position = "relative";
    }

    const toolbar = document.createElement("div");
    toolbar.id = TOOLBAR_ID;
    toolbar.style.position = "absolute";
    toolbar.style.top = "8px";
    toolbar.style.right = "8px";
    toolbar.style.zIndex = "20";
    toolbar.style.display = "inline-flex";
    toolbar.style.alignItems = "center";
    toolbar.style.position = "absolute";

    const splitButton = document.createElement("div");
    splitButton.style.position = "relative";
    splitButton.style.display = "inline-flex";
    splitButton.style.alignItems = "stretch";

    const copyButton = document.createElement("button");
    applyButtonBaseStyle(copyButton);
    copyButton.textContent = "テキストをコピー";
    copyButton.title = "時間なしテキストをコピー";
    copyButton.style.padding = "7px 10px";
    copyButton.style.borderRadius = "6px 0 0 6px";
    copyButton.style.borderRight = "0";
    copyButton.addEventListener("click", () => handleCopy("txt", copyButton));

    const dropdownButton = document.createElement("button");
    applyButtonBaseStyle(dropdownButton);
    dropdownButton.textContent = "∨";
    dropdownButton.title = "その他の操作";
    dropdownButton.setAttribute("aria-haspopup", "menu");
    dropdownButton.setAttribute("aria-expanded", "false");
    dropdownButton.style.width = "28px";
    dropdownButton.style.padding = "7px 0";
    dropdownButton.style.borderRadius = "0 6px 6px 0";

    const menu = document.createElement("div");
    menu.classList.add("better-tid-panopto-menu");
    menu.setAttribute("role", "menu");
    menu.style.position = "absolute";
    menu.style.top = "calc(100% + 6px)";
    menu.style.right = "0";
    menu.style.minWidth = "220px";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.overflow = "hidden";
    menu.style.borderRadius = "8px";
    menu.style.boxShadow = "0 10px 24px rgba(0,0,0,0.28)";

    const closeMenu = () => {
      menu.style.display = "none";
      dropdownButton.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      menu.style.display = "flex";
      dropdownButton.setAttribute("aria-expanded", "true");
    };

    dropdownButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (menu.style.display === "flex") {
        closeMenu();
        return;
      }
      openMenu();
    });

    menu.appendChild(
      createMenuButton("VTT（時間付き）をコピー", async () => {
        await handleCopy("vtt", copyButton);
        closeMenu();
      }),
    );
    menu.appendChild(
      createMenuButton("TXTをダウンロード", () => {
        handleDownload("txt");
        closeMenu();
      }),
    );
    menu.appendChild(
      createMenuButton("VTT（時間付き）をダウンロード", () => {
        handleDownload("vtt");
        closeMenu();
      }),
    );

    document.addEventListener("click", (event) => {
      if (!splitButton.contains(event.target)) {
        closeMenu();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    splitButton.appendChild(copyButton);
    splitButton.appendChild(dropdownButton);
    splitButton.appendChild(menu);
    toolbar.appendChild(splitButton);
    header.appendChild(toolbar);
  }

  ensureToolbar();

  const observer = new MutationObserver(() => {
    ensureToolbar();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
