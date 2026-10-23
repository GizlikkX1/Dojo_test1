/* =========================================================
   Додзё Медиа — поведение страницы
   1. Мобильное меню
   2. Модальное окно «Обсудить проект»
   3. Валидация демонстрационной формы
   ========================================================= */

/* ---------- 1. Мобильное меню ---------- */
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const desktopQuery = window.matchMedia("(min-width: 768px)");

function setMenu(open) {
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  mobileMenu.hidden = !open;
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenu(!isOpen);
});

// Клик по пункту меню закрывает меню
mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) setMenu(false);
});

// Esc закрывает меню и возвращает фокус на кнопку
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileMenu.hidden) {
    setMenu(false);
    menuToggle.focus();
  }
});

// При переходе на десктопную ширину меню сбрасывается
desktopQuery.addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

/* ---------- 2. Модальное окно ---------- */
const dialog = document.getElementById("project-dialog");
const form = document.getElementById("project-form");
const formView = dialog.querySelector(".dialog__form-view");
const success = document.getElementById("form-success");
const successText = document.getElementById("success-text");

function openDialog() {
  resetForm();
  dialog.showModal();
  form.elements.name.focus();
}

document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  button.addEventListener("click", openDialog);
});

dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => dialog.close());
});

// Клик по затемнению вокруг окна закрывает его
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

/* ---------- 3. Валидация формы ---------- */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const rules = {
  name(value) {
    if (!value) return "Введите имя";
    if (value.length < 2) return "Имя должно быть не короче 2 символов";
    return "";
  },
  email(value) {
    if (!value) return "Введите email";
    if (!EMAIL_PATTERN.test(value)) return "Проверьте email: нужен формат name@company.ru";
    return "";
  },
};

function validateField(input) {
  const message = rules[input.name](input.value.trim());
  const error = document.getElementById(`${input.name}-error`);
  error.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  return !message;
}

// Ошибки показываются после первой попытки отправки,
// дальше поле перепроверяется при вводе
let submitted = false;

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener("input", () => {
    if (submitted) validateField(input);
  });
  input.addEventListener("blur", () => {
    if (submitted || input.value.trim()) validateField(input);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;

  const fields = Object.keys(rules).map((name) => form.elements[name]);
  const invalid = fields.filter((input) => !validateField(input));

  if (invalid.length) {
    invalid[0].focus();
    return;
  }

  // Имитация отправки: CRM и сервер по заданию не подключаются
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Отправляем…";

  setTimeout(() => {
    successText.textContent = `Ответим на ${form.elements.email.value.trim()} в течение рабочего дня.`;
    formView.hidden = true;
    success.hidden = false;
    success.focus();
  }, 600);
});

function resetForm() {
  submitted = false;
  form.reset();
  form.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = false;
  submitButton.textContent = "Отправить заявку";
  formView.hidden = false;
  success.hidden = true;
}
