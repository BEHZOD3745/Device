const BUNDLE_PRICE = 200;
const CABLE_PRICE = 50;

const SHIPPING_PRICES = {
  Standard: 40,
  Medium: 50,
  Overnight: 70,
};

const API_URL = "/api/send-order";

const PINS = [
  {
    key: "6-pin",
    label: "6 PIN",
    bundleImage: "images/6PIN.png",
    cableImage: "images/6PIN.png",
  },
  {
    key: "9-pin",
    label: "9 PIN",
    bundleImage: "images/9PIN.png",
    cableImage: "images/9PIN.png",
  },
  {
    key: "16-pin",
    label: "16 PIN",
    bundleImage: "images/16PIN.png",
    cableImage: "images/16PIN.png",
  },
];

const VEHICLE_TYPES = [
  { key: "heavy-duty", label: "Heavy Duty" },
  { key: "light-medium-duty", label: "Light / Medium Duty" },
];

const form = document.getElementById("orderForm");
const output = document.getElementById("telegramOutput");
const copyBtn = document.getElementById("copyBtn");

const bundleSection = document.getElementById("bundleSection");
const cableSection = document.getElementById("cableSection");
const bundleGrid = document.getElementById("bundleGrid");
const cableGrid = document.getElementById("cableGrid");

const productTotalElement = document.getElementById("productTotal");
const shippingTotalElement = document.getElementById("shippingTotal");
const grandTotalElement = document.getElementById("grandTotal");

function createQuantityRow(type, pinKey, pinLabel, vehicleKey, vehicleLabel) {
  const inputId = `${type}-${pinKey}-${vehicleKey}`;

  return `
    <div class="product-card__vehicle-row">
      <label class="product-card__label" for="${inputId}">${vehicleLabel}</label>
      <input
        class="product-card__quantity"
        type="number"
        id="${inputId}"
        min="0"
        step="1"
        value="0"
        data-item-type="${type}"
        data-item-label="${pinLabel}"
        data-vehicle-label="${vehicleLabel}"
      />
    </div>
  `;
}

function createCardMarkup(type, pin) {
  const isBundle = type === "bundle";
  const title = isBundle ? `${pin.label} Cable  + Device ` : `${pin.label} Cable`;
  const description = isBundle
    ? `Price per unit: $${BUNDLE_PRICE}`
    : `Price per unit: $${CABLE_PRICE}`;
  const imageSrc = isBundle ? pin.bundleImage : pin.cableImage;
  const imageAlt = isBundle ? `${pin.label} cable and device` : `${pin.label} cable`;

  const rows = VEHICLE_TYPES.map((vehicle) =>
    createQuantityRow(type, pin.key, pin.label, vehicle.key, vehicle.label)
  ).join("");

  return `
    <article class="product-card">
      <figure class="product-card__figure">
        <img class="product-card__image" src="${imageSrc}" alt="${imageAlt}" />
      </figure>

      <div class="product-card__body">
        <h3 class="product-card__title">${title}</h3>
        <p class="product-card__description">${description}</p>

        <div class="product-card__vehicle-group">
          ${rows}
        </div>
      </div>
    </article>
  `;
}

function renderProductCards() {
  bundleGrid.innerHTML = PINS.map((pin) => createCardMarkup("bundle", pin)).join("");
  cableGrid.innerHTML = PINS.map((pin) => createCardMarkup("cable", pin)).join("");
}

function getSelectedMode() {
  const selected = document.querySelector('input[name="orderMode"]:checked');
  return selected ? selected.value : "device-cable";
}

function getSelectedShipping() {
  const selected = document.querySelector('input[name="shippingType"]:checked');
  return selected ? selected.value : "Standard";
}

function getShippingPrice() {
  return SHIPPING_PRICES[getSelectedShipping()] || 0;
}

function getInputsByType(type) {
  return Array.from(document.querySelectorAll(`[data-item-type="${type}"]`));
}

function collectItems(type) {
  return getInputsByType(type)
    .map((input) => {
      const quantity = Number(input.value) || 0;

      return {
        itemLabel: input.dataset.itemLabel,
        vehicleLabel: input.dataset.vehicleLabel,
        quantity,
      };
    })
    .filter((item) => item.quantity > 0);
}

