const amountInput = document.querySelector("#amount");
const supportTotal = document.querySelector("#supportTotal");
const feeTotal = document.querySelector("#feeTotal");
const grandTotal = document.querySelector("#grandTotal");
const methodSummary = document.querySelector("#methodSummary");
const messageBox = document.querySelector("#formMessage");
const form = document.querySelector("#donationForm");
const presetButtons = [...document.querySelectorAll("[data-amount]")];
const paymentButtons = [...document.querySelectorAll("[data-method]")];
const messageInput = document.querySelector("#message");
const charCount = document.querySelector("#charCount");
const paymentDetails = document.querySelector("#paymentDetails");
const danaAccount = document.querySelector("#danaAccount");
const seaBankAccount = document.querySelector("#seabankAccount");
const copyDanaButton = document.querySelector("#copyDana");
const copySeaBankButton = document.querySelector("#copySeaBank");
const whatsappConfirmButton = document.querySelector("#whatsappConfirm");

const ACCOUNTS = {
  DANA: { number: "088279732646", name: "Magdalena Nadapdap" },
  SeaBank: { number: "901402872450", name: "Fitry Siahaan" }
};
const WHATSAPP_NUMBER = "62895322636798";
let selectedMethod = "";

const rupiah = value => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(value);

function showMessage(text, isError = false) {
  messageBox.textContent = text;
  messageBox.classList.toggle("error", isError);
}

function updateSummary() {
  const amount = Math.max(0, Number(amountInput.value) || 0);
  supportTotal.textContent = rupiah(amount);
  grandTotal.textContent = rupiah(amount);
  methodSummary.textContent = selectedMethod || "Belum dipilih";
  feeTotal.textContent = selectedMethod ? "Sesuai aplikasi" : "Belum dihitung";
}

function getWhatsAppMessage() {
  const account = ACCOUNTS[selectedMethod];
  const amount = Number(amountInput.value);
  const sender = document.querySelector("#sender").value.trim();
  const email = document.querySelector("#email").value.trim();
  const donationMessage = messageInput.value.trim();
  const media = document.querySelector('input[name="media"]:checked')?.value || "Tidak ada";
  return [
    "Halo, saya ingin mengonfirmasi dukungan untuk Fitry Siahaan.",
    "Nama pengirim: " + sender,
    "Nominal: " + rupiah(amount),
    "Metode: " + selectedMethod,
    "Nomor tujuan: " + account.number,
    "Atas nama: " + account.name,
    "Email: " + email,
    "Pesan dukungan: " + (donationMessage || "-"),
    "Media pilihan: " + media,
    "Saya akan melampirkan bukti transfer setelah melakukan transfer."
  ].join("\n");
}

function openWhatsAppConfirmation() {
  if (!form.reportValidity()) {
    showMessage("Lengkapi kolom wajib dan persetujuan terlebih dahulu.", true);
    return;
  }
  const amount = Number(amountInput.value);
  if (!Number.isFinite(amount) || amount < 1000) {
    showMessage("Nominal dukungan minimal Rp1.000.", true);
    amountInput.focus();
    return;
  }
  if (!ACCOUNTS[selectedMethod]) {
    showMessage("Pilih DANA atau SeaBank terlebih dahulu.", true);
    return;
  }
  // Demo lokal: simpan catatan pada browser/perangkat ini saja.
  // Untuk data lintas perangkat/pengunjung, hubungkan ke backend/database.
  try {
    const records = JSON.parse(localStorage.getItem("ruangDukunganRecords") || "[]");
    records.unshift({
      id: Date.now().toString(),
      name: document.querySelector("#sender").value.trim(),
      amount,
      method: selectedMethod,
      message: messageInput.value.trim(),
      media: document.querySelector('input[name="media"]:checked')?.value || "Tidak ada",
      createdAt: new Date().toISOString(),
      status: "Belum diverifikasi"
    });
    localStorage.setItem("ruangDukunganRecords", JSON.stringify(records));
  } catch (error) {
    console.warn("Catatan dukungan tidak dapat disimpan di browser ini.", error);
  }
  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(getWhatsAppMessage());
  showMessage("Membuka WhatsApp. Periksa pesan lalu kirim setelah transfer.");
  window.location.href = url;
}

async function copyText(text, button, label) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement("textarea");
      temp.value = text; temp.style.position = "fixed"; temp.style.opacity = "0";
      document.body.appendChild(temp); temp.select();
      const copied = document.execCommand("copy"); temp.remove();
      if (!copied) throw new Error("copy failed");
    }
    button.textContent = "Nomor tersalin ✓";
    showMessage(label + " berhasil disalin.");
  } catch {
    showMessage("Salin nomor ini secara manual: " + text);
  }
}

presetButtons.forEach(button => button.addEventListener("click", () => {
  amountInput.value = button.dataset.amount;
  presetButtons.forEach(item => item.classList.toggle("active", item === button));
  updateSummary();
}));

amountInput.addEventListener("input", () => {
  presetButtons.forEach(button => button.classList.toggle("active", Number(button.dataset.amount) === Number(amountInput.value)));
  updateSummary();
});

paymentButtons.forEach(button => button.addEventListener("click", () => {
  selectedMethod = button.dataset.method;
  paymentButtons.forEach(item => {
    item.classList.toggle("selected", item === button);
    item.setAttribute("aria-pressed", String(item === button));
  });
  updateSummary();
  paymentDetails.hidden = false;
  danaAccount.hidden = selectedMethod !== "DANA";
  seaBankAccount.hidden = selectedMethod !== "SeaBank";
  showMessage("Detail " + selectedMethod + " ditampilkan. Transfer manual, lalu konfirmasi melalui WhatsApp.");
  paymentDetails.scrollIntoView({ behavior: "smooth", block: "nearest" });
}));

copyDanaButton.addEventListener("click", () => copyText(ACCOUNTS.DANA.number, copyDanaButton, "Nomor DANA"));
copySeaBankButton.addEventListener("click", () => copyText(ACCOUNTS.SeaBank.number, copySeaBankButton, "Nomor SeaBank"));
whatsappConfirmButton.addEventListener("click", openWhatsAppConfirmation);
form.addEventListener("submit", event => { event.preventDefault(); openWhatsAppConfirmation(); });
messageInput.addEventListener("input", () => { charCount.textContent = messageInput.value.length; });
document.querySelector("#year").textContent = new Date().getFullYear();
updateSummary();


// Pilihan pesan personal: isi textarea agar pengunjung lebih mudah menulis dukungan.
document.querySelectorAll("[data-message]").forEach(button => {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.message;
    charCount.textContent = messageInput.value.length;
    document.querySelectorAll("[data-message]").forEach(item => item.classList.toggle("active", item === button));
    messageInput.focus();
  });
});


// Animasi ketika bagian halaman mulai terlihat saat digulir.
// Jika browser tidak mendukung IntersectionObserver, semua bagian tetap terlihat.
(() => {
  const targets = document.querySelectorAll(
    'main .section-heading, main .form-card, main .summary-card, main .quote-card, main .privacy, footer'
  );
  targets.forEach((el, index) => {
    el.setAttribute('data-reveal', '');
    el.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 90}ms`);
  });
  document.body.classList.add('motion-ready');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  targets.forEach(el => observer.observe(el));
})();
