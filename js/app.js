// Toggle menu mobile
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");

toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  menu?.classList.toggle("is-open");
  document.body.classList.toggle("nav-open");
});

// Scroll fluide avec offset header
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href") || "");
    if (!target) return;
    e.preventDefault();
    const header = document.querySelector(".site-header");
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      (header?.offsetHeight ?? 0);
    window.scrollTo({ top, behavior: "smooth" });
    // Ferme le menu si ouvert
    if (menu?.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }
  });
});