function getItemsTotalQuantity(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function getProductTotal() {
  const mode = getSelectedMode();
  const items = mode === "device-cable" ? collectItems("bundle") : collectItems("cable");
  const unitPrice = mode === "device-cable" ? BUNDLE_PRICE : CABLE_PRICE;

  return getItemsTotalQuantity(items) * unitPrice;
}

function formatMoney(value) {
  return `$${value}`;
}

function updateTotals() {
  const productTotal = getProductTotal();
  const shippingTotal = getShippingPrice();
  const grandTotal = productTotal + shippingTotal;

  productTotalElement.textContent = formatMoney(productTotal);
  shippingTotalElement.textContent = formatMoney(shippingTotal);
  grandTotalElement.textContent = formatMoney(grandTotal);
}

function syncModeUI() {
  const mode = getSelectedMode();
  const isBundleMode = mode === "device-cable";

  bundleSection.hidden = !isBundleMode;
  cableSection.hidden = isBundleMode;

  updateTotals();
}

function buildItemsBlock(title, items) {
  const lines = items
    .map((item) => `- ${item.itemLabel} / ${item.vehicleLabel}: ${item.quantity}`)
    .join("\n");

  return `${title}:\n${lines}`;
}

const themeToggle = document.getElementById("themeToggle");
const page = document.body;

function applyTheme(theme) {
  const isLight = theme === "light";

  page.classList.toggle("page--light", isLight);
  themeToggle.textContent = isLight ? "Dark mode" : "Light mode";

  localStorage.setItem("site-theme", theme);
}

function initTheme() {
  const savedTheme = localStorage.getItem("site-theme") || "light";
  applyTheme(savedTheme);
}

themeToggle.addEventListener("click", () => {
  const isLight = page.classList.contains("page--light");
  applyTheme(isLight ? "dark" : "light");
});

initTheme();

function buildTelegramText() {
  const companyName = document.getElementById("companyName").value.trim();
  const address = document.getElementById("address").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const usdot = document.getElementById("usdot").value.trim();

  const mode = getSelectedMode();
  const shippingType = getSelectedShipping();
  const shippingPrice = getShippingPrice();

  const items = mode === "device-cable" ? collectItems("bundle") : collectItems("cable");
  const productTotal = getProductTotal();
  const grandTotal = productTotal + shippingPrice;

  if (!items.length) {
    alert(
      mode === "device-cable"
        ? "Please add at least one Device + Cable quantity."
        : "Please add at least one Cable quantity."
    );
    return null;
  }

  const totalUnits = getItemsTotalQuantity(items);
  const title = mode === "device-cable" ? "Device + Cable" : "Cables";

  return `Company: ${companyName}

Address for ship : ${address}

phone number : ${phone}

Full Name: ${fullName}

USDOT: ${usdot}

Order Type: ${mode === "device-cable" ? " Device + Cable" : "Cable only"}

${buildItemsBlock(title, items)}

Total quantity: ${totalUnits}

Product Total: ${formatMoney(productTotal)}
Shipping (${shippingType}): ${formatMoney(shippingPrice)}
Grand Total: ${formatMoney(grandTotal)}`;
}

function generateTelegramText() {
  const text = buildTelegramText();

  if (!text) {
    return null;
  }

  output.textContent = text;
  return text;
}

async function submitOrderToServer(text) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const rawText = await response.text();

  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    if (typeof data === "string") {
      throw new Error(data);
    }

    if (data && data.description) {
      throw new Error(data.description);
    }

    if (data && data.error_code && data.description) {
      throw new Error(`${data.error_code}: ${data.description}`);
    }

    throw new Error("Failed to send order to server.");
  }

  return data;
}

renderProductCards();
syncModeUI();
updateTotals();

document.querySelectorAll('input[name="orderMode"]').forEach((input) => {
  input.addEventListener("change", syncModeUI);
});

document.querySelectorAll('input[name="shippingType"]').forEach((input) => {
  input.addEventListener("change", updateTotals);
});

form.addEventListener("input", updateTotals);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const text = generateTelegramText();

  if (!text) {
    return;
  }

  try {
    const result = await submitOrderToServer(text);
    console.log("Telegram result:", result);
    alert("Order sent successfully to Telegram.");
  } catch (error) {
    console.error("Telegram error:", error);
    alert(`Telegram sending failed: ${error.message}`);
  }
});

copyBtn.addEventListener("click", async () => {
  if (!form.reportValidity()) {
    return;
  }

  const text = generateTelegramText();

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";

    setTimeout(() => {
      copyBtn.textContent = "Copy Text";
    }, 1500);
  } catch (error) {
    alert("Could not copy text. Please copy it manually.");
  }
});