let popupTimer = null;

function showPopup({ type = "info", title, message, html, confirmText, cancelText }) {
  if (popupTimer) {
    clearTimeout(popupTimer);
    popupTimer = null;
  }

  return new Promise((resolve) => {
    const overlay = document.getElementById("popupOverlay");
    const box = document.getElementById("popupBox");
    const icon = document.getElementById("popupIcon");
    const titleEl = document.getElementById("popupTitle");
    const msgEl = document.getElementById("popupMessage");
    const actions = document.getElementById("popupActions");

    const config = {
      success: {
        bg: "bg-emerald-100 text-emerald-600",
        svg: `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`,
        title: title || "Berhasil",
      },
      error: {
        bg: "bg-rose-100 text-rose-600",
        svg: `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
        title: title || "Gagal",
      },
      warning: {
        bg: "bg-amber-100 text-amber-600",
        svg: `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`,
        title: title || "Peringatan",
      },
      info: {
        bg: "bg-blue-100 text-blue-600",
        svg: `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>`,
        title: title || "Informasi",
      },
      confirm: {
        bg: "bg-amber-100 text-amber-600",
        svg: `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.008v.008H12V18z"/></svg>`,
        title: title || "Konfirmasi",
      },
      qris: {
        bg: "bg-blue-100 text-blue-600",
        svg: `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/></svg>`,
        title: title || "Pembayaran QRIS",
      },
    };
    const c = config[type] || config.info;

    icon.className = "w-10 h-10 rounded-full flex items-center justify-center shrink-0 " + c.bg;
    icon.innerHTML = c.svg;
    titleEl.textContent = c.title;

    if (html) {
      msgEl.innerHTML = html;
    } else {
      msgEl.textContent = message || "";
    }

    actions.innerHTML = "";
    if (type === "confirm" || type === "qris") {
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = cancelText || "Batal";
      cancelBtn.className = "py-2 px-4 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors";
      cancelBtn.onclick = async () => { await closePopup(); resolve(false); };

      const okBtn = document.createElement("button");
      okBtn.textContent = confirmText || (type === "qris" ? "Sudah Bayar" : "Ya, Lanjutkan");
      const okBg = type === "qris" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700";
      okBtn.className = `py-2 px-4 rounded-lg text-white text-sm font-medium cursor-pointer transition-colors ${okBg}`;
      okBtn.onclick = async () => { await closePopup(); resolve(true); };

      actions.appendChild(cancelBtn);
      actions.appendChild(okBtn);
    } else {
      const okBtn = document.createElement("button");
      okBtn.textContent = confirmText || "OK";
      okBtn.className = "py-2 px-5 rounded-lg bg-blue-900 text-white text-sm font-medium cursor-pointer hover:bg-blue-950 transition-colors";
      okBtn.onclick = async () => { await closePopup(); resolve(true); };
      actions.appendChild(okBtn);
    }

    overlay.classList.remove("hidden");
    overlay.style.display = "flex";

    box.classList.remove("scale-100", "translate-y-0", "opacity-100");
    box.classList.add("scale-90", "translate-y-3", "opacity-0");
    overlay.classList.remove("opacity-100");
    overlay.classList.add("opacity-0");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.remove("opacity-0");
        overlay.classList.add("opacity-100");
        box.classList.remove("scale-90", "translate-y-3", "opacity-0");
        box.classList.add("scale-100", "translate-y-0", "opacity-100");
      });
    });
  });
}

function closePopup() {
  return new Promise((resolve) => {
    const overlay = document.getElementById("popupOverlay");
    const box = document.getElementById("popupBox");

    box.classList.remove("scale-100", "translate-y-0", "opacity-100");
    box.classList.add("scale-90", "translate-y-3", "opacity-0");
    overlay.classList.remove("opacity-100");
    overlay.classList.add("opacity-0");

    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => {
      overlay.style.display = "none";
      overlay.classList.add("hidden");
      popupTimer = null;
      resolve();
    }, 220);
  });
}

function popupAlert(message, type = "info", title) {
  return showPopup({ type, title, message });
}

function popupConfirm(message, title) {
  return showPopup({ type: "confirm", title, message });
}
