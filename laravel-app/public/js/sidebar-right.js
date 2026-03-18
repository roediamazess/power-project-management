(function () {
  function getCookieSafe(name) {
    if (typeof window.getCookie === "function") return window.getCookie(name);
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : "";
  }

  function setCookieSafe(name, value) {
    if (typeof window.setCookie === "function") {
      window.setCookie(name, value);
      return;
    }
    var d = new Date();
    d.setTime(d.getTime() + 30 * 60 * 1000);
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      ";expires=" +
      d.toUTCString() +
      ";path=/";
  }

  function deleteCookieSafe(name) {
    if (typeof window.deleteCookie === "function") {
      window.deleteCookie(name);
      return;
    }
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }

  function ensureThemeOptionArr() {
    if (window.themeOptionArr) return;
    window.themeOptionArr = {
      typography: true,
      version: true,
      layout: true,
      primary: true,
      headerBg: true,
      navheaderBg: true,
      sidebarBg: true,
      sidebarStyle: true,
      sidebarPosition: true,
      headerPosition: true,
      containerLayout: true,
    };
  }

  function applyOptions() {
    if (typeof window.dlabSettings !== "function") return false;
    if (!window.dlabSettingsOptions) return false;
    try {
      new window.dlabSettings(window.dlabSettingsOptions);
      return true;
    } catch (_e) {
      return false;
    }
  }

  function initSettingsUi(panel) {
    ensureThemeOptionArr();

    var keys = Object.keys(window.themeOptionArr);
    if (window.dlabSettingsOptions) {
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var v = getCookieSafe(key);
        if (v) window.dlabSettingsOptions[key] = v;
      }
      applyOptions();
    }

    function setOption(key, value) {
      if (!window.dlabSettingsOptions) return;
      window.dlabSettingsOptions[key] = value;
      setCookieSafe(key, value);
      applyOptions();
    }

    function syncUi() {
      if (!window.dlabSettingsOptions) return;

      var el;

      el = panel.querySelector("#theme_version");
      if (el) el.value = window.dlabSettingsOptions.version || "light";

      el = panel.querySelector("#theme_layout");
      if (el) el.value = window.dlabSettingsOptions.layout || "vertical";

      el = panel.querySelector("#container_layout");
      if (el) el.value = window.dlabSettingsOptions.containerLayout || "full";

      el = panel.querySelector("#sidebar_style");
      if (el) el.value = window.dlabSettingsOptions.sidebarStyle || "full";

      el = panel.querySelector("#header_position");
      if (el) el.value = window.dlabSettingsOptions.headerPosition || "fixed";

      el = panel.querySelector("#sidebar_position");
      if (el) el.value = window.dlabSettingsOptions.sidebarPosition || "fixed";

      el = panel.querySelector("#theme_typography");
      if (el) el.value = window.dlabSettingsOptions.typography || "poppins";

      var q;

      q = panel.querySelector(
        'input[name="primary_color"][value="' +
          (window.dlabSettingsOptions.primary || "color_1") +
          '"]'
      );
      if (q) q.checked = true;

      q = panel.querySelector(
        'input[name="nav_header_color"][value="' +
          (window.dlabSettingsOptions.navheaderBg || "color_1") +
          '"]'
      );
      if (q) q.checked = true;

      q = panel.querySelector(
        'input[name="header_color"][value="' +
          (window.dlabSettingsOptions.headerBg || "color_1") +
          '"]'
      );
      if (q) q.checked = true;

      q = panel.querySelector(
        'input[name="sidebar_color"][value="' +
          (window.dlabSettingsOptions.sidebarBg || "color_1") +
          '"]'
      );
      if (q) q.checked = true;

      if (window.jQuery && window.jQuery.fn && window.jQuery.fn.selectpicker) {
        window.jQuery(panel).find(".default-select").selectpicker("refresh");
      }
    }

    syncUi();

    panel.addEventListener("change", function (e) {
      var t = e.target;
      if (!t) return;

      if (t.id === "theme_version") return setOption("version", t.value);
      if (t.id === "theme_layout") return setOption("layout", t.value);
      if (t.id === "container_layout") return setOption("containerLayout", t.value);
      if (t.id === "sidebar_style") return setOption("sidebarStyle", t.value);
      if (t.id === "header_position") return setOption("headerPosition", t.value);
      if (t.id === "sidebar_position") return setOption("sidebarPosition", t.value);
      if (t.id === "theme_typography") return setOption("typography", t.value);

      if (t.name === "primary_color") return setOption("primary", t.value);
      if (t.name === "nav_header_color") return setOption("navheaderBg", t.value);
      if (t.name === "header_color") return setOption("headerBg", t.value);
      if (t.name === "sidebar_color") return setOption("sidebarBg", t.value);
    });

    var deleteBtn = panel.querySelector("#deleteAllCookie");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof window.deleteAllCookie === "function") {
          window.deleteAllCookie(true);
          return;
        }
        for (var i = 0; i < keys.length; i++) deleteCookieSafe(keys[i]);
        window.location.reload();
      });
    }
  }

  function init() {
    var panel = document.querySelector(".sidebar-right");
    if (!panel) return;

    if (!panel.querySelector("#theme_version")) {
      panel.className = "sidebar-right";
      panel.innerHTML =
        '<div class="bg-overlay"></div>' +
        '<a class="sidebar-right-trigger" href="javascript:void(0);"><span><i class="fas fa-cog"></i></span></a>' +
        '<a class="sidebar-close-trigger" href="javascript:void(0);"><i class="las la-times"></i></a>' +
        '<div class="sidebar-right-inner">' +
        '<div class="d-flex align-items-center justify-content-between mb-3">' +
        '<h4 class="mb-0">Pick your style</h4>' +
        '<button class="btn btn-primary btn-sm" id="deleteAllCookie">Delete All Cookie</button>' +
        "</div>" +
        '<div class="card-tabs"><ul class="nav nav-tabs" role="tablist">' +
        '<li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#theme-tab" role="tab">Theme</a></li>' +
        '<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#header-tab" role="tab">Header</a></li>' +
        '<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#content-tab" role="tab">Content</a></li>' +
        "</ul></div>" +
        '<div class="tab-content">' +
        '<div class="tab-pane fade active show" id="theme-tab" role="tabpanel"><div class="admin-settings">' +
        '<div class="row"><div class="col-12"><p>Background</p>' +
        '<select class="default-select form-control wide" id="theme_version">' +
        '<option value="light">Light</option><option value="dark">Dark</option><option value="transparent">Transparent</option>' +
        "</select></div>" +
        '<div class="col-lg-6 mt-4"><p>Primary Color</p><div>' +
        '<input type="radio" name="primary_color" value="color_1" id="primary_color_1"><label for="primary_color_1"></label>' +
        '<input type="radio" name="primary_color" value="color_2" id="primary_color_2"><label for="primary_color_2"></label>' +
        '<input type="radio" name="primary_color" value="color_3" id="primary_color_3"><label for="primary_color_3"></label>' +
        '<input type="radio" name="primary_color" value="color_4" id="primary_color_4"><label for="primary_color_4"></label>' +
        '<input type="radio" name="primary_color" value="color_5" id="primary_color_5"><label for="primary_color_5"></label>' +
        '<input type="radio" name="primary_color" value="color_6" id="primary_color_6"><label for="primary_color_6"></label>' +
        '<input type="radio" name="primary_color" value="color_7" id="primary_color_7"><label for="primary_color_7"></label>' +
        '<input type="radio" name="primary_color" value="color_8" id="primary_color_8"><label for="primary_color_8"></label>' +
        '<input type="radio" name="primary_color" value="color_9" id="primary_color_9"><label for="primary_color_9"></label>' +
        '<input type="radio" name="primary_color" value="color_10" id="primary_color_10"><label for="primary_color_10"></label>' +
        '<input type="radio" name="primary_color" value="color_11" id="primary_color_11"><label for="primary_color_11"></label>' +
        '<input type="radio" name="primary_color" value="color_12" id="primary_color_12"><label for="primary_color_12"></label>' +
        '<input type="radio" name="primary_color" value="color_13" id="primary_color_13"><label for="primary_color_13"></label>' +
        '<input type="radio" name="primary_color" value="color_14" id="primary_color_14"><label for="primary_color_14"></label>' +
        '<input type="radio" name="primary_color" value="color_15" id="primary_color_15"><label for="primary_color_15"></label>' +
        "</div></div>" +
        '<div class="col-lg-6 mt-4"><p>Navigation Header</p><div>' +
        '<input type="radio" name="nav_header_color" value="color_1" id="nav_header_color_1"><label for="nav_header_color_1"></label>' +
        '<input type="radio" name="nav_header_color" value="color_2" id="nav_header_color_2"><label for="nav_header_color_2"></label>' +
        '<input type="radio" name="nav_header_color" value="color_3" id="nav_header_color_3"><label for="nav_header_color_3"></label>' +
        '<input type="radio" name="nav_header_color" value="color_4" id="nav_header_color_4"><label for="nav_header_color_4"></label>' +
        '<input type="radio" name="nav_header_color" value="color_5" id="nav_header_color_5"><label for="nav_header_color_5"></label>' +
        '<input type="radio" name="nav_header_color" value="color_6" id="nav_header_color_6"><label for="nav_header_color_6"></label>' +
        '<input type="radio" name="nav_header_color" value="color_7" id="nav_header_color_7"><label for="nav_header_color_7"></label>' +
        '<input type="radio" name="nav_header_color" value="color_8" id="nav_header_color_8"><label for="nav_header_color_8"></label>' +
        '<input type="radio" name="nav_header_color" value="color_9" id="nav_header_color_9"><label for="nav_header_color_9"></label>' +
        '<input type="radio" name="nav_header_color" value="color_10" id="nav_header_color_10"><label for="nav_header_color_10"></label>' +
        '<input type="radio" name="nav_header_color" value="color_11" id="nav_header_color_11"><label for="nav_header_color_11"></label>' +
        '<input type="radio" name="nav_header_color" value="color_12" id="nav_header_color_12"><label for="nav_header_color_12"></label>' +
        '<input type="radio" name="nav_header_color" value="color_13" id="nav_header_color_13"><label for="nav_header_color_13"></label>' +
        '<input type="radio" name="nav_header_color" value="color_14" id="nav_header_color_14"><label for="nav_header_color_14"></label>' +
        '<input type="radio" name="nav_header_color" value="color_15" id="nav_header_color_15"><label for="nav_header_color_15"></label>' +
        "</div></div>" +
        '<div class="col-lg-6 mt-4"><p>Header</p><div>' +
        '<input type="radio" name="header_color" value="color_1" id="header_color_1"><label for="header_color_1"></label>' +
        '<input type="radio" name="header_color" value="color_2" id="header_color_2"><label for="header_color_2"></label>' +
        '<input type="radio" name="header_color" value="color_3" id="header_color_3"><label for="header_color_3"></label>' +
        '<input type="radio" name="header_color" value="color_4" id="header_color_4"><label for="header_color_4"></label>' +
        '<input type="radio" name="header_color" value="color_5" id="header_color_5"><label for="header_color_5"></label>' +
        '<input type="radio" name="header_color" value="color_6" id="header_color_6"><label for="header_color_6"></label>' +
        '<input type="radio" name="header_color" value="color_7" id="header_color_7"><label for="header_color_7"></label>' +
        '<input type="radio" name="header_color" value="color_8" id="header_color_8"><label for="header_color_8"></label>' +
        '<input type="radio" name="header_color" value="color_9" id="header_color_9"><label for="header_color_9"></label>' +
        '<input type="radio" name="header_color" value="color_10" id="header_color_10"><label for="header_color_10"></label>' +
        '<input type="radio" name="header_color" value="color_11" id="header_color_11"><label for="header_color_11"></label>' +
        '<input type="radio" name="header_color" value="color_12" id="header_color_12"><label for="header_color_12"></label>' +
        '<input type="radio" name="header_color" value="color_13" id="header_color_13"><label for="header_color_13"></label>' +
        '<input type="radio" name="header_color" value="color_14" id="header_color_14"><label for="header_color_14"></label>' +
        '<input type="radio" name="header_color" value="color_15" id="header_color_15"><label for="header_color_15"></label>' +
        "</div></div>" +
        '<div class="col-lg-6 mt-4"><p>Sidebar</p><div>' +
        '<input type="radio" name="sidebar_color" value="color_1" id="sidebar_color_1"><label for="sidebar_color_1"></label>' +
        '<input type="radio" name="sidebar_color" value="color_2" id="sidebar_color_2"><label for="sidebar_color_2"></label>' +
        '<input type="radio" name="sidebar_color" value="color_3" id="sidebar_color_3"><label for="sidebar_color_3"></label>' +
        '<input type="radio" name="sidebar_color" value="color_4" id="sidebar_color_4"><label for="sidebar_color_4"></label>' +
        '<input type="radio" name="sidebar_color" value="color_5" id="sidebar_color_5"><label for="sidebar_color_5"></label>' +
        '<input type="radio" name="sidebar_color" value="color_6" id="sidebar_color_6"><label for="sidebar_color_6"></label>' +
        '<input type="radio" name="sidebar_color" value="color_7" id="sidebar_color_7"><label for="sidebar_color_7"></label>' +
        '<input type="radio" name="sidebar_color" value="color_8" id="sidebar_color_8"><label for="sidebar_color_8"></label>' +
        '<input type="radio" name="sidebar_color" value="color_9" id="sidebar_color_9"><label for="sidebar_color_9"></label>' +
        '<input type="radio" name="sidebar_color" value="color_10" id="sidebar_color_10"><label for="sidebar_color_10"></label>' +
        '<input type="radio" name="sidebar_color" value="color_11" id="sidebar_color_11"><label for="sidebar_color_11"></label>' +
        '<input type="radio" name="sidebar_color" value="color_12" id="sidebar_color_12"><label for="sidebar_color_12"></label>' +
        '<input type="radio" name="sidebar_color" value="color_13" id="sidebar_color_13"><label for="sidebar_color_13"></label>' +
        '<input type="radio" name="sidebar_color" value="color_14" id="sidebar_color_14"><label for="sidebar_color_14"></label>' +
        '<input type="radio" name="sidebar_color" value="color_15" id="sidebar_color_15"><label for="sidebar_color_15"></label>' +
        "</div></div></div>" +
        "</div></div>" +
        '<div class="tab-pane fade" id="header-tab" role="tabpanel"><div class="admin-settings"><div class="row">' +
        '<div class="col-lg-6"><p>Layout</p><select class="default-select form-control wide" id="theme_layout"><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></div>' +
        '<div class="col-lg-6"><p>Header position</p><select class="default-select form-control wide" id="header_position"><option value="fixed">Fixed</option><option value="static">Static</option></select></div>' +
        '<div class="col-lg-6 mt-4"><p>Sidebar</p><select class="default-select form-control wide" id="sidebar_style"><option value="full">Full</option><option value="mini">Mini</option><option value="compact">Compact</option><option value="modern">Modern</option><option value="icon-hover">Icon Hover</option><option value="overlay">Overlay</option></select></div>' +
        '<div class="col-lg-6 mt-4"><p>Sidebar position</p><select class="default-select form-control wide" id="sidebar_position"><option value="fixed">Fixed</option><option value="static">Static</option></select></div>' +
        "</div></div></div>" +
        '<div class="tab-pane fade" id="content-tab" role="tabpanel"><div class="admin-settings"><div class="row">' +
        '<div class="col-lg-6"><p>Container</p><select class="default-select form-control wide" id="container_layout"><option value="full">Full</option><option value="boxed">Boxed</option><option value="wide-boxed">Wide Boxed</option></select></div>' +
        '<div class="col-lg-6"><p>Body Font</p><select class="default-select form-control wide" id="theme_typography"><option value="poppins">Poppins</option><option value="roboto">Roboto</option><option value="opensans">Open Sans</option><option value="helvetica">Helvetica</option></select></div>' +
        "</div></div></div>" +
        "</div></div>" +
        '<div class="note-text">Theme &amp; layout settings</div>';
    }

    var openBtn = panel.querySelector(".sidebar-right-trigger");
    var closeBtn = panel.querySelector(".sidebar-close-trigger");
    var overlay = panel.querySelector(".bg-overlay");

    function open() {
      panel.classList.add("show");
    }

    function close() {
      panel.classList.remove("show");
    }

    if (openBtn) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        close();
      });
    }

    if (overlay) {
      overlay.addEventListener("click", function () {
        close();
      });
    }

    initSettingsUi(panel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
