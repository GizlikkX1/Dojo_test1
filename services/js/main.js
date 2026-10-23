/* =========================================================
   Стоматология — поведение страницы
   1. Лента услуг: перетаскивание мышью
   2. Кнопки «Консультация» ведут к форме
   3. Фигурный фон формы (clip-path по размеру блока)
   4. Маска телефона и валидация формы
   ========================================================= */

/* ---------- 1. Перетаскивание ленты мышью ----------
   Тач и тачпад листают ленту нативно, это нужно для обычной мыши */
const slider = document.querySelector("[data-slider]");
let drag = null;

slider.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  drag = { x: event.clientX, scroll: slider.scrollLeft, moved: false };
});

window.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const dx = event.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) > 5) {
    drag.moved = true;
    slider.classList.add("is-dragging");
  }
  if (drag.moved) slider.scrollLeft = drag.scroll - dx;
});

window.addEventListener("pointerup", () => {
  if (!drag) return;
  const wasMoved = drag.moved;
  drag = null;
  slider.classList.remove("is-dragging");
  // после перетаскивания не срабатывает клик по кнопке под курсором
  if (wasMoved) {
    slider.addEventListener("click", (e) => e.preventDefault(), { capture: true, once: true });
  }
});

/* ---------- 2. «Консультация» → форма ---------- */
const form = document.getElementById("booking-form");
const booking = document.getElementById("booking");

document.querySelectorAll("[data-service]").forEach((button) => {
  button.addEventListener("click", () => {
    form.elements.service.value = button.dataset.service;
    booking.scrollIntoView({ block: "start" });
    // фокус после прокрутки, без повторного скачка
    form.elements.fio.focus({ preventScroll: true });
  });
});

/* ---------- 3. Фигурный фон формы ----------
   Контур повторяет макет: срезы под 45° со скруглёнными углами.
   Путь пересчитывается при изменении размера, поэтому
   диагонали не растягиваются на любой ширине. */
const panel = document.querySelector("[data-panel]");
const desktopQuery = window.matchMedia("(min-width: 1200px)");

// Скруглённый угол между двумя отрезками: точка угла p, соседи a и b, радиус r
function corner(a, p, b, r) {
  const toA = unit(a, p);
  const toB = unit(b, p);
  const start = [p[0] + toA[0] * r, p[1] + toA[1] * r];
  const end = [p[0] + toB[0] * r, p[1] + toB[1] * r];
  return `L${fmt(start)} Q${fmt(p)} ${fmt(end)} `;
}
function unit(to, from) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}
const fmt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

function roundedPolygon(points, radii) {
  let d = "";
  const n = points.length;
  points.forEach((p, i) => {
    const a = points[(i - 1 + n) % n];
    const b = points[(i + 1) % n];
    const segment = corner(a, p, b, radii[i]);
    d += i === 0 ? segment.replace(/^L/, "M") : segment;
  });
  return d + "Z";
}

// Десктоп 1200×324: срез сверху справа и ступенчатый край слева
function desktopShape(w, h) {
  const points = [
    [0, 0],
    [w - 68.5, 0],
    [w, 68.5],
    [w, h],
    [105.8, h],
    [38.3, h - 67.5],
    [38.3, 162],
    [0, 123.7],
  ];
  return roundedPolygon(points, [28, 16, 16, 28, 18, 16, 16, 16]);
}

// Мобильная версия 350×794: срез сверху слева, срез и ступенька снизу справа
function mobileShape(w, h) {
  const points = [
    [69.1, 0],
    [w, 0],
    [w, h - 106.8],
    [w - 67.8, h - 39],
    [162.8, h - 39],
    [123.8, h],
    [0, h],
    [0, 69.1],
  ];
  return roundedPolygon(points, [14, 20, 14, 12, 12, 12, 20, 14]);
}

function updateShape() {
  const { width, height } = panel.getBoundingClientRect();
  const d = desktopQuery.matches ? desktopShape(width, height) : mobileShape(width, height);
  panel.style.setProperty("--panel-shape", `path("${d}")`);
}

new ResizeObserver(updateShape).observe(panel);

/* ---------- 4. Маска телефона ---------- */
const phone = form.elements.phone;

// 8 916… и 916… приводятся к +7 916…
function phoneDigits(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits && !digits.startsWith("7")) digits = "7" + digits;
  return digits.slice(0, 11);
}

function formatPhone(digits) {
  if (!digits) return "";
  const d = digits.slice(1);
  let out = "+7";
  if (d.length) out += " (" + d.slice(0, 3);
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}

phone.addEventListener("input", (event) => {
  // при удалении символа маску не навязываем, чтобы курсор не прыгал
  if (event.inputType && event.inputType.startsWith("delete")) return;
  phone.value = formatPhone(phoneDigits(phone.value));
});

phone.addEventListener("blur", () => {
  const digits = phoneDigits(phone.value);
  phone.value = digits.length > 1 ? formatPhone(digits) : "";
});

/* ---------- Валидация ---------- */
const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё\s'-]+$/;

const rules = {
  fio(input) {
    const value = input.value.trim().replace(/\s+/g, " ");
    if (!value) return "Введите ФИО";
    if (!NAME_PATTERN.test(value)) return "Только буквы, пробел и дефис";
    if (value.replace(/[\s'-]/g, "").length < 2) return "Слишком короткое имя";
    return "";
  },
  phone(input) {
    const digits = phoneDigits(input.value);
    if (digits.length <= 1) return "Введите номер телефона";
    if (digits.length < 11) return "Номер неполный: нужно 10 цифр после +7";
    return "";
  },
  consent(input) {
    return input.checked ? "" : "Нужно согласие на обработку данных";
  },
};

function validate(input) {
  const message = rules[input.name](input);
  document.getElementById(`${input.name}-error`).textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  return !message;
}

let submitted = false;

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  const event = input.type === "checkbox" ? "change" : "input";
  input.addEventListener(event, () => {
    if (submitted) validate(input);
  });
});

const formView = document.querySelector(".panel__form-view");
const success = document.getElementById("booking-success");
const successText = document.getElementById("success-text");
const submitButton = form.querySelector(".form__submit");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;

  const inputs = Object.keys(rules).map((name) => form.elements[name]);
  const invalid = inputs.filter((input) => !validate(input));
  if (invalid.length) {
    invalid[0].focus();
    return;
  }

  // Демонстрация: данные никуда не отправляются (CRM по заданию не нужна)
  submitButton.disabled = true;
  submitButton.textContent = "Отправляем…";

  setTimeout(() => {
    const service = form.elements.service.value;
    const name = form.elements.fio.value.trim().split(/\s+/)[1] || form.elements.fio.value.trim().split(/\s+/)[0];
    successText.textContent =
      `${name}, администратор позвонит на номер ${phone.value} и подберёт удобное время` +
      (service ? ` консультации по услуге «${service}».` : " консультации.");
    formView.hidden = true;
    success.hidden = false;
    success.focus();
    updateShape();
  }, 700);
});

document.querySelector("[data-reset]").addEventListener("click", () => {
  submitted = false;
  form.reset();
  form.elements.service.value = "";
  form.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  submitButton.disabled = false;
  submitButton.textContent = "Записаться на прием";
  success.hidden = true;
  formView.hidden = false;
  form.elements.fio.focus();
});
