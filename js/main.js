"use strict";

const CONFIG = Object.freeze({
  WHATSAPP_NUMBER: "573178765432",
  MAX_QUERY_LENGTH: 60,
  MAX_CHAT_LENGTH: 500,
  MODEL_MAX_LENGTH: 80,
  CUSTOM_BRAND_MAX_LENGTH: 40,
  HERO_AUTOPLAY_MS: 4000,
  CHAT_SESSION_TIMEOUT_MS: 30 * 60 * 1000,
  CHAT_HISTORY_LIMIT: 80,
  maxReintentos: 3,
  STORAGE_KEY: "dcs_chatbot_state_v1"
});

const MAX_QUERY_LENGTH = CONFIG.MAX_QUERY_LENGTH;
const MAX_CHAT_LENGTH = CONFIG.MAX_CHAT_LENGTH;
const HERO_AUTOPLAY_MS = CONFIG.HERO_AUTOPLAY_MS;

let isRestoringChat = false;
let restoredSessionExpired = false;
let isChatProcessing = false;
let clearFeedbackTimer = null;

const Utils = {
  sanitizeText(value, maxLength = 160) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[<>`{}[\]\\]/g, "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  },
  clampNumber(value, min, max) {
    const number = Number.isFinite(value) ? value : min;
    return Math.max(min, Math.min(max, number));
  },
  safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return fallback;
    }
  },
  normalizarTexto(value) {
    return this.sanitizeText(value, CONFIG.MAX_CHAT_LENGTH)
      .toLocaleLowerCase("es-CO")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },
  mejorCoincidencia(value, options = []) {
    const source = this.normalizarTexto(value);
    if (!source || !options.length) return { opcion: null, esValida: false };
    let best = { opcion: null, score: Infinity };
    options.forEach((option) => {
      const target = this.normalizarTexto(option);
      const score = this.textDistance(source, target);
      if (score < best.score) best = { opcion: option, score };
    });
    const longest = Math.max(source.length, this.normalizarTexto(best.opcion || "").length, 1);
    return {
      opcion: best.opcion,
      esValida: best.score <= 2 || best.score / longest <= 0.28
    };
  },
  textDistance(a, b) {
    const left = this.normalizarTexto(a);
    const right = this.normalizarTexto(b);
    const matrix = Array.from({ length: left.length + 1 }, (_, index) => [index]);
    for (let index = 1; index <= right.length; index += 1) matrix[0][index] = index;
    for (let row = 1; row <= left.length; row += 1) {
      for (let col = 1; col <= right.length; col += 1) {
        const cost = left[row - 1] === right[col - 1] ? 0 : 1;
        matrix[row][col] = Math.min(
          matrix[row - 1][col] + 1,
          matrix[row][col - 1] + 1,
          matrix[row - 1][col - 1] + cost
        );
      }
    }
    return matrix[left.length][right.length];
  },
  storageAvailable() {
    try {
      const key = "__dcs_storage_test__";
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch (_error) {
      return false;
    }
  }
};

const heroSlides = [
  {
    category: "Celulares premium",
    title: "Tecnología móvil de alto nivel",
    subtitle: "Celulares modernos, potentes y listos para trabajo, estudio y entretenimiento.",
    image: "assets/img/hero-celulares-real.jpg",
    fallbackImage: "assets/img/hero-celulares-real.jpg",
    alt: "Celulares premium disponibles en DCS Technology"
  },
  {
    category: "Diagnóstico técnico",
    title: "Revisión técnica inteligente",
    subtitle: "Detectamos posibles fallas en pantalla, batería, carga, software y rendimiento.",
    image: "assets/img/hero-revision-tecnica.jpg",
    fallbackImage: "assets/img/hero-revision-tecnica.jpg",
    alt: "Revisión técnica inteligente de un celular en laboratorio especializado"
  },
  {
    category: "Computadores",
    title: "Equipos para productividad y gaming",
    subtitle: "Portátiles y computadores para estudio, oficina, diseño y alto rendimiento.",
    image: "assets/img/hero-computadores-real.jpg",
    fallbackImage: "assets/img/hero-computadores-real.jpg",
    alt: "Computadores y portátiles para productividad y gaming"
  },
  {
    category: "Accesorios",
    title: "Accesorios que completan tu experiencia",
    subtitle: "Audífonos, cargadores, fundas, cables, soportes y dispositivos inteligentes.",
    image: "assets/img/hero-accesorios-real.jpg",
    fallbackImage: "assets/img/hero-accesorios-real.jpg",
    alt: "Accesorios tecnológicos para celulares y computadores"
  },
  {
    category: "Smartwatch",
    title: "Tecnología conectada a tu ritmo",
    subtitle: "Relojes inteligentes para salud, notificaciones, deporte y productividad.",
    image: "assets/img/hero-smartwatch-real.jpg",
    fallbackImage: "assets/img/hero-smartwatch-real.jpg",
    alt: "Smartwatch y tecnología conectada"
  },
  {
    category: "Financiación",
    title: "Compra tecnología con facilidad",
    subtitle: "Opciones de financiación para estrenar equipos sin complicaciones.",
    image: "assets/img/hero-financiacion-real.jpg",
    fallbackImage: "assets/img/hero-financiacion-real.jpg",
    alt: "Financiación tecnológica para productos DCS Technology"
  }
];

const products = [
  {
    name: "iPhone 15 Pro",
    category: "Celulares",
    price: "Cotización personalizada",
    image: "assets/img/product-smartphone-generated.jpg",
    fallbackImage: "assets/img/product-phone.svg",
    description: "Equipo premium para fotografía, video y alto rendimiento diario."
  },
  {
    name: "Samsung Galaxy S24 FE",
    category: "Celulares",
    price: "Consultar disponibilidad",
    image: "assets/img/product-smartphone-generated.jpg",
    fallbackImage: "assets/img/product-samsung.svg",
    description: "Gama alta equilibrada para productividad, fotografía y entretenimiento."
  },
  {
    name: "Xiaomi Redmi Note 13",
    category: "Celulares",
    price: "Precio sujeto a referencia",
    image: "assets/img/product-smartphone-generated.jpg",
    fallbackImage: "assets/img/product-xiaomi.svg",
    description: "Buena autonomía y pantalla amplia para presupuesto controlado."
  },
  {
    name: "Galaxy Tab S9",
    category: "Tablets",
    price: "Cotización personalizada",
    image: "assets/img/product-tablet-generated.jpg",
    fallbackImage: "assets/img/product-tablet.svg",
    description: "Tablet para estudio, contenido, dibujo y productividad móvil."
  },
  {
    name: "MacBook Air M2",
    category: "Computadores",
    price: "Consultar disponibilidad",
    image: "assets/img/product-laptop-generated.jpg",
    fallbackImage: "assets/img/product-laptop.svg",
    description: "Portátil liviano para trabajo profesional, estudio y creación."
  },
  {
    name: "Kit cargador rápido USB-C",
    category: "Accesorios",
    price: "Precio sujeto a referencia",
    image: "assets/img/product-accessory-generated.jpg",
    fallbackImage: "assets/img/product-accessory.svg",
    description: "Cargador y cable de carga rápida para equipos compatibles."
  }
];

const chatState = {
  intent: null,
  deviceType: null,
  brand: null,
  model: null,
  issue: null,
  budgetRange: null,
  usage: null,
  preference: null,
  leadName: null,
  leadCity: null,
  leadProductOrIssue: null,
  leadContact: null,
  flow: null,
  step: null,
  steps: [],
  currentStepIndex: 0,
  answers: {},
  answerHistory: [],
  invalidRetries: 0,
  lastInteractionAt: 0,
  chatHistory: [],
  memoria: createDiagnosticMemory()
};

const estadoGlobal = chatState;

const quickActions = [
  "Diagnóstico técnico",
  "Quiero comprar",
  "Cotizar producto",
  "Financiación",
  "Comparar equipos",
  "Accesorios",
  "Computador ideal",
  "Hablar por WhatsApp"
];

const KNOWN_DIAGNOSTIC_BRANDS = [
  "xiaomi",
  "samsung",
  "iphone",
  "apple",
  "motorola",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "realme",
  "tecno",
  "infinix",
  "lg",
  "lenovo",
  "hp",
  "dell",
  "asus",
  "acer"
];

const DIAGNOSTIC_KNOWLEDGE_BASE = {
  no_enciende: {
    title: "No enciende",
    aliases: ["no enciende", "no prende", "apagado", "se apago", "murio", "no da senal"],
    questions: [
      { field: "evento", title: "Evento", question: "Se apagó de repente o después de una caída, golpe o contacto con agua?", options: ["Se apagó de repente", "Después de una caída o golpe", "Después de contacto con agua o humedad", "Después de actualizar o instalar algo", "No sé"] },
      { field: "sintomas", title: "Señales", question: "Vibra, muestra logo, prende LED o no hace absolutamente nada?", options: ["No hace absolutamente nada", "Vibra pero no muestra imagen", "Se queda en el logo", "Prende LED o indicador", "No sé"] },
      { field: "cargador", title: "Prueba de carga", question: "Probaste otro cargador y otro cable que funcionen bien?", options: ["Sí, probé otro cargador y cable", "Probé solo otro cable", "Probé solo otro cargador", "No he probado otro cargador", "No sé"] },
      { field: "tiempo", title: "Tiempo de falla", question: "Hace cuánto ocurrió la falla?" }
    ]
  },
  pantalla: {
    title: "Pantalla rota / dañada",
    aliases: ["pantalla", "display", "touch", "tactil", "vidrio", "linea verde", "lineas", "manchas", "negra"],
    questions: [
      { field: "tipoDano", title: "Tipo de daño", question: "El vidrio está roto o el display no da imagen?", options: ["Solo vidrio roto", "Display no da imagen", "Vidrio roto y display dañado", "No sé"] },
      { field: "tactil", title: "Táctil", question: "El táctil responde correctamente?", options: ["Sí responde normal", "Responde parcialmente", "No responde", "No sé"] },
      { field: "sintomas", title: "Imagen", question: "Tiene manchas negras, líneas verdes, parpadeo o pantalla totalmente negra?", options: ["Manchas negras", "Líneas verdes", "Parpadeo", "Pantalla totalmente negra", "No sé"] },
      { field: "evento", title: "Origen", question: "Fue después de un golpe, caída o humedad?", options: ["Después de golpe o caída", "Después de humedad o agua", "Empezó de repente", "No sé"] },
      { field: "tiempo", title: "Tiempo de falla", question: "Hace cuánto empezó el problema?" }
    ]
  },
  no_carga: {
    title: "No carga",
    aliases: ["no carga", "carga lento", "carga intermitente", "puerto", "pin de carga", "cargador"],
    questions: [
      { field: "cargador", title: "Prueba de carga", question: "Probaste otro cargador y otro cable?", options: ["Sí, probé otro cargador y cable", "Probé solo otro cable", "Probé solo otro cargador", "No he probado otro cargador", "No sé"] },
      { field: "puerto", title: "Puerto", question: "El puerto se siente flojo, sucio o dañado?", options: ["Puerto flojo", "Puerto sucio", "Puerto dañado", "Puerto normal", "No sé"] },
      { field: "sintomas", title: "Carga", question: "La carga es intermitente o nunca aparece?", options: ["Carga intermitente", "Nunca aparece carga", "Carga lento", "Carga solo en cierta posición", "No sé"] },
      { field: "temperatura", title: "Temperatura", question: "El equipo calienta al cargar?", options: ["Sí calienta mucho", "Calienta normal", "No calienta", "No sé"] },
      { field: "iconoCarga", title: "Ícono de carga", question: "Aparece el ícono de carga cuando lo conectas?", options: ["Sí aparece el ícono", "No aparece el ícono", "Aparece y desaparece", "No sé"] },
      { field: "tiempo", title: "Tiempo de falla", question: "Hace cuánto empezó la falla?" }
    ]
  },
  bateria: {
    title: "Batería dura poco",
    aliases: ["bateria", "descarga", "dura poco", "se apaga", "porcentaje", "inflada"],
    questions: [
      { field: "duracion", title: "Duración", question: "Cuánto dura aproximadamente la batería con uso normal?" },
      { field: "reposo", title: "Reposo", question: "Se descarga estando en reposo?", options: ["Sí, se descarga en reposo", "No se descarga en reposo", "No sé"] },
      { field: "porcentaje", title: "Porcentaje", question: "Se apaga con porcentaje alto?", options: ["Sí, se apaga con porcentaje alto", "No, llega a 0% normal", "Se reinicia", "No sé"] },
      { field: "bateriaInflada", title: "Estado físico", question: "La batería está inflada o la tapa/pantalla se levantó?", options: ["Batería inflada", "Tapa o pantalla levantada", "No está inflada", "No sé"] },
      { field: "temperatura", title: "Temperatura", question: "El equipo se calienta más de lo normal?", options: ["Sí calienta mucho", "Calienta normal", "No calienta", "No sé"] },
      { field: "tiempo", title: "Tiempo de falla", question: "Hace cuánto notas el problema?" }
    ]
  },
  computador_lento: {
    title: "Computador lento",
    aliases: ["computador lento", "pc lento", "laptop lenta", "portatil lento", "lento", "se traba"],
    questions: [
      { field: "sistemaOperativo", title: "Sistema operativo", question: "Qué sistema operativo usa: Windows, macOS, Linux u otro?", options: ["Windows", "macOS", "Linux", "Otro", "No sé"] },
      { field: "almacenamiento", title: "Disco", question: "Tiene SSD o HDD?", options: ["SSD", "HDD", "SSD y HDD", "No sé"] },
      { field: "ram", title: "Memoria RAM", question: "Cuánta memoria RAM tiene aproximadamente?" },
      { field: "momentoLentitud", title: "Momento", question: "Se pone lento al iniciar, al abrir programas o todo el tiempo?", options: ["Lento al iniciar", "Lento al abrir programas", "Lento todo el tiempo", "No sé"] },
      { field: "softwareSospechoso", title: "Software", question: "Tiene virus, ventanas emergentes o programas desconocidos?", options: ["Ventanas emergentes", "Programas desconocidos", "Sospecha de virus", "No veo nada extraño", "No sé"] },
      { field: "ruidos", title: "Ruido", question: "Hace ruidos extraños o se calienta mucho?", options: ["Hace ruidos extraños", "Se calienta mucho", "Ruidos y calentamiento", "No presenta ruidos", "No sé"] },
      { field: "tiempo", title: "Tiempo de falla", question: "Hace cuánto empezó la lentitud?" }
    ]
  },
  software: {
    title: "Software / virus",
    aliases: ["virus", "software", "apps", "aplicaciones", "ventanas emergentes", "publicidad"],
    questions: [
      { field: "sintomas", title: "Síntomas", question: "Qué notas: lentitud, publicidad, reinicios, bloqueo o apps desconocidas?", options: ["Lentitud", "Publicidad o ventanas emergentes", "Reinicios", "Apps desconocidas", "No sé"] },
      { field: "evento", title: "Origen", question: "Instalaste alguna app, actualización o archivo antes de la falla?", options: ["Instalé una app", "Hice una actualización", "Abrí o descargué un archivo", "Empezó de repente", "No sé"] },
      { field: "tiempo", title: "Tiempo de falla", question: "Hace cuánto ocurre?" }
    ]
  },
  general: {
    title: "Falla general",
    aliases: [],
    questions: [
      { field: "evento", title: "Origen", question: "La falla empezó después de caída, golpe, humedad, actualización o de repente?", options: ["Después de caída o golpe", "Después de humedad o agua", "Después de actualización", "Empezó de repente", "No sé"] },
      { field: "sintomas", title: "Síntomas", question: "Qué señales exactas ves o escuchas en el equipo?" },
      { field: "tiempo", title: "Tiempo de falla", question: "Hace cuánto empezó?" }
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupTemporaryImageFallbacks();
  setupCinematicSurface();
  setupHeroCarousel();
  setupMobileMenu();
  setupSmoothLinks();
  setupProducts();
  setupChatbot();
  setupPremiumCardTilt();
  setupAnimationsSafely();
});

function sanitizeText(value, maxLength = 160) {
  return Utils.sanitizeText(value, maxLength);
}

function normalizeForSearch(value) {
  return sanitizeText(value, MAX_QUERY_LENGTH)
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function whatsappUrl(message) {
  return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(sanitizeText(message, 1800))}`;
}

function setupTemporaryImageFallbacks() {
  document.querySelectorAll("img[data-fallback]").forEach((image) => {
    const fallback = image.getAttribute("data-fallback");
    if (!fallback) return;
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      if (image.src.includes(fallback)) return;
      image.src = fallback;
    }, { once: true });
  });
}

