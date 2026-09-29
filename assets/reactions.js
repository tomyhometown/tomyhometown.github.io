(function () {
  "use strict";

  var API_ENDPOINT = "https://cixinanchu-reactions.cixinanchu.workers.dev/";
  var panel = document.querySelector("[data-reaction]");
  if (!panel || API_ENDPOINT.indexOf("__") === 0) return;

  var button = panel.querySelector("[data-reaction-button]");
  var count = panel.querySelector("[data-reaction-count]");
  var status = panel.querySelector("[data-reaction-status]");
  var path = window.location.pathname;
  var storageKey = "cixinanchu:reaction:" + path;
  var token = null;

  try {
    token = window.localStorage.getItem(storageKey);
  } catch (_) {
    token = null;
  }

  function setReacted(reacted) {
    button.setAttribute("aria-pressed", reacted ? "true" : "false");
    button.classList.toggle("is-reacted", reacted);
  }

  function newToken() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (character) {
      var random = Math.random() * 16 | 0;
      var value = character === "x" ? random : (random & 3 | 8);
      return value.toString(16);
    });
  }

  function showCount(value) {
    count.textContent = String(Math.max(0, Number(value) || 0));
  }

  function rememberReaction(value) {
    try {
      if (value) {
        window.localStorage.setItem(storageKey, value);
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch (_) {
      // Storage can be unavailable in strict privacy modes; the current page still works.
    }
  }

  fetch(API_ENDPOINT + "?path=" + encodeURIComponent(path), { mode: "cors", cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("reaction count unavailable");
      return response.json();
    })
    .then(function (data) {
      showCount(data.count);
      setReacted(Boolean(token));
      panel.hidden = false;
    })
    .catch(function () {
      panel.hidden = true;
    });

  button.addEventListener("click", function () {
    var adding = button.getAttribute("aria-pressed") !== "true";
    if (adding && !token) token = newToken();
    if (!token) return;

    button.disabled = true;
    status.textContent = "正在记录…";
    fetch(API_ENDPOINT, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path, token: token, action: adding ? "add" : "remove" }),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("reaction update failed");
        return response.json();
      })
      .then(function (data) {
        if (adding) {
          rememberReaction(token);
        } else {
          rememberReaction(null);
          token = null;
        }
        setReacted(adding);
        showCount(data.count);
        status.textContent = adding ? "已收到，谢谢。" : "已取消。";
      })
      .catch(function () {
        status.textContent = "暂时无法记录，请稍后再试。";
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