function setupHeroCarousel() {
  const title = document.getElementById("heroTitle");
  const subtitle = document.getElementById("heroSubtitle");
  const category = document.getElementById("heroCategory");
  const currentBg = document.getElementById("heroBgCurrent");
  const nextBg = document.getElementById("heroBgNext");
  const track = document.getElementById("heroCardTrack");
  const prev = document.getElementById("heroPrev");
  const next = document.getElementById("heroNext");
  const progress = document.getElementById("heroProgressBar");
  const hero = document.querySelector(".hero-cinematic");
  if (!title || !subtitle || !category || !currentBg || !nextBg || !track || !prev || !next || !progress || !hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  configureHeroImage(currentBg, heroSlides[0]);
  configureHeroImage(nextBg, heroSlides[0]);
  const cards = heroSlides.map((slide) => {
    const card = createHeroCard(slide);
    track.appendChild(card);
    return card;
  });

  let activeIndex = 0;
  let timerId = null;
  let isPaused = false;
  let isHeroVisible = true;

  const setActiveSlide = (index, options = {}) => {
    const nextIndex = (index + heroSlides.length) % heroSlides.length;
    activeIndex = nextIndex;
    const slide = heroSlides[nextIndex];

    category.textContent = slide.category;
    title.textContent = slide.title;
    subtitle.textContent = slide.subtitle;
    if (!options.skipTextAnimation) {
      animateHeroText(title.closest(".hero-content"));
    }
    transitionHeroBackground(currentBg, nextBg, slide, reduceMotion);

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === nextIndex;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-pressed", String(isActive));
    });

    restartProgress(progress, reduceMotion);
  };

  const stopAutoplay = () => {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    progress.style.transition = "none";
  };

  const startAutoplay = () => {
    if (reduceMotion || timerId || isPaused || !isHeroVisible || document.hidden) return;
    restartProgress(progress, false);
    timerId = window.setInterval(() => {
      setActiveSlide(activeIndex + 1);
    }, HERO_AUTOPLAY_MS);
  };

  prev.addEventListener("click", () => {
    setActiveSlide(activeIndex - 1);
    stopAutoplay();
    startAutoplay();
  });

  next.addEventListener("click", () => {
    setActiveSlide(activeIndex + 1);
    stopAutoplay();
    startAutoplay();
  });

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      setActiveSlide(index);
      stopAutoplay();
      startAutoplay();
    });
  });

  track.addEventListener("mouseenter", () => {
    isPaused = true;
    stopAutoplay();
  });
  track.addEventListener("mouseleave", () => {
    isPaused = false;
    startAutoplay();
  });
  track.addEventListener("focusin", () => {
    isPaused = true;
    stopAutoplay();
  });
  track.addEventListener("focusout", () => {
    isPaused = false;
    startAutoplay();
  });
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveSlide(activeIndex + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveSlide(activeIndex - 1);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
      return;
    }
    startAutoplay();
  });

  if ("IntersectionObserver" in window) {
    const heroAutoplayObserver = new IntersectionObserver((entries) => {
      isHeroVisible = entries.some((entry) => entry.isIntersecting);
      if (isHeroVisible) {
        startAutoplay();
        return;
      }
      stopAutoplay();
    }, { threshold: 0.2 });
    heroAutoplayObserver.observe(hero);
  }

  hero.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    hero.style.setProperty("--depth-x", `${x * 18}px`);
    hero.style.setProperty("--depth-y", `${y * 12}px`);
  });

  setActiveSlide(0, { skipTextAnimation: true });
  startAutoplay();
}

function createHeroCard(slide) {
  const card = document.createElement("button");
  card.className = "hero-card";
  card.type = "button";
  card.setAttribute("aria-label", `Ver ${slide.category}`);
  card.setAttribute("aria-pressed", "false");

  const image = document.createElement("img");
  configureHeroImage(image, slide);
  image.alt = slide.alt;
  image.loading = "lazy";
  image.width = 440;
  image.height = 560;
  image.referrerPolicy = "no-referrer";

  const content = document.createElement("span");
  content.className = "hero-card-content";

  const tag = document.createElement("span");
  tag.className = "hero-card-tag";
  tag.textContent = slide.category;

  const title = document.createElement("strong");
  title.textContent = slide.title;

  const subtitle = document.createElement("span");
  subtitle.textContent = slide.subtitle;

  content.append(tag, title, subtitle);
  card.append(image, content);
  return card;
}

function animateHeroText(content) {
  if (!content) return;
  content.classList.remove("is-changing");
  window.requestAnimationFrame(() => {
    content.classList.add("is-changing");
  });
}

function transitionHeroBackground(currentBg, nextBg, slide, reduceMotion) {
  if (reduceMotion) {
    configureHeroImage(currentBg, slide);
    return;
  }
  configureHeroImage(nextBg, slide);
  nextBg.classList.add("is-visible");
  nextBg.classList.remove("is-next");
  window.setTimeout(() => {
    configureHeroImage(currentBg, slide);
    nextBg.classList.add("is-next");
    nextBg.classList.remove("is-visible");
  }, 720);
}

function configureHeroImage(image, slide) {
  image.referrerPolicy = "no-referrer";
  image.onerror = () => {
    if (image.src.includes(slide.fallbackImage)) return;
    image.src = slide.fallbackImage;
  };
  image.src = slide.image;
}

function restartProgress(progress, reduceMotion) {
  progress.style.transition = "none";
  progress.style.transform = reduceMotion ? "scaleX(1)" : "scaleX(0)";
  if (reduceMotion) return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      progress.style.transition = `transform ${HERO_AUTOPLAY_MS}ms linear`;
      progress.style.transform = "scaleX(1)";
    });
  });
}

function setupMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mainMenu");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });
}

function setupSmoothLinks() {
  document.querySelectorAll('.nav-menu a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupProducts() {
  const grid = document.getElementById("productGrid");
  const search = document.getElementById("productSearch");
  const emptyState = document.getElementById("emptyProducts");
  if (!grid || !search || !emptyState) return;

  const render = (items) => {
    grid.replaceChildren();
    items.forEach((product, index) => {
      const card = createProductCard(product);
      card.style.setProperty("--stagger-index", String(index));
      grid.appendChild(card);
      if (window.attachPremiumCardTilt) window.attachPremiumCardTilt(card);
      if (window.cinematicObserver) revealAnimatedElement(card);
    });
    emptyState.hidden = true;
    emptyState.textContent = "";
  };

  search.addEventListener("input", () => {
    const term = normalizeForSearch(search.value);
    search.value = sanitizeText(search.value, MAX_QUERY_LENGTH);
    const filtered = products.filter((product) => {
      const haystack = normalizeForSearch(`${product.name} ${product.category}`);
      return haystack.includes(term);
    });
    render(filtered);
    if (term && filtered.length === 0) {
      emptyState.textContent = "No encontramos productos con ese criterio. Intenta con otra categoría.";
      emptyState.hidden = false;
    }
  });

  render(products);
}

function setupCinematicSurface() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("cinematic-ready");
  const header = document.querySelector(".site-header");
  const phoneStage = document.querySelector(".phone-stage");
  const floatingPhone = document.querySelector(".floating-phone");
  const mobileSurfaceQuery = window.matchMedia("(max-width: 760px)");
  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  if (reduceMotion) {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    return;
  }

  if (mobileSurfaceQuery.matches || coarsePointerQuery.matches) {
    if (header) {
      const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
      updateHeader();
      window.addEventListener("scroll", updateHeader, { passive: true });
    }
    return;
  }

  let frameId = null;
  let scrollY = window.scrollY;
  let phoneRotationY = 15;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--spotlight-x", `${window.innerWidth / 2}px`);
  rootStyle.setProperty("--spotlight-y", `${window.innerHeight / 2}px`);
  const tabletSurfaceQuery = window.matchMedia("(max-width: 1024px)");
  const rotationStops = [
    { id: "inicio", angle: 15 },
    { id: "categorias", angle: 35 },
    { id: "promociones", angle: 55 },
    { id: "productos", angle: 80 },
    { id: "financiacion", angle: 110 },
    { id: "diagnostico", angle: 145 },
    { id: "contacto", angle: 180 },
  ];

  let cachedStops = [];
  let maxScroll = 1;

  const refreshScrollMetrics = () => {
    cachedStops = rotationStops
      .map((stop) => {
        const element = document.getElementById(stop.id);
        return element ? { angle: stop.angle, top: element.offsetTop } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.top - b.top);
    const doc = document.documentElement;
    maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
  };

  const getRotationTarget = (currentScroll) => {
    const stops = cachedStops;

    if (!stops.length || currentScroll <= stops[0].top) return 15;

    for (let index = 0; index < stops.length - 1; index += 1) {
      const current = stops[index];
      const next = stops[index + 1];
      if (currentScroll <= next.top) {
        const distance = Math.max(next.top - current.top, 1);
        const localProgress = Math.min(Math.max((currentScroll - current.top) / distance, 0), 1);
        return current.angle + ((next.angle - current.angle) * localProgress);
      }
    }

    return stops[stops.length - 1].angle;
  };

  const paint = () => {
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    const mobileSurface = mobileSurfaceQuery.matches;
    const tabletSurface = tabletSurfaceQuery.matches;
    const targetPhoneRotateY = scrollProgress > 0.985 ? 180 : getRotationTarget(scrollY);
    phoneRotationY += (targetPhoneRotateY - phoneRotationY) * 0.34;
    const phoneRotateX = mobileSurface ? 5 + (scrollProgress * 7) : 9 + (scrollProgress * 9);
    const phoneRotateZ = -7 + (scrollProgress * 12);
    const phoneShiftX = Math.sin(scrollProgress * Math.PI * 1.2) * (mobileSurface ? 12 : 34);
    const phoneShiftY = Math.cos(scrollProgress * Math.PI) * (mobileSurface ? 10 : 28);
    const phoneScale = mobileSurface
      ? 0.5 + (scrollProgress * 0.03)
      : tabletSurface
        ? 0.8 + (scrollProgress * 0.04)
        : 1.04 + (scrollProgress * 0.06);
    const phoneParallaxY = Math.min(scrollY * 0.055, mobileSurface ? 40 : 130) * -1;
    const phoneShadowY = 12 + (scrollProgress * 18);
    const phoneShadowScale = 0.84 + (scrollProgress * 0.24);
    const phoneShadowOpacity = 0.42 + (scrollProgress * 0.18);
    const phoneFlareOpacity = 0.2 + (scrollProgress * 0.16);
    const phoneReflectionX = 30 + (scrollProgress * 35);
    rootStyle.setProperty("--phone-rotate-y", `${phoneRotationY.toFixed(2)}deg`);
    rootStyle.setProperty("--phone-rotate-x", `${phoneRotateX.toFixed(2)}deg`);
    rootStyle.setProperty("--phone-rotate-z", `${phoneRotateZ.toFixed(2)}deg`);
    rootStyle.setProperty("--phone-shift-x", `${phoneShiftX.toFixed(2)}px`);
    rootStyle.setProperty("--phone-shift-y", `${phoneShiftY.toFixed(2)}px`);
    rootStyle.setProperty("--phone-parallax-y", `${phoneParallaxY.toFixed(2)}px`);
    rootStyle.setProperty("--phone-scale", phoneScale.toFixed(3));
    rootStyle.setProperty("--phone-shadow-y", `${phoneShadowY.toFixed(2)}px`);
    rootStyle.setProperty("--phone-shadow-scale", phoneShadowScale.toFixed(3));
    rootStyle.setProperty("--phone-shadow-opacity", phoneShadowOpacity.toFixed(3));
    rootStyle.setProperty("--phone-flare-opacity", phoneFlareOpacity.toFixed(3));
    rootStyle.setProperty("--phone-reflection-x", `${phoneReflectionX.toFixed(2)}%`);
    if (header) header.classList.toggle("is-scrolled", scrollY > 8);
    if (phoneStage) phoneStage.classList.add("is-scroll-active");
    if (floatingPhone) floatingPhone.classList.add("is-scroll-active");
    frameId = null;
    if (Math.abs(targetPhoneRotateY - phoneRotationY) > 0.04) {
      requestPaint();
    } else {
      window.setTimeout(() => {
        if (phoneStage) phoneStage.classList.remove("is-scroll-active");
        if (floatingPhone) floatingPhone.classList.remove("is-scroll-active");
      }, 160);
    }
  };

  const requestPaint = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(paint);
  };

  window.addEventListener("pointermove", (event) => {
    rootStyle.setProperty("--spotlight-x", `${event.clientX}px`);
    rootStyle.setProperty("--spotlight-y", `${event.clientY}px`);
  }, { passive: true });

  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", scrollY > 8);
    requestPaint();
  }, { passive: true });

  window.addEventListener("resize", () => {
    refreshScrollMetrics();
    scrollY = window.scrollY;
    requestPaint();
  }, { passive: true });
  window.addEventListener("load", () => {
    refreshScrollMetrics();
    requestPaint();
  }, { once: true });

  refreshScrollMetrics();
  paint();
}

function setupPremiumCardTilt() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;
  const lowPrecisionPointer = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 760px)").matches;
  if (lowPrecisionPointer) return;

  const selector = ".category-card, .promo-card, .product-card, .diagnosis-grid article, .financing-list article, .financing-copy, .search-panel, .hero-carousel";
  let frameId = null;
  let activeCard = null;
  let pointerEvent = null;

  const resetCard = (card) => {
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "0%");
  };

  const paintTilt = () => {
    if (!activeCard || !pointerEvent) {
      frameId = null;
      return;
    }
    const rect = activeCard.getBoundingClientRect();
    const x = (pointerEvent.clientX - rect.left) / rect.width;
    const y = (pointerEvent.clientY - rect.top) / rect.height;
    const tiltY = (x - 0.5) * 5;
    const tiltX = (0.5 - y) * 4;
    activeCard.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    activeCard.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    activeCard.style.setProperty("--glow-x", `${(x * 100).toFixed(1)}%`);
    activeCard.style.setProperty("--glow-y", `${(y * 100).toFixed(1)}%`);
    frameId = null;
  };

  const attachTilt = (card) => {
    if (!card || card.dataset.tiltReady === "true") return;
    card.dataset.tiltReady = "true";
    resetCard(card);
    card.addEventListener("pointermove", (event) => {
      activeCard = card;
      pointerEvent = event;
      if (!frameId) frameId = window.requestAnimationFrame(paintTilt);
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      resetCard(card);
      if (activeCard === card) activeCard = null;
    }, { passive: true });
  };

  window.attachPremiumCardTilt = attachTilt;
  document.querySelectorAll(selector).forEach(attachTilt);
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.setAttribute("data-animate", "");

  const img = document.createElement("img");
  configureProductImage(img, product);
  img.alt = `${product.name} - ${product.category} disponible en DCS Technology`;
  img.loading = "lazy";
  img.referrerPolicy = "no-referrer";
  img.width = 640;
  img.height = 440;

  const body = document.createElement("div");
  body.className = "product-body";

  const category = document.createElement("span");
  category.className = "product-meta";
  category.textContent = product.category;

  const title = document.createElement("h3");
  title.textContent = product.name;

  const description = document.createElement("p");
  description.textContent = product.description;

  const price = document.createElement("div");
  price.className = "product-price";
  price.textContent = product.price;

  const actions = document.createElement("div");
  actions.className = "product-actions";

  const wa = document.createElement("a");
  wa.className = "btn whatsapp-btn";
  wa.href = whatsappUrl(`Hola, quiero información sobre ${product.name} en DCS Technology.`);
  wa.target = "_blank";
  wa.rel = "noopener noreferrer";
  wa.textContent = "WhatsApp";
  wa.setAttribute("aria-label", `Consultar ${product.name} por WhatsApp`);

  const details = document.createElement("button");
  details.className = "btn details-btn";
  details.type = "button";
  details.textContent = "Ver detalles";
  details.addEventListener("click", () => {
    openProductDetail(product);
  });

  actions.append(wa, details);
  body.append(category, title, description, price, actions);
  article.append(img, body);
  return article;
}

function configureProductImage(image, product) {
  image.referrerPolicy = "no-referrer";
  image.onerror = () => {
    if (!product.fallbackImage || image.src.includes(product.fallbackImage)) return;
    image.src = product.fallbackImage;
  };
  image.src = product.image;
}

function openProductDetail(product) {
  const message = `${product.name}. Categoría: ${product.category}. ${product.description} No muestro precios exactos en el asistente. Un asesor puede validar disponibilidad, garantía y cotización personalizada por WhatsApp.`;
  addSystemNotice(message);
}

function addSystemNotice(text) {
  const panel = document.getElementById("chatbotPanel");
  const toggle = document.getElementById("chatbotToggle");
  const messages = document.getElementById("chatMessages");
  if (!panel || !toggle || !messages) {
    window.alert(text);
    return;
  }
  panel.hidden = false;
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Cerrar chatbot");
  appendMessage(messages, text, "bot");
}

function setupAnimationsSafely() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = document.querySelectorAll("[data-animate]");
  if (!elements.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  document.body.classList.add("cinematic-observer-ready");
  window.cinematicObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.classList.remove("is-observed");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px 12% 0px",
    threshold: 0.04
  });

  const staggerGroups = [".category-grid", ".promo-grid", ".product-grid", ".diagnosis-grid", ".financing-list"];
  staggerGroups.forEach((selector) => {
    document.querySelectorAll(`${selector} > *`).forEach((element, index) => {
      element.style.setProperty("--stagger-index", String(index));
    });
  });

  elements.forEach((element, index) => {
    if (!element.style.getPropertyValue("--stagger-index")) {
      element.style.setProperty("--stagger-index", String(Math.min(index % 4, 3)));
    }
    element.classList.add("is-observed");
    window.cinematicObserver.observe(element);
  });
  window.setTimeout(() => {
    elements.forEach((element) => {
      element.classList.add("is-visible");
      element.classList.remove("is-observed");
    });
  }, 900);
}

function revealAnimatedElement(element) {
  if (!element || !element.matches("[data-animate]")) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !window.cinematicObserver) {
    element.classList.add("is-visible");
    return;
  }
  element.classList.add("is-observed");
  window.cinematicObserver.observe(element);
}

function setupChatbot() {
  const toggle = document.getElementById("chatbotToggle");
  const panel = document.getElementById("chatbotPanel");
  const close = document.getElementById("chatbotClose");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const clearBtn = document.getElementById("clearBtn");
  const messages = document.getElementById("chatMessages");
  if (!toggle || !panel || !close || !form || !input || !messages || !clearBtn) return;
  if (form.dataset.chatbotReady === "true") return;
  form.dataset.chatbotReady = "true";

  restoredSessionExpired = false;
  if (!restoreChatSession(messages)) {
    appendBotCard(messages, {
      title: "Asistente Inteligente DCS Technology",
      lines: [
        "Ventas, cotización, diagnóstico preliminar, financiación y accesorios.",
        "No doy precios exactos ni diagnósticos definitivos; un asesor puede validar la cotización."
      ]
    });
    if (restoredSessionExpired) {
      appendBotCard(messages, {
        title: "Sesión reiniciada",
        lines: ["La conversación anterior venció por inactividad. Continuaré con un contexto nuevo."]
      });
      restoredSessionExpired = false;
    }
    appendQuickActions(messages, quickActions);
    persistChatSession();
  }

  toggle.addEventListener("click", () => {
    const isOpen = panel.hidden;
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar chatbot" : "Abrir chatbot");
  });

  close.addEventListener("click", () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir chatbot");
  });

  clearBtn.addEventListener("click", () => {
    clearChatInput(input, clearBtn);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isChatProcessing) return;
    const clean = sanitizeText(input.value, MAX_CHAT_LENGTH);
    input.value = "";
    if (!clean) {
      appendBotCard(messages, {
        title: "Consulta requerida",
        lines: ["Escribe una consulta sobre tecnología, diagnóstico técnico, compra, financiación o accesorios."]
      });
      return;
    }
    if (isClearCommand(clean)) {
      clearChatInput(input, clearBtn, messages);
      return;
    }
    handleChatUserText(messages, clean);
  });
}

function handleChatUserText(messages, clean) {
  if (isChatProcessing) return;
  isChatProcessing = true;
  const sessionExpired = isChatSessionExpired();
  appendMessage(messages, clean, "user");
  showTyping(messages, () => {
    try {
      processChatMessage(messages, clean, sessionExpired);
    } finally {
      isChatProcessing = false;
    }
  });
}

function clearChatInput(input, clearBtn, messages = null) {
  input.value = "";
  input.focus();
  clearBtn.classList.add("is-cleared");
  if (clearFeedbackTimer) window.clearTimeout(clearFeedbackTimer);
  clearFeedbackTimer = window.setTimeout(() => {
    clearBtn.classList.remove("is-cleared");
    clearFeedbackTimer = null;
  }, 180);
  if (messages) {
    appendBotCard(messages, {
      title: "Campo de texto limpiado",
      lines: ["Puedes escribir nuevamente."]
    });
  }
}

function isClearCommand(value) {
  const text = Utils.normalizarTexto(value);
  return ["/borrar", "borrar", "borrar texto", "papelera borrar"].some((command) => text === Utils.normalizarTexto(command));
}

function processChatMessage(messages, clean, sessionExpired = false) {
  if (sessionExpired) {
    const lastUserMessage = chatState.chatHistory.slice(-1);
    clearChatFlow({ persist: false });
    resetDiagnosticContext();
    chatState.chatHistory = lastUserMessage;
    clearStoredChatSession();
    appendBotCard(messages, {
      title: "Sesión reiniciada",
      lines: ["La conversación anterior venció por inactividad. Continuaré con tu nuevo mensaje."]
    });
  }
  markChatInteraction();

  const text = normalizeChatText(clean);

  if (chatState.flow) {
    if (!recoverInvalidChatState(messages)) return;
    continueChatFlow(messages, clean, text);
    return;
  }

  const intent = classifyIntent(text);
  chatState.intent = intent;

  if (intent === "tema ajeno") {
    appendBotCard(messages, {
      title: "Alcance del asistente",
      lines: ["Puedo ayudarte únicamente con productos tecnológicos, diagnóstico técnico, accesorios, financiación y servicios de DCS Technology."]
    });
    return;
  }

  if (intent === "saludo") {
    appendBotCard(messages, {
      title: "Hola, soy tu asistente DCS",
      lines: ["Elige una opción rápida o cuéntame si necesitas comprar, cotizar, comparar equipos, financiar o revisar una falla."]
    });
    appendQuickActions(messages, quickActions);
    return;
  }

  if (intent === "diagnóstico") {
    startDiagnosticFlow(messages, clean);
    return;
  }

  if (intent === "daño por agua") {
    appendWaterDamageResponse(messages, clean);
    return;
  }

  if (intent === "compra" || intent === "cotización") {
    startQuoteFlow(messages, clean);
    return;
  }

  if (intent === "lead") {
    startLeadFlow(messages, clean);
    return;
  }

  if (intent === "financiación") {
    appendFinancingResponse(messages);
    return;
  }

  if (intent === "comparación") {
    appendComparisonResponse(messages, clean);
    return;
  }

  if (intent === "computador") {
    appendComputerAdvisor(messages, text);
    return;
  }

  if (intent === "accesorio") {
    appendAccessoryResponse(messages, clean);
    return;
  }

  if (intent === "garantía") {
    appendBotCard(messages, {
      title: "Garantía",
      lines: [
        "La garantía depende del producto, estado, proveedor y condiciones de compra.",
        "Un asesor puede validar cobertura, tiempos y requisitos antes de cualquier trámite."
      ],
      action: {
        label: "Consultar garantía por WhatsApp",
        message: "Hola, quiero validar una garantía con DCS Technology."
      }
    });
    return;
  }

  appendBotCard(messages, {
    title: "Necesito un poco más de contexto",
    lines: [
      "Puedo ayudarte con diagnóstico preliminar, cotización sin precios exactos, financiación, comparación, computadores o accesorios.",
      "También puedo generar un mensaje para WhatsApp si necesitas un asesor."
    ]
  });
  appendQuickActions(messages, quickActions);
}

function classifyIntent(text) {
  if (matches(text, ["política", "fútbol", "clima", "religión", "farándula", "noticia", "receta", "cocina"])) return "tema ajeno";
  if (matches(text, ["hola", "buenas", "buen día", "saludos", "ayuda"])) return "saludo";
  if (matches(text, ["cayó al agua", "cayo al agua", "se mojó", "se mojo", "humedad", "líquido", "liquido", "lluvia", "mojado", "agua"])) return "daño por agua";
  if (matches(text, ["quiero que me contacten", "necesito asesor", "agenda revisión", "agendar revisión", "estoy interesado", "contacten", "hablar por whatsapp", "whatsapp"])) return "lead";
  if (matches(text, ["financiación", "financiar", "cuotas", "crédito", "addi", "sistecrédito", "nequi", "daviplata", "pagar por partes"])) return "financiación";
  if (matches(text, [" vs ", "versus", "comparar", "qué es mejor", "iphone o android"])) return "comparación";
  if (matches(text, ["cotizar", "cotización"])) return "cotización";
  if (matches(text, ["cargador", "cable", "audífono", "audífonos", "smartwatch", "adaptador", "funda", "protector", "accesorio"])) return "accesorio";
  if (matches(text, ["computador lento", "pc lento", "laptop lenta", "portátil lento", "portatil lento", "se traba", "está lento", "esta lento"])) return "diagnóstico";
  if (matches(text, ["portátil", "computador", "pc", "laptop", "programar", "programación", "diseño", "gaming", "render", "computador lento"])) return "computador";
  if (matches(text, ["diagnóstico", "pantalla", "no carga", "no enciende", "batería", "sobrecalienta", "cámara", "sonido", "software", "virus", "apps sospechosas", "falla", "daño", "reparación"])) return "diagnóstico";
  if (matches(text, ["comprar", "cotizar", "cotización", "quiero un", "quiero una", "producto", "celular", "tablet", "smartwatch"])) return text.includes("cotiz") ? "cotización" : "compra";
  if (matches(text, ["garantía"])) return "garantía";
  return "desconocido";
}

function startDiagnosticFlow(messages, initialText) {
  resetChatFlow("diagnóstico", "deviceType");
  chatState.issue = detectIssue(normalizeChatText(initialText)) || "";
  updateDiagnosticMemory("problema", chatState.issue || sanitizeText(initialText, 80));
  chatState.steps = buildDiagnosticSteps(chatState.issue);
  chatState.currentStepIndex = 0;
  appendBotCard(messages, {
    title: "Diagnóstico técnico guiado",
    lines: [
      "Haré preguntas cortas para crear un diagnóstico preliminar.",
      "Puedes escribir corregir para cambiar la última respuesta."
    ]
  });
  askCurrentDiagnosticQuestion(messages);
}

function startQuoteFlow(messages, initialText) {
  resetChatFlow("cotización", "productType");
  chatState.leadProductOrIssue = sanitizeText(initialText, 90);
  appendBotCard(messages, {
    title: "Cotizador inteligente",
    lines: [
      "Te orientaré sin mostrar precios exactos.",
      "Al final, un asesor puede validar disponibilidad y cotización personalizada."
    ]
  });
  askFlowQuestion(messages, "Tipo de producto", "¿Qué deseas cotizar: celular, computador, tablet, smartwatch, audífonos o accesorios?");
}

function startLeadFlow(messages, initialText) {
  resetChatFlow("lead", "leadName");
  chatState.leadProductOrIssue = sanitizeText(initialText, 90);
  appendBotCard(messages, {
    title: "Contacto con asesor",
    lines: ["No guardo datos en servidor. Solo crearé un mensaje prellenado para WhatsApp."]
  });
  askFlowQuestion(messages, "Nombre", "¿Cuál es tu nombre?");
}

function continueChatFlow(messages, clean, text) {
  if (chatState.flow === "diagnóstico") {
    continueDiagnosticFlow(messages, clean, text);
    return;
  }
  if (chatState.flow === "cotización") {
    continueQuoteFlow(messages, clean, text);
    return;
  }
  if (chatState.flow === "lead") {
    continueLeadFlow(messages, clean);
    return;
  }
  clearChatFlow();
  appendBotCard(messages, {
    title: "Necesito retomar el contexto",
    lines: ["La conversación anterior no se pudo continuar. Escríbeme nuevamente el producto o falla que quieres revisar."]
  });
}

function recoverInvalidChatState(messages) {
  if (isValidChatState()) return true;
  clearChatFlow();
  appendBotCard(messages, {
    title: "Conversación recuperada",
    lines: ["Detecté un estado inválido y reinicié el contexto activo. Puedes iniciar una nueva consulta."]
  });
  appendQuickActions(messages, quickActions);
  persistChatSession();
  return false;
}

function isValidChatState() {
  if (!chatState.flow) return true;
  if (!["diagnóstico", "cotización", "lead"].includes(chatState.flow)) return false;

  if (chatState.flow === "diagnóstico") {
    return Array.isArray(chatState.steps)
      && chatState.steps.length > 0
      && chatState.currentStepIndex >= 0
      && chatState.currentStepIndex < chatState.steps.length
      && chatState.steps[chatState.currentStepIndex]?.field === chatState.step;
  }

  const allowedSteps = {
    cotización: ["productType", "usage", "budgetRange", "preference"],
    lead: ["leadName", "leadProductOrIssue", "leadCity", "leadContact"]
  };
  return allowedSteps[chatState.flow].includes(chatState.step);
}

function continueDiagnosticFlow(messages, clean, text) {
  const currentStep = chatState.steps[chatState.currentStepIndex];
  const value = sanitizeText(clean, getStepMaxLength(currentStep));
  if (isCorrectionRequest(text)) {
    correctLastDiagnosticAnswer(messages);
    return;
  }

  if (handleDiagnosticRetryAction(messages, text)) {
    return;
  }

  if (!currentStep) {
    finishDiagnosticFlow(messages);
    return;
  }

  const validation = validateDiagnosticAnswer(value, getStepOptions(currentStep));
  if (!validation.isValid) {
    handleInvalidDiagnosticAnswer(messages, currentStep);
    return;
  }

  chatState.invalidRetries = 0;
  const canonicalValue = validation.canonical || value;
  saveDiagnosticAnswer(currentStep, canonicalValue);

  if (currentStep.field === "brand") {
    if (isOtherBrand(canonicalValue)) {
      insertDiagnosticStepAfterCurrent({
        field: "customBrand",
        title: "Marca exacta",
        question: "Escribe la marca del equipo."
      });
    } else if (!isUnknownAnswer(canonicalValue)) {
      updateDiagnosticMemory("marca", canonicalValue);
      personalizeModelQuestion(canonicalValue);
    }
  }

  if (currentStep.field === "customBrand") {
    chatState.brand = canonicalValue;
    updateDiagnosticMemory("marca", canonicalValue);
    personalizeModelQuestion(canonicalValue);
  }

  if (currentStep.field === "issue") {
    chatState.issue = canonicalValue;
    updateDiagnosticMemory("problema", canonicalValue);
    replacePendingIssueSteps(buildIssueSpecificSteps(canonicalValue));
  }

  if (hasCriticalBatteryWarning(canonicalValue) || hasWaterWarning(canonicalValue)) {
    updateDiagnosticMemory("gravedad", "Alta");
  }

  chatState.currentStepIndex += 1;
  if (chatState.currentStepIndex >= chatState.steps.length) {
    finishDiagnosticFlow(messages);
    return;
  }
  askCurrentDiagnosticQuestion(messages);
}

function finishDiagnosticFlow(messages) {
  const issueText = normalizeChatText([
    chatState.issue,
    chatState.deviceType,
    chatState.brand,
    chatState.model,
    ...Object.values(chatState.answers)
  ].join(" "));
  const causes = getPossibleCauses(issueText);
  const urgency = getUrgency(issueText);
  const recommendation = buildDiagnosticRecommendation(issueText, urgency);
  const confidence = calculateDiagnosticConfidence(causes, urgency);
  updateDiagnosticMemory("gravedad", urgency);
  updateDiagnosticMemory("confianza", confidence);

  appendBotCard(messages, {
    title: "Diagnóstico preliminar",
    rows: [
      ["Dispositivo", `${chatState.deviceType || "No indicado"} ${chatState.brand || ""} ${chatState.model || ""}`.trim()],
      ["Falla reportada", chatState.issue || "No indicada"],
      ["Posibles causas", causes.join(", ")],
      ["Gravedad", urgency],
      ["Precisión del diagnóstico", `${confidence}/100`],
      ["Recomendación", recommendation]
    ],
    action: {
      label: "Contactar asesor por WhatsApp",
      message: buildDiagnosticWhatsAppMessage(causes, urgency, recommendation, confidence)
    }
  });
  clearChatFlow();
}

function continueQuoteFlow(messages, clean) {
  const value = sanitizeText(clean, 90);
  if (chatState.step === "productType") {
    chatState.deviceType = value;
    chatState.step = "usage";
    askFlowQuestion(messages, "Uso principal", "Uso principal: estudio, trabajo, gaming, redes sociales, fotografía o negocio?");
    return;
  }
  if (chatState.step === "usage") {
    chatState.usage = value;
    chatState.step = "budgetRange";
    askFlowQuestion(messages, "Rango", "¿Qué rango buscas: económico, gama media, gama alta o premium?");
    return;
  }
  if (chatState.step === "budgetRange") {
    chatState.budgetRange = value;
    chatState.step = "preference";
    askFlowQuestion(messages, "Preferencia", "¿Qué priorizas: batería, cámara, rendimiento, almacenamiento, diseño, garantía o financiación?");
    return;
  }
  if (chatState.step === "preference") {
    chatState.preference = value;
    finishQuoteFlow(messages);
  }
}

function finishQuoteFlow(messages) {
  const recommendation = buildQuoteRecommendation();
  appendBotCard(messages, {
    title: "Recomendación comercial",
    lines: [
      recommendation,
      "No muestro precios exactos por este medio. Un asesor puede validar disponibilidad y cotización personalizada."
    ],
    rows: [
      ["Producto", chatState.deviceType || "No indicado"],
      ["Uso", chatState.usage || "No indicado"],
      ["Rango", chatState.budgetRange || "No indicado"],
      ["Prioridad", chatState.preference || "No indicada"]
    ],
    action: {
      label: "Solicitar cotización por WhatsApp",
      message: `Hola, quiero una cotización en DCS Technology. Producto: ${chatState.deviceType || "por definir"}. Uso: ${chatState.usage || "por definir"}. Rango: ${chatState.budgetRange || "por definir"}. Prioridad: ${chatState.preference || "por definir"}.`
    }
  });
  clearChatFlow();
}

function continueLeadFlow(messages, clean) {
  const value = sanitizeText(clean, 90);
  if (chatState.step === "leadName") {
    chatState.leadName = value;
    chatState.step = "leadProductOrIssue";
    askFlowQuestion(messages, "Producto o falla", "¿Qué producto o falla quieres consultar?");
    return;
  }
  if (chatState.step === "leadProductOrIssue") {
    chatState.leadProductOrIssue = value;
    chatState.step = "leadCity";
    askFlowQuestion(messages, "Ciudad", "¿En qué ciudad estás?");
    return;
  }
  if (chatState.step === "leadCity") {
    chatState.leadCity = value;
    chatState.step = "leadContact";
    askFlowQuestion(messages, "Contacto", "¿Qué medio de contacto prefieres?");
    return;
  }
  if (chatState.step === "leadContact") {
    chatState.leadContact = value;
    appendBotCard(messages, {
      title: "Mensaje listo para WhatsApp",
      lines: ["No guardo estos datos. Solo se usarán para abrir WhatsApp con el mensaje prellenado."],
      action: {
        label: "Enviar datos por WhatsApp",
        message: `Hola, soy ${chatState.leadName || "cliente"}. Estoy en ${chatState.leadCity || "mi ciudad"}. Quiero consultar: ${chatState.leadProductOrIssue || "producto o falla"}. Medio de contacto preferido: ${chatState.leadContact || "WhatsApp"}.`
      }
    });
    clearChatFlow();
  }
}

function appendWaterDamageResponse(messages) {
  appendBotCard(messages, {
    title: "Alerta por agua o humedad",
    rows: [
      ["Nivel de riesgo", "Alto"],
      ["No hacer", "No cargar, no encender repetidamente, no usar secador caliente, no agitar demasiado."],
      ["Hacer", "Apagar, retirar funda, secar exterior y llevar a revisión técnica."],
      ["Recomendación", "Requiere revisión técnica para evaluar posible corrosión o daño interno."]
    ],
    action: {
      label: "Solicitar revisión por WhatsApp",
      message: "Hola, mi equipo tuvo contacto con agua o humedad. Necesito revisión técnica en DCS Technology."
    }
  });
}

function appendFinancingResponse(messages) {
  appendBotCard(messages, {
    title: "Financiación",
    lines: [
      "La financiación depende del perfil, validación de cupo, documento requerido y condiciones del producto.",
      "La aprobación está sujeta a validación; no puedo prometer aprobación ni cuotas exactas."
    ],
    action: {
      label: "Consultar financiación por WhatsApp",
      message: "Hola, quiero consultar opciones de financiación en DCS Technology."
    }
  });
}

function appendComparisonResponse(messages, clean) {
  appendBotCard(messages, {
    title: "Comparación de equipos",
    rows: [
      ["Rendimiento", "Depende del procesador, memoria, optimización y uso principal."],
      ["Cámara", "Conviene revisar estabilización, sensor, video y fotos nocturnas."],
      ["Batería", "Importan capacidad, eficiencia y velocidad de carga compatible."],
      ["Pantalla", "Evalúa brillo, tasa de refresco, resolución y resistencia."],
      ["Sistema operativo", "iOS suele destacar por ecosistema; Android por variedad y personalización."],
      ["Uso recomendado", "La mejor opción depende de tu prioridad: cámara, batería, gaming, trabajo o garantía."],
      ["Conclusión", "Para una recomendación exacta según disponibilidad, solicita asesoría por WhatsApp."]
    ],
    action: {
      label: "Comparar por WhatsApp",
      message: `Hola, quiero comparar equipos en DCS Technology: ${sanitizeText(clean, 120)}.`
    }
  });
}

function appendComputerAdvisor(messages, text) {
  const profile = getComputerProfile(text);
  appendBotCard(messages, {
    title: "Computador ideal",
    rows: [
      ["Perfil", profile.name],
      ["Procesador", profile.cpu],
      ["RAM", profile.ram],
      ["Almacenamiento", "SSD recomendado para mejor velocidad."],
      ["Pantalla/GPU", profile.display],
      ["Siguiente paso", "Un asesor puede validar disponibilidad y cotización personalizada."]
    ],
    action: {
      label: "Cotizar computador por WhatsApp",
      message: `Hola, quiero cotizar un computador para ${profile.name} en DCS Technology.`
    }
  });
}

function appendAccessoryResponse(messages, clean) {
  appendBotCard(messages, {
    title: "Compatibilidad de accesorios",
    lines: [
      "Para validar compatibilidad necesito saber el modelo exacto del equipo.",
      "En general, se recomienda usar accesorios certificados y compatibles con la potencia del dispositivo."
    ],
    action: {
      label: "Consultar accesorio por WhatsApp",
      message: `Hola, quiero validar compatibilidad de accesorio en DCS Technology: ${sanitizeText(clean, 120)}.`
    }
  });
}

function markChatInteraction() {
  chatState.lastInteractionAt = Date.now();
}

function isChatSessionExpired(timestamp = chatState.lastInteractionAt) {
  return Boolean(timestamp) && Date.now() - timestamp > CONFIG.CHAT_SESSION_TIMEOUT_MS;
}

function pushChatHistory(entry) {
  if (isRestoringChat) return;
  chatState.chatHistory.push(entry);
  if (chatState.chatHistory.length > CONFIG.CHAT_HISTORY_LIMIT) {
    chatState.chatHistory = chatState.chatHistory.slice(-CONFIG.CHAT_HISTORY_LIMIT);
  }
  persistChatSession();
}

function persistChatSession() {
  if (isRestoringChat || !Utils.storageAvailable()) return;
  try {
    const payload = {
      savedAt: Date.now(),
      state: serializeChatState(),
      history: chatState.chatHistory.slice(-CONFIG.CHAT_HISTORY_LIMIT)
    };
    window.localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(payload));
  } catch (_error) {
    try {
      window.localStorage.removeItem(CONFIG.STORAGE_KEY);
    } catch (_removeError) {
      // Storage may be blocked by the browser; the chatbot still works without persistence.
    }
  }
}

function restoreChatSession(messages) {
  if (!Utils.storageAvailable()) return false;
  const raw = window.localStorage.getItem(CONFIG.STORAGE_KEY);
  if (!raw) return false;

  const payload = Utils.safeJsonParse(raw, null);
  if (!payload || !payload.state || isChatSessionExpired(payload.state.lastInteractionAt || payload.savedAt)) {
    restoredSessionExpired = Boolean(payload && payload.state);
    resetDiagnosticContext();
    clearStoredChatSession();
    return false;
  }

  applySerializedChatState(payload.state);
  const history = Array.isArray(payload.history) ? payload.history.slice(-CONFIG.CHAT_HISTORY_LIMIT) : [];
  isRestoringChat = true;
  messages.replaceChildren();
  history.forEach((entry) => renderChatHistoryEntry(messages, entry));
  isRestoringChat = false;

  if (!history.length) return false;
  if (chatState.flow === "diagnóstico") {
    appendOptionReplies(messages, getStepOptions(chatState.steps[chatState.currentStepIndex]));
  } else if (!chatState.flow) {
    appendQuickActions(messages, quickActions);
  }
  scrollChatToBottom(messages);
  return true;
}

function clearStoredChatSession() {
  try {
    window.localStorage.removeItem(CONFIG.STORAGE_KEY);
  } catch (_error) {
    // Ignored: storage can be unavailable in private browsing or restricted contexts.
  }
}

function serializeChatState() {
  return {
    intent: chatState.intent,
    deviceType: chatState.deviceType,
    brand: chatState.brand,
    model: chatState.model,
    issue: chatState.issue,
    budgetRange: chatState.budgetRange,
    usage: chatState.usage,
    preference: chatState.preference,
    leadName: chatState.leadName,
    leadCity: chatState.leadCity,
    leadProductOrIssue: chatState.leadProductOrIssue,
    leadContact: chatState.leadContact,
    flow: chatState.flow,
    step: chatState.step,
    steps: Array.isArray(chatState.steps) ? chatState.steps : [],
    currentStepIndex: Utils.clampNumber(chatState.currentStepIndex, 0, 40),
    answers: { ...chatState.answers },
    answerHistory: Array.isArray(chatState.answerHistory) ? chatState.answerHistory.slice(-20) : [],
    invalidRetries: Utils.clampNumber(chatState.invalidRetries, 0, CONFIG.maxReintentos),
    lastInteractionAt: chatState.lastInteractionAt || Date.now(),
    memoria: { ...chatState.memoria }
  };
}

function applySerializedChatState(state) {
  Object.assign(chatState, {
    intent: sanitizeText(state.intent, 60) || null,
    deviceType: sanitizeText(state.deviceType, 90) || null,
    brand: sanitizeText(state.brand, 90) || null,
    model: sanitizeText(state.model, 90) || null,
    issue: sanitizeText(state.issue, 120) || null,
    budgetRange: sanitizeText(state.budgetRange, 90) || null,
    usage: sanitizeText(state.usage, 90) || null,
    preference: sanitizeText(state.preference, 90) || null,
    leadName: sanitizeText(state.leadName, 90) || null,
    leadCity: sanitizeText(state.leadCity, 90) || null,
    leadProductOrIssue: sanitizeText(state.leadProductOrIssue, 120) || null,
    leadContact: sanitizeText(state.leadContact, 90) || null,
    flow: sanitizeText(state.flow, 40) || null,
    step: sanitizeText(state.step, 60) || null,
    steps: Array.isArray(state.steps) ? state.steps : [],
    currentStepIndex: Utils.clampNumber(state.currentStepIndex || 0, 0, 40),
    answers: sanitizeRecord(state.answers, 120),
    answerHistory: Array.isArray(state.answerHistory) ? state.answerHistory.slice(-20) : [],
    invalidRetries: Utils.clampNumber(state.invalidRetries || 0, 0, CONFIG.maxReintentos),
    lastInteractionAt: state.lastInteractionAt || Date.now(),
    memoria: {
      ...createDiagnosticMemory(),
      ...sanitizeRecord(state.memoria, 180)
    }
  });
}

function sanitizeRecord(record, maxLength) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return {};
  return Object.fromEntries(
    Object.entries(record)
      .slice(0, 40)
      .map(([key, value]) => [sanitizeText(key, 60), sanitizeText(value, maxLength)])
      .filter(([key]) => key)
  );
}

function renderChatHistoryEntry(container, entry) {
  if (!entry || typeof entry !== "object") return;
  if (entry.kind === "message") {
    appendMessage(container, entry.text || "", entry.type === "user" ? "user" : "bot");
    return;
  }
  if (entry.kind === "card") {
    appendBotCard(container, {
      title: entry.title || "Mensaje",
      lines: Array.isArray(entry.lines) ? entry.lines : null,
      rows: Array.isArray(entry.rows) ? entry.rows : null,
      action: entry.action || null
    });
  }
}

function appendMessage(container, text, type) {
  if (!container) return;
  const message = document.createElement("div");
  const safeType = type === "user" ? "user" : "bot";
  const safeText = sanitizeText(text, MAX_CHAT_LENGTH);
  message.className = `message ${safeType}`;
  message.textContent = safeText;
  container.appendChild(message);
  pushChatHistory({ kind: "message", type: safeType, text: safeText });
  scrollChatToBottom(container);
}

function appendBotCard(container, payload) {
  if (!container || !payload) return;
  const safePayload = sanitizeBotPayload(payload);
  const card = document.createElement("div");
  card.className = "message bot bot-card";

  const title = document.createElement("strong");
  title.className = "bot-card-title";
  title.textContent = safePayload.title;
  card.appendChild(title);

  if (safePayload.lines) {
    const list = document.createElement("ul");
    list.className = "bot-card-list";
    safePayload.lines.forEach((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      list.appendChild(item);
    });
    card.appendChild(list);
  }

  if (safePayload.rows) {
    const rows = document.createElement("dl");
    rows.className = "bot-card-rows";
    safePayload.rows.forEach(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = value;
      rows.append(term, detail);
    });
    card.appendChild(rows);
  }

  container.appendChild(card);
  pushChatHistory({ kind: "card", ...safePayload });
  if (safePayload.action) {
    appendWhatsAppButton(container, safePayload.action.message, safePayload.action.label);
  }
  scrollChatToBottom(container);
}

function sanitizeBotPayload(payload) {
  return {
    title: sanitizeText(payload.title || "Mensaje", 80),
    lines: Array.isArray(payload.lines) ? payload.lines.map((line) => sanitizeText(line, 240)) : null,
    rows: Array.isArray(payload.rows)
      ? payload.rows.map(([label, value]) => [sanitizeText(label, 80), sanitizeText(value, 260)])
      : null,
    action: payload.action ? {
      label: sanitizeText(payload.action.label || "Hablar por WhatsApp", 80),
      message: sanitizeText(payload.action.message || "", 1800)
    } : null
  };
}

function appendQuickActions(container, actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "quick-replies";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-reply";
    button.textContent = action;
    button.title = action;
    button.tabIndex = 0;
    button.setAttribute("aria-label", action);
    button.addEventListener("click", () => {
      handleChatUserText(container, action);
    });
    wrapper.appendChild(button);
  });
  container.appendChild(wrapper);
  scrollChatToBottom(container);
}

function appendWhatsAppButton(container, message, label = "Hablar por WhatsApp") {
  const link = document.createElement("a");
  link.className = "chat-whatsapp";
  link.href = whatsappUrl(message);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  link.title = label;
  link.tabIndex = 0;
  link.setAttribute("aria-label", label);
  container.appendChild(link);
  scrollChatToBottom(container);
}

function showTyping(container, callback) {
  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  ["", "", ""].forEach(() => {
    const dot = document.createElement("span");
    typing.appendChild(dot);
  });
  container.appendChild(typing);
  scrollChatToBottom(container);
  window.setTimeout(() => {
    typing.remove();
    callback();
  }, 320);
}

function createDiagnosticMemory() {
  return {
    marca: "",
    modelo: "",
    problema: "",
    evento: "",
    sintomas: "",
    tiempo: "",
    gravedad: "",
    confianza: 0
  };
}

function buildDiagnosticSteps(issue) {
  const baseSteps = [
    { field: "deviceType", title: "Tipo de dispositivo", question: "Qué equipo deseas revisar: celular, tablet, computador o smartwatch?", options: ["Celular", "Tablet", "Computador", "Smartwatch", "No sé"] },
    { field: "brand", title: "Marca", question: "Cuál es la marca del equipo? Si no aparece en tu mente, escribe Otra o No sé.", options: ["Xiaomi", "Samsung", "iPhone", "Motorola", "Huawei", "Otra", "No sé"] },
    { field: "model", title: "Referencia o modelo", question: "Cuál es la referencia o modelo exacto? Ej: Xiaomi Redmi Note 12, Samsung A14, iPhone 11 o Motorola G60." },
    { field: "issue", title: "Falla principal", question: "Cuál es la falla principal que presenta el equipo?", options: ["No enciende", "Pantalla rota / dañada", "No carga", "Batería dura poco", "Computador lento", "Software / virus", "No sé"] }
  ].filter((step) => {
    if (step.field === "brand") return !chatState.memoria.marca;
    if (step.field === "model") return !chatState.memoria.modelo;
    if (step.field === "issue") return !issue;
    return true;
  });

  return [
    ...baseSteps,
    ...buildIssueSpecificSteps(issue)
  ];
}

function buildIssueSpecificSteps(issue) {
  const category = getDiagnosticCategory(issue);
  return DIAGNOSTIC_KNOWLEDGE_BASE[category].questions.map((question) => ({ ...question, category }));
}

function getDiagnosticCategory(text) {
  const normalized = normalizeChatText(text || "");
  const matchedKey = Object.keys(DIAGNOSTIC_KNOWLEDGE_BASE).find((key) => {
    if (key === "general") return false;
    return DIAGNOSTIC_KNOWLEDGE_BASE[key].aliases.some((alias) => normalized.includes(normalizeChatText(alias)));
  });
  return matchedKey || "general";
}

function askCurrentDiagnosticQuestion(messages) {
  const currentStep = chatState.steps[chatState.currentStepIndex];
  if (!currentStep) {
    finishDiagnosticFlow(messages);
    return;
  }
  chatState.step = currentStep.field;
  askFlowQuestion(
    messages,
    `${currentStep.title} · Pregunta ${chatState.currentStepIndex + 1} de ${chatState.steps.length}`,
    currentStep.question
  );
  appendOptionReplies(messages, getStepOptions(currentStep));
}

function getStepOptions(step) {
  return Array.isArray(step?.options) ? step.options : [];
}

function getStepMaxLength(step) {
  if (!step) return CONFIG.MAX_CHAT_LENGTH;
  if (step.field === "model") return CONFIG.MODEL_MAX_LENGTH;
  if (step.field === "customBrand") return CONFIG.CUSTOM_BRAND_MAX_LENGTH;
  if (!getStepOptions(step).length) return CONFIG.MAX_CHAT_LENGTH;
  return 140;
}

function appendOptionReplies(container, options) {
  if (!options.length) return;
  appendQuickActions(container, options);
}

function validateDiagnosticAnswer(answer, validOptions) {
  if (!validOptions?.length) {
    return { isValid: true, canonical: sanitizeText(answer, 90) };
  }

  const normalized = Utils.normalizarTexto(answer);
  if (isUnknownAnswer(answer)) {
    const unknownOption = validOptions.find((option) => isUnknownAnswer(option)) || "No sé";
    return { isValid: true, canonical: unknownOption };
  }

  for (const option of validOptions) {
    const optionNormalized = Utils.normalizarTexto(option);
    if (normalized === optionNormalized) return { isValid: true, canonical: option };
    if (normalized.length > 3 && optionNormalized.includes(normalized)) return { isValid: true, canonical: option };
    if (optionNormalized.length > 3 && normalized.includes(optionNormalized)) return { isValid: true, canonical: option };
  }

  const match = Utils.mejorCoincidencia(answer, validOptions);
  return match.esValida
    ? { isValid: true, canonical: match.opcion }
    : { isValid: false, canonical: "" };
}

function handleInvalidDiagnosticAnswer(messages, currentStep) {
  chatState.invalidRetries += 1;
  if (chatState.invalidRetries >= CONFIG.maxReintentos) {
    appendBotCard(messages, {
      title: "No estás seleccionando una opción válida",
      lines: ["¿Qué deseas hacer?"]
    });
    appendQuickActions(messages, ["Ver opciones", "Hablar con asesor", "Nueva consulta"]);
    persistChatSession();
    return;
  }

  appendBotCard(messages, {
    title: "No entendí esa respuesta",
    lines: ["Por favor selecciona una de las siguientes opciones:"]
  });
  askCurrentDiagnosticQuestion(messages);
  persistChatSession();
}

function handleDiagnosticRetryAction(messages, text) {
  if (matches(text, ["ver opciones"])) {
    chatState.invalidRetries = 0;
    askCurrentDiagnosticQuestion(messages);
    persistChatSession();
    return true;
  }

  if (matches(text, ["hablar con asesor"])) {
    appendBotCard(messages, {
      title: "Asesoría técnica",
      lines: ["Puedes enviar lo que llevamos del diagnóstico a un asesor."],
      action: {
        label: "Hablar con asesor",
        message: buildPartialDiagnosticWhatsAppMessage()
      }
    });
    persistChatSession();
    return true;
  }

  if (matches(text, ["nueva consulta"])) {
    resetChatFlow("diagnóstico", "deviceType");
    chatState.steps = buildDiagnosticSteps("");
    chatState.currentStepIndex = 0;
    appendBotCard(messages, {
      title: "Nueva consulta",
      lines: ["Empecemos nuevamente con un diagnóstico limpio."]
    });
    askCurrentDiagnosticQuestion(messages);
    persistChatSession();
    return true;
  }

  return false;
}

function saveDiagnosticAnswer(step, value) {
  const safeValue = sanitizeText(value, getStepMaxLength(step));
  const previous = getDiagnosticFieldValue(step.field);
  chatState.answerHistory.push({ field: step.field, previous, step });

  if (step.field === "deviceType") {
    chatState.deviceType = safeValue;
  } else if (step.field === "brand") {
    chatState.brand = isOtherBrand(safeValue) || isUnknownAnswer(safeValue) ? "" : safeValue;
  } else if (step.field === "model") {
    chatState.model = isUnknownAnswer(safeValue) ? "" : safeValue;
  } else if (step.field === "issue") {
    chatState.issue = safeValue;
  } else {
    chatState.answers[step.field] = safeValue;
  }

  updateMemoryFromStep(step.field, safeValue);
}

function getDiagnosticFieldValue(field) {
  if (field === "deviceType") return chatState.deviceType;
  if (field === "brand" || field === "customBrand") return chatState.brand;
  if (field === "model") return chatState.model;
  if (field === "issue") return chatState.issue;
  return chatState.answers[field];
}

function updateMemoryFromStep(field, value) {
  if (isUnknownAnswer(value)) return;
  if (field === "brand" || field === "customBrand") updateDiagnosticMemory("marca", value);
  if (field === "model") updateDiagnosticMemory("modelo", value);
  if (field === "issue") updateDiagnosticMemory("problema", value);
  if (["evento", "tipoDano"].includes(field)) updateDiagnosticMemory("evento", value);
  if (["sintomas", "tactil", "cargador", "puerto", "temperatura", "iconoCarga", "duracion", "reposo", "porcentaje", "bateriaInflada", "sistemaOperativo", "almacenamiento", "ram", "momentoLentitud", "softwareSospechoso", "ruidos"].includes(field)) {
    const current = chatState.memoria.sintomas ? `${chatState.memoria.sintomas}; ` : "";
    updateDiagnosticMemory("sintomas", `${current}${value}`);
  }
  if (field === "tiempo") updateDiagnosticMemory("tiempo", value);
}

function updateDiagnosticMemory(field, value) {
  chatState.memoria[field] = value;
}

function insertDiagnosticStepAfterCurrent(step) {
  const exists = chatState.steps.some((item) => item.field === step.field);
  if (!exists) chatState.steps.splice(chatState.currentStepIndex + 1, 0, step);
}

function personalizeModelQuestion(brand) {
  const modelStep = chatState.steps.find((step) => step.field === "model");
  if (!modelStep) return;
  modelStep.question = isKnownDiagnosticBrand(brand)
    ? `Cuál es la referencia o modelo exacto del ${brand}? Ej: ${getModelExample(brand)}.`
    : `Cuál es la referencia o modelo exacto del equipo ${brand}? Si no la sabes, escribe No sé.`;
}

function isKnownDiagnosticBrand(value) {
  const brand = normalizeChatText(value || "");
  return KNOWN_DIAGNOSTIC_BRANDS.some((knownBrand) => brand.includes(normalizeChatText(knownBrand)));
}

function getModelExample(brand) {
  const text = normalizeChatText(brand || "");
  if (text.includes("xiaomi")) return "Xiaomi Redmi Note 12";
  if (text.includes("samsung")) return "Samsung A14";
  if (text.includes("iphone") || text.includes("apple")) return "iPhone 11";
  if (text.includes("motorola")) return "Motorola G60";
  if (text.includes("huawei")) return "Huawei Y9";
  return `${brand} modelo exacto`;
}

function replacePendingIssueSteps(nextSteps) {
  const answeredFields = new Set(chatState.answerHistory.map((item) => item.field));
  const fixedSteps = chatState.steps.slice(0, chatState.currentStepIndex + 1);
  const pendingSteps = nextSteps.filter((step) => !answeredFields.has(step.field));
  chatState.steps = [...fixedSteps, ...pendingSteps];
}

function correctLastDiagnosticAnswer(messages) {
  const last = chatState.answerHistory.pop();
  if (!last) {
    appendBotCard(messages, {
      title: "Sin respuesta anterior",
      lines: ["Aún no hay una respuesta para corregir."]
    });
    return;
  }
  restoreDiagnosticField(last.field, last.previous);
  chatState.currentStepIndex = Math.max(0, chatState.currentStepIndex - 1);
  askCurrentDiagnosticQuestion(messages);
}

function restoreDiagnosticField(field, value) {
  if (field === "deviceType") chatState.deviceType = value || null;
  else if (field === "brand" || field === "customBrand") chatState.brand = value || null;
  else if (field === "model") chatState.model = value || null;
  else if (field === "issue") chatState.issue = value || null;
  else if (value) chatState.answers[field] = value;
  else delete chatState.answers[field];

  chatState.memoria = buildDiagnosticMemoryFromState();
}

function buildDiagnosticMemoryFromState() {
  const memory = createDiagnosticMemory();
  memory.marca = chatState.brand || "";
  memory.modelo = chatState.model || "";
  memory.problema = chatState.issue || "";
  memory.evento = chatState.answers.evento || chatState.answers.tipoDano || "";
  memory.tiempo = chatState.answers.tiempo || "";
  memory.sintomas = Object.entries(chatState.answers)
    .filter(([key]) => !["evento", "tipoDano", "tiempo"].includes(key))
    .map(([, value]) => value)
    .filter(Boolean)
    .join("; ");
  return memory;
}

function isCorrectionRequest(text) {
  return matches(text, ["corregir", "corrige", "editar", "cambiar respuesta", "me equivoque", "me equivoqué"]);
}

function isOtherBrand(value) {
  const text = normalizeChatText(value || "");
  return ["otra", "otro", "otra marca", "no aparece"].some((term) => text === normalizeChatText(term));
}

function isUnknownAnswer(value) {
  const text = normalizeChatText(value || "");
  const compactText = text.replace(/[^a-z0-9\s]/g, "").trim();
  return ["no se", "no s", "nose", "no sé", "no recuerdo", "ni idea", "desconozco"].some((term) => compactText === normalizeChatText(term).replace(/[^a-z0-9\s]/g, "").trim());
}

function hasWaterWarning(value) {
  return matches(normalizeChatText(value || ""), ["agua", "humedad", "liquido", "líquido", "mojado", "se mojo", "se mojó"]);
}

function hasCriticalBatteryWarning(value) {
  return matches(normalizeChatText(value || ""), ["bateria inflada", "batería inflada", "inflada", "tapa levantada", "pantalla levantada", "humo"]);
}

function askFlowQuestion(messages, title, question) {
  appendBotCard(messages, {
    title,
    lines: [question]
  });
}

function resetChatFlow(flow, step) {
  clearChatFlow();
  if (flow === "diagnóstico") {
    resetDiagnosticContext();
  }
  chatState.flow = flow;
  chatState.step = step;
}

function clearChatFlow(options = {}) {
  chatState.flow = null;
  chatState.step = null;
  chatState.steps = [];
  chatState.currentStepIndex = 0;
  chatState.answers = {};
  chatState.answerHistory = [];
  chatState.invalidRetries = 0;
  if (options.persist !== false) persistChatSession();
}

function resetDiagnosticContext() {
  chatState.deviceType = null;
  chatState.brand = null;
  chatState.model = null;
  chatState.issue = null;
  chatState.answers = {};
  chatState.answerHistory = [];
  chatState.invalidRetries = 0;
  chatState.memoria = createDiagnosticMemory();
}

function normalizeChatText(value) {
  return sanitizeText(value, MAX_CHAT_LENGTH)
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matches(text, terms) {
  return terms.some((term) => text.includes(normalizeChatText(term)));
}

function detectIssue(text) {
  const category = getDiagnosticCategory(text);
  return category === "general" ? null : DIAGNOSTIC_KNOWLEDGE_BASE[category].title;
}

function getPossibleCauses(text) {
  if (matches(text, ["agua", "humedad", "líquido", "mojo"])) return ["humedad interna", "corrosión", "posible daño en placa"];
  if (matches(text, ["pantalla", "display", "touch", "tactil", "táctil", "golpe", "linea verde", "línea verde", "mancha"])) return ["display afectado", "táctil dañado", "conector interno flojo"];
  if (matches(text, ["no carga", "cargador", "puerto"])) return ["puerto de carga", "cable o cargador", "batería o flex de carga"];
  if (matches(text, ["no enciende", "no prende"])) return ["batería descargada o deteriorada", "software", "posible falla de placa"];
  if (matches(text, ["batería", "bateria", "descarga", "porcentaje", "inflada"])) return ["batería degradada", "consumo por apps", "cargador no compatible"];
  if (matches(text, ["cámara"])) return ["lente sucio", "modulo de cámara", "software de cámara"];
  if (matches(text, ["sonido", "audio"])) return ["altavoz", "micrófono", "configuración o humedad"];
  if (matches(text, ["virus", "software", "apps"])) return ["apps sospechosas", "software saturado", "configuración insegura"];
  if (matches(text, ["lento", "computador", "hdd", "ssd", "ram", "ruidos"])) return ["almacenamiento lleno o disco HDD lento", "disco deteriorado", "RAM insuficiente"];
  return ["requiere revisión técnica", "posible falla de software", "posible componente interno"];
}

function getUrgency(text) {
  if (chatState.memoria.gravedad === "Alta") return "Alta";
  if (matches(text, ["agua", "humedad", "líquido", "liquido", "no enciende", "batería inflada", "bateria inflada", "humo", "calienta mucho", "tapa levantada", "pantalla levantada"])) return "Alta";
  if (matches(text, ["pantalla", "no carga", "cámara", "sonido", "virus"])) return "Medio";
  return "Baja";
}

function buildDiagnosticRecommendation(issueText, urgency) {
  if (hasCriticalBatteryWarning(issueText)) {
    return "No uses ni cargues el equipo. Una batería inflada requiere revisión técnica prioritaria.";
  }
  if (hasWaterWarning(issueText)) {
    return "No lo cargues ni lo enciendas. Conviene revisión técnica cuanto antes para evitar corrosión.";
  }
  if (urgency === "Alta") {
    return "Evita seguir usando el equipo y solicita revisión técnica cuanto antes.";
  }
  return "Se recomienda revisión técnica para confirmar causa y cotización.";
}

function calculateDiagnosticConfidence(causes, urgency) {
  const answeredValues = [
    chatState.deviceType,
    chatState.brand,
    chatState.model,
    chatState.issue,
    ...Object.values(chatState.answers)
  ];
  const completeAnswers = answeredValues.filter((value) => value && !isUnknownAnswer(value)).length;
  const unknownAnswers = answeredValues.filter((value) => value && isUnknownAnswer(value)).length;
  const expectedAnswers = Math.max(chatState.steps.length, 1);
  const completionScore = Math.round((completeAnswers / expectedAnswers) * 55);
  const hasBrand = Boolean(chatState.brand && !isUnknownAnswer(chatState.brand));
  const hasModel = Boolean(chatState.model && !isUnknownAnswer(chatState.model));
  const hasIssue = Boolean(chatState.issue && getDiagnosticCategory(chatState.issue) !== "general");
  const hasCause = causes.some((cause) => !normalizeChatText(cause).includes("requiere revision"));
  const coherencePenalty = hasCriticalBatteryWarning(Object.values(chatState.answers).join(" ")) && urgency !== "Alta" ? 10 : 0;

  let confidence = 20 + completionScore;
  if (hasBrand) confidence += 8;
  if (hasModel) confidence += 12;
  if (hasIssue) confidence += 10;
  if (hasCause) confidence += 8;
  confidence -= unknownAnswers * 7;
  confidence -= coherencePenalty;

  const maxConfidence = !hasBrand && !hasModel ? 60 : hasBrand && !hasModel ? 75 : 98;
  return Math.max(1, Math.min(maxConfidence, confidence));
}

function buildDiagnosticWhatsAppMessage(causes, urgency, recommendation, confidence) {
  const now = new Date();
  const formattedDate = now.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  });
  const safeProblem = chatState.memoria.problema || chatState.issue || "No identificado";
  const safeUrgency = urgency || chatState.memoria.gravedad || "No identificado";
  const safeConfidence = Number.isFinite(confidence) && confidence > 0
    ? `${confidence}/100`
    : chatState.memoria.confianza
      ? `${chatState.memoria.confianza}/100`
      : "No identificado";
  const answerRows = Object.entries(chatState.answers)
    .map(([field, value]) => `${field}: ${value}`)
    .join(" | ");

  return [
    "Hola, necesito revisión técnica en DCS Technology.",
    `Problema identificado: ${safeProblem}.`,
    `Marca: ${chatState.memoria.marca || "no indicada"}.`,
    `Modelo/referencia: ${chatState.memoria.modelo || "no indicado"}.`,
    `Respuestas completas: ${answerRows || "sin respuestas adicionales"}.`,
    `Causa probable: ${causes.join(", ")}.`,
    `Gravedad: ${safeUrgency}.`,
    `Confianza del diagnóstico: ${safeConfidence}.`,
    `Recomendación preliminar: ${recommendation}`,
    `Fecha y hora: ${formattedDate}.`
  ].join(" ");
}

function buildPartialDiagnosticWhatsAppMessage() {
  const answers = Object.entries(chatState.answers)
    .map(([field, value]) => `${field}: ${value}`)
    .join(" | ");
  return [
    "Hola, necesito asesoría técnica en DCS Technology.",
    `Problema: ${chatState.memoria.problema || chatState.issue || "No identificado"}.`,
    `Marca: ${chatState.memoria.marca || chatState.brand || "no indicada"}.`,
    `Modelo/referencia: ${chatState.memoria.modelo || chatState.model || "no indicado"}.`,
    `Respuestas actuales: ${answers || "sin respuestas adicionales"}.`
  ].join(" ");
}

function buildQuoteRecommendation() {
  const range = normalizeChatText(chatState.budgetRange || "");
  const usage = normalizeChatText(chatState.usage || "");
  const preference = normalizeChatText(chatState.preference || "");
  const level = range.includes("premium") ? "premium" : range.includes("alta") ? "gama alta" : range.includes("media") ? "gama media" : "opción equilibrada";
  const useText = usage ? ` para ${chatState.usage}` : "";
  const preferenceText = preference ? ` con prioridad en ${chatState.preference}` : "";
  return `Según tu perfil, te conviene una ${level}${useText}${preferenceText}. La recomendación final depende de disponibilidad, garantía y condiciones de financiación.`;
}

function getComputerProfile(text) {
  if (matches(text, ["programar", "programación"])) {
    return { name: "programación", cpu: "procesador moderno", ram: "16 GB RAM recomendado", display: "buena pantalla y teclado cómodo" };
  }
  if (matches(text, ["diseño", "diseno", "edicion", "render"])) {
    return { name: "diseño", cpu: "procesador potente", ram: "RAM alta recomendada", display: "pantalla de buena calidad y GPU si aplica" };
  }
  if (matches(text, ["gaming", "juegos"])) {
    return { name: "gaming", cpu: "procesador potente", ram: "RAM alta", display: "GPU dedicada y buena ventilación" };
  }
  if (matches(text, ["estudiar", "estudio"])) {
    return { name: "estudio", cpu: "procesador básico o intermedio", ram: "RAM suficiente para clases y tareas", display: "buena batería y portabilidad" };
  }
  return { name: "trabajo y productividad", cpu: "procesador intermedio o moderno", ram: "RAM suficiente para multitarea", display: "SSD, buena pantalla y batería estable" };
}

function scrollChatToBottom(container) {
  container.scrollTop = container.scrollHeight;
}
