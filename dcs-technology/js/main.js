"use strict";

const WHATSAPP_NUMBER = "573178765432";
const MAX_QUERY_LENGTH = 60;
const MAX_CHAT_LENGTH = 220;
const HERO_AUTOPLAY_MS = 4000;

// Las imagenes externas usadas en el hero son temporales. Antes de publicar comercialmente,
// deben reemplazarse por imagenes propias o imagenes con licencia valida almacenadas en `assets/img/`.
const heroSlides = [
  {
    category: "Celulares premium",
    title: "Tecnologia movil de alto nivel",
    subtitle: "Celulares modernos, potentes y listos para trabajo, estudio y entretenimiento.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
    fallbackImage: "assets/img/hero-celulares.svg",
    alt: "Celulares premium disponibles en DCS Technology"
  },
  {
    category: "Diagnostico tecnico",
    title: "Revision tecnica inteligente",
    subtitle: "Detectamos posibles fallas en pantalla, bateria, carga, software y rendimiento.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    fallbackImage: "assets/img/hero-reparacion.svg",
    alt: "Servicio de diagnostico tecnico para celulares y computadores"
  },
  {
    category: "Computadores",
    title: "Equipos para productividad y gaming",
    subtitle: "Portatiles y computadores para estudio, oficina, diseno y alto rendimiento.",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=80",
    fallbackImage: "assets/img/hero-computadores.svg",
    alt: "Computadores y portatiles para productividad y gaming"
  },
  {
    category: "Accesorios",
    title: "Accesorios que completan tu experiencia",
    subtitle: "Audifonos, cargadores, fundas, cables, soportes y dispositivos inteligentes.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    fallbackImage: "assets/img/hero-accesorios.svg",
    alt: "Accesorios tecnologicos para celulares y computadores"
  },
  {
    category: "Smartwatch",
    title: "Tecnologia conectada a tu ritmo",
    subtitle: "Relojes inteligentes para salud, notificaciones, deporte y productividad.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    fallbackImage: "assets/img/hero-smartwatch.svg",
    alt: "Smartwatch y tecnologia conectada"
  },
  {
    category: "Financiacion",
    title: "Compra tecnologia con facilidad",
    subtitle: "Opciones de financiacion para estrenar equipos sin complicaciones.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
    fallbackImage: "assets/img/hero-financiacion.svg",
    alt: "Financiacion tecnologica para productos DCS Technology"
  }
];

const products = [
  {
    name: "iPhone 15 Pro",
    category: "Celulares",
    price: "$3.999.000",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    fallbackImage: "assets/img/product-phone.svg",
    description: "Equipo premium para fotografia, video y alto rendimiento diario."
  },
  {
    name: "Samsung Galaxy S24 FE",
    category: "Celulares",
    price: "$2.499.000",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
    fallbackImage: "assets/img/product-samsung.svg",
    description: "Gama alta equilibrada para productividad, fotografia y entretenimiento."
  },
  {
    name: "Xiaomi Redmi Note 13",
    category: "Celulares",
    price: "$1.199.000",
    image: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=900&q=80",
    fallbackImage: "assets/img/product-xiaomi.svg",
    description: "Buena autonomia y pantalla amplia para presupuesto controlado."
  },
  {
    name: "Galaxy Tab S9",
    category: "Tablets",
    price: "$1.849.000",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80",
    fallbackImage: "assets/img/product-tablet.svg",
    description: "Tablet para estudio, contenido, dibujo y productividad movil."
  },
  {
    name: "MacBook Air M2",
    category: "Computadores",
    price: "$5.299.000",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
    fallbackImage: "assets/img/product-laptop.svg",
    description: "Portatil liviano para trabajo profesional, estudio y creacion."
  },
  {
    name: "Kit cargador rapido USB-C",
    category: "Accesorios",
    price: "$129.000",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    fallbackImage: "assets/img/product-accessory.svg",
    description: "Cargador y cable de carga rapida para equipos compatibles."
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
  answers: {}
};

const quickActions = [
  "Diagnostico tecnico",
  "Quiero comprar",
  "Cotizar producto",
  "Financiacion",
  "Comparar equipos",
  "Accesorios",
  "Computador ideal",
  "Hablar por WhatsApp"
];

document.addEventListener("DOMContentLoaded", () => {
  setupTemporaryImageFallbacks();
  setupCinematicSurface();
  setupHeroCarousel();
  setupMobileMenu();
  setupSmoothLinks();
  setupProducts();
  setupChatbot();
  setupSwiperSafely();
  setupAnimationsSafely();
});

function sanitizeText(value, maxLength = 160) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[<>`{}[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeForSearch(value) {
  return sanitizeText(value, MAX_QUERY_LENGTH)
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
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
  let progressId = null;
  let isPaused = false;

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
    if (progressId) window.clearTimeout(progressId);
    progressId = null;
    progress.style.transition = "none";
  };

  const startAutoplay = () => {
    if (reduceMotion || timerId || isPaused) return;
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
  progress.style.width = reduceMotion ? "100%" : "0";
  if (reduceMotion) return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      progress.style.transition = `width ${HERO_AUTOPLAY_MS}ms linear`;
      progress.style.width = "100%";
    });
  });
}

function setupMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mainMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menu" : "Abrir menu");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    });
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
    items.forEach((product) => {
      const card = createProductCard(product);
      grid.appendChild(card);
      if (window.cinematicObserver) revealAnimatedElement(card);
    });
    emptyState.hidden = items.length > 0;
  };

  search.addEventListener("input", () => {
    const term = normalizeForSearch(search.value);
    search.value = sanitizeText(search.value, MAX_QUERY_LENGTH);
    const filtered = products.filter((product) => {
      const haystack = normalizeForSearch(`${product.name} ${product.category}`);
      return haystack.includes(term);
    });
    render(filtered);
  });

  render(products);
}

function setupCinematicSurface() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("cinematic-ready");
  if (reduceMotion) return;

  let frameId = null;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let scrollY = window.scrollY;

  const paint = () => {
    document.documentElement.style.setProperty("--spotlight-x", `${pointerX}px`);
    document.documentElement.style.setProperty("--spotlight-y", `${pointerY}px`);
    document.documentElement.style.setProperty("--scroll-depth", `${Math.min(scrollY * 0.055, 90)}px`);
    frameId = null;
  };

  const requestPaint = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(paint);
  };

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    requestPaint();
  }, { passive: true });

  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
    requestPaint();
  }, { passive: true });

  paint();
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
  wa.href = whatsappUrl(`Hola, quiero informacion sobre ${product.name} en DCS Technology.`);
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
  const message = `${product.name}. Categoria: ${product.category}. ${product.description} No muestro precios exactos en el asistente. Un asesor puede validar disponibilidad, garantia y cotizacion personalizada por WhatsApp.`;
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
  appendMessage(messages, text, "bot");
}

function setupSwiperSafely() {
  const container = document.querySelector(".promo-swiper");
  const fallback = document.querySelector(".promo-fallback");
  if (!container) return;

  if (typeof window.Swiper !== "function") {
    container.hidden = true;
    if (fallback) fallback.hidden = false;
    return;
  }

  try {
    new window.Swiper(container, {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 16,
      pagination: {
        el: ".swiper-pagination",
        clickable: true
      },
      breakpoints: {
        760: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    });
  } catch (error) {
    container.hidden = true;
    if (fallback) fallback.hidden = false;
    console.warn("Swiper no se pudo inicializar. Se activo el fallback estatico.", error);
  }
}

function setupAnimationsSafely() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = document.querySelectorAll("[data-animate]");
  if (!elements.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  window.cinematicObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.12
  });

  elements.forEach((element) => window.cinematicObserver.observe(element));
}

function revealAnimatedElement(element) {
  if (!element || !element.matches("[data-animate]")) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !window.cinematicObserver) {
    element.classList.add("is-visible");
    return;
  }
  window.cinematicObserver.observe(element);
}

function setupChatbot() {
  const toggle = document.getElementById("chatbotToggle");
  const panel = document.getElementById("chatbotPanel");
  const close = document.getElementById("chatbotClose");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");
  if (!toggle || !panel || !close || !form || !input || !messages) return;

  appendBotCard(messages, {
    title: "Asistente Inteligente DCS Technology",
    lines: [
      "Ventas, cotizacion, diagnostico preliminar, financiacion y accesorios.",
      "No doy precios exactos ni diagnosticos definitivos; un asesor puede validar la cotizacion."
    ]
  });
  appendQuickActions(messages, quickActions);

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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const clean = sanitizeText(input.value, MAX_CHAT_LENGTH);
    input.value = "";
    if (!clean) {
      appendBotCard(messages, {
        title: "Consulta requerida",
        lines: ["Escribe una consulta sobre tecnologia, diagnostico tecnico, compra, financiacion o accesorios."]
      });
      return;
    }
    handleChatUserText(messages, clean);
  });
}

function handleChatUserText(messages, clean) {
  appendMessage(messages, clean, "user");
  showTyping(messages, () => {
    processChatMessage(messages, clean);
  });
}

function processChatMessage(messages, clean) {
  const text = normalizeChatText(clean);

  if (chatState.flow) {
    continueChatFlow(messages, clean, text);
    return;
  }

  const intent = classifyIntent(text);
  chatState.intent = intent;

  if (intent === "tema ajeno") {
    appendBotCard(messages, {
      title: "Alcance del asistente",
      lines: ["Puedo ayudarte unicamente con productos tecnologicos, diagnostico tecnico, accesorios, financiacion y servicios de DCS Technology."]
    });
    return;
  }

  if (intent === "saludo") {
    appendBotCard(messages, {
      title: "Hola, soy tu asistente DCS",
      lines: ["Elige una opcion rapida o cuentame si necesitas comprar, cotizar, comparar equipos, financiar o revisar una falla."]
    });
    appendQuickActions(messages, quickActions);
    return;
  }

  if (intent === "diagnostico") {
    startDiagnosticFlow(messages, clean);
    return;
  }

  if (intent === "daño por agua") {
    appendWaterDamageResponse(messages, clean);
    return;
  }

  if (intent === "compra" || intent === "cotizacion") {
    startQuoteFlow(messages, clean);
    return;
  }

  if (intent === "lead") {
    startLeadFlow(messages, clean);
    return;
  }

  if (intent === "financiacion") {
    appendFinancingResponse(messages);
    return;
  }

  if (intent === "comparacion") {
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

  if (intent === "garantia") {
    appendBotCard(messages, {
      title: "Garantia",
      lines: [
        "La garantia depende del producto, estado, proveedor y condiciones de compra.",
        "Un asesor puede validar cobertura, tiempos y requisitos antes de cualquier tramite."
      ],
      action: {
        label: "Consultar garantia por WhatsApp",
        message: "Hola, quiero validar una garantia con DCS Technology."
      }
    });
    return;
  }

  appendBotCard(messages, {
    title: "Necesito un poco mas de contexto",
    lines: [
      "Puedo ayudarte con diagnostico preliminar, cotizacion sin precios exactos, financiacion, comparacion, computadores o accesorios.",
      "Tambien puedo generar un mensaje para WhatsApp si necesitas un asesor."
    ]
  });
  appendQuickActions(messages, quickActions);
}

function classifyIntent(text) {
  if (matches(text, ["politica", "futbol", "clima", "religion", "farandula", "noticia", "receta", "cocina"])) return "tema ajeno";
  if (matches(text, ["hola", "buenas", "buen dia", "saludos", "ayuda"])) return "saludo";
  if (matches(text, ["cayo al agua", "se mojo", "humedad", "liquido", "lluvia", "mojado", "agua"])) return "daño por agua";
  if (matches(text, ["quiero que me contacten", "necesito asesor", "agenda revision", "agendar revision", "estoy interesado", "contacten", "hablar por whatsapp", "whatsapp"])) return "lead";
  if (matches(text, ["financiacion", "financiar", "cuotas", "credito", "addi", "sistecredito", "nequi", "daviplata", "pagar por partes"])) return "financiacion";
  if (matches(text, [" vs ", "versus", "comparar", "que es mejor", "iphone o android"])) return "comparacion";
  if (matches(text, ["portatil", "computador", "pc", "laptop", "programar", "diseño", "gaming", "computador lento"])) return "computador";
  if (matches(text, ["cargador", "cable", "audifono", "audifonos", "smartwatch", "adaptador", "funda", "protector", "accesorio"])) return "accesorio";
  if (matches(text, ["comprar", "cotizar", "cotizacion", "quiero un", "quiero una", "producto", "celular", "tablet", "smartwatch"])) return text.includes("cotiz") ? "cotizacion" : "compra";
  if (matches(text, ["diagnostico", "pantalla", "no carga", "no enciende", "bateria", "sobrecalienta", "camara", "sonido", "software", "virus", "apps sospechosas", "falla", "daño", "reparacion"])) return "diagnostico";
  if (matches(text, ["garantia", "garantía"])) return "garantia";
  return "desconocido";
}

function startDiagnosticFlow(messages, initialText) {
  resetChatFlow("diagnostico", "deviceType");
  chatState.issue = detectIssue(normalizeChatText(initialText)) || sanitizeText(initialText, 80);
  appendBotCard(messages, {
    title: "Diagnostico tecnico guiado",
    lines: [
      "Hare preguntas cortas para crear un diagnostico preliminar.",
      "No es un diagnostico definitivo; puede requerir revision tecnica."
    ]
  });
  askFlowQuestion(messages, "Tipo de dispositivo", "Que equipo deseas revisar: celular, tablet, computador o smartwatch?");
}

function startQuoteFlow(messages, initialText) {
  resetChatFlow("cotizacion", "productType");
  chatState.leadProductOrIssue = sanitizeText(initialText, 90);
  appendBotCard(messages, {
    title: "Cotizador inteligente",
    lines: [
      "Te orientare sin mostrar precios exactos.",
      "Al final, un asesor puede validar disponibilidad y cotizacion personalizada."
    ]
  });
  askFlowQuestion(messages, "Tipo de producto", "Que deseas cotizar: celular, computador, tablet, smartwatch, audifonos o accesorios?");
}

function startLeadFlow(messages, initialText) {
  resetChatFlow("lead", "leadName");
  chatState.leadProductOrIssue = sanitizeText(initialText, 90);
  appendBotCard(messages, {
    title: "Contacto con asesor",
    lines: ["No guardo datos en servidor. Solo creare un mensaje prellenado para WhatsApp."]
  });
  askFlowQuestion(messages, "Nombre", "Cual es tu nombre?");
}

function continueChatFlow(messages, clean, text) {
  if (chatState.flow === "diagnostico") {
    continueDiagnosticFlow(messages, clean, text);
    return;
  }
  if (chatState.flow === "cotizacion") {
    continueQuoteFlow(messages, clean, text);
    return;
  }
  if (chatState.flow === "lead") {
    continueLeadFlow(messages, clean);
  }
}

function continueDiagnosticFlow(messages, clean, text) {
  const value = sanitizeText(clean, 90);
  if (chatState.step === "deviceType") {
    chatState.deviceType = value;
    chatState.step = "brand";
    askFlowQuestion(messages, "Marca", "Cual es la marca del equipo?");
    return;
  }
  if (chatState.step === "brand") {
    chatState.brand = value;
    chatState.step = "model";
    askFlowQuestion(messages, "Modelo", "Cual es el modelo aproximado?");
    return;
  }
  if (chatState.step === "model") {
    chatState.model = value;
    chatState.step = "issue";
    askFlowQuestion(messages, "Falla principal", "Cual es la falla principal?");
    return;
  }
  if (chatState.step === "issue") {
    chatState.issue = value;
    chatState.step = "impact";
    askFlowQuestion(messages, "Golpe o humedad", "Tuvo golpe, contacto con agua o humedad?");
    return;
  }
  if (chatState.step === "impact") {
    chatState.answers.impact = value;
    chatState.step = "power";
    askFlowQuestion(messages, "Carga y encendido", "El equipo carga y enciende? Responde con lo que observes.");
    return;
  }
  if (chatState.step === "power") {
    chatState.answers.power = value;
    chatState.step = "time";
    askFlowQuestion(messages, "Tiempo de falla", "Hace cuanto empezo la falla?");
    return;
  }
  if (chatState.step === "time") {
    chatState.answers.time = value;
    finishDiagnosticFlow(messages);
  }
}

function finishDiagnosticFlow(messages) {
  const issueText = normalizeChatText(`${chatState.issue} ${chatState.answers.impact} ${chatState.answers.power}`);
  const causes = getPossibleCauses(issueText);
  const urgency = getUrgency(issueText);
  const recommendation = urgency === "Alto"
    ? "Evita seguir usando el equipo y solicita revision tecnica cuanto antes."
    : "Se recomienda revision tecnica para confirmar causa y cotizacion.";

  appendBotCard(messages, {
    title: "Diagnostico preliminar",
    rows: [
      ["Dispositivo", `${chatState.deviceType || "No indicado"} ${chatState.brand || ""} ${chatState.model || ""}`.trim()],
      ["Falla reportada", chatState.issue || "No indicada"],
      ["Posibles causas", causes.join(", ")],
      ["Nivel de urgencia", urgency],
      ["Recomendacion", recommendation]
    ],
    action: {
      label: "Contactar asesor por WhatsApp",
      message: buildDiagnosticWhatsAppMessage(causes, urgency, recommendation)
    }
  });
  clearChatFlow();
}

function continueQuoteFlow(messages, clean) {
  const value = sanitizeText(clean, 90);
  if (chatState.step === "productType") {
    chatState.deviceType = value;
    chatState.step = "usage";
    askFlowQuestion(messages, "Uso principal", "Uso principal: estudio, trabajo, gaming, redes sociales, fotografia o negocio?");
    return;
  }
  if (chatState.step === "usage") {
    chatState.usage = value;
    chatState.step = "budgetRange";
    askFlowQuestion(messages, "Rango", "Que rango buscas: economico, gama media, gama alta o premium?");
    return;
  }
  if (chatState.step === "budgetRange") {
    chatState.budgetRange = value;
    chatState.step = "preference";
    askFlowQuestion(messages, "Preferencia", "Que priorizas: bateria, camara, rendimiento, almacenamiento, diseño, garantia o financiacion?");
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
    title: "Recomendacion comercial",
    lines: [
      recommendation,
      "No muestro precios exactos por este medio. Un asesor puede validar disponibilidad y cotizacion personalizada."
    ],
    rows: [
      ["Producto", chatState.deviceType || "No indicado"],
      ["Uso", chatState.usage || "No indicado"],
      ["Rango", chatState.budgetRange || "No indicado"],
      ["Prioridad", chatState.preference || "No indicada"]
    ],
    action: {
      label: "Solicitar cotizacion por WhatsApp",
      message: `Hola, quiero una cotizacion en DCS Technology. Producto: ${chatState.deviceType || "por definir"}. Uso: ${chatState.usage || "por definir"}. Rango: ${chatState.budgetRange || "por definir"}. Prioridad: ${chatState.preference || "por definir"}.`
    }
  });
  clearChatFlow();
}

function continueLeadFlow(messages, clean) {
  const value = sanitizeText(clean, 90);
  if (chatState.step === "leadName") {
    chatState.leadName = value;
    chatState.step = "leadProductOrIssue";
    askFlowQuestion(messages, "Producto o falla", "Que producto o falla quieres consultar?");
    return;
  }
  if (chatState.step === "leadProductOrIssue") {
    chatState.leadProductOrIssue = value;
    chatState.step = "leadCity";
    askFlowQuestion(messages, "Ciudad", "En que ciudad estas?");
    return;
  }
  if (chatState.step === "leadCity") {
    chatState.leadCity = value;
    chatState.step = "leadContact";
    askFlowQuestion(messages, "Contacto", "Que medio de contacto prefieres?");
    return;
  }
  if (chatState.step === "leadContact") {
    chatState.leadContact = value;
    appendBotCard(messages, {
      title: "Mensaje listo para WhatsApp",
      lines: ["No guardo estos datos. Solo se usaran para abrir WhatsApp con el mensaje prellenado."],
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
      ["Hacer", "Apagar, retirar funda, secar exterior y llevar a revision tecnica."],
      ["Recomendacion", "Requiere revision tecnica para evaluar posible corrosion o daño interno."]
    ],
    action: {
      label: "Solicitar revision por WhatsApp",
      message: "Hola, mi equipo tuvo contacto con agua o humedad. Necesito revision tecnica en DCS Technology."
    }
  });
}

function appendFinancingResponse(messages) {
  appendBotCard(messages, {
    title: "Financiacion",
    lines: [
      "La financiacion depende del perfil, validacion de cupo, documento requerido y condiciones del producto.",
      "La aprobacion esta sujeta a validacion; no puedo prometer aprobacion ni cuotas exactas."
    ],
    action: {
      label: "Consultar financiacion por WhatsApp",
      message: "Hola, quiero consultar opciones de financiacion en DCS Technology."
    }
  });
}

function appendComparisonResponse(messages, clean) {
  appendBotCard(messages, {
    title: "Comparacion de equipos",
    rows: [
      ["Rendimiento", "Depende del procesador, memoria, optimizacion y uso principal."],
      ["Camara", "Conviene revisar estabilizacion, sensor, video y fotos nocturnas."],
      ["Bateria", "Importan capacidad, eficiencia y velocidad de carga compatible."],
      ["Pantalla", "Evalua brillo, tasa de refresco, resolucion y resistencia."],
      ["Sistema operativo", "iOS suele destacar por ecosistema; Android por variedad y personalizacion."],
      ["Uso recomendado", "La mejor opcion depende de tu prioridad: camara, bateria, gaming, trabajo o garantia."],
      ["Conclusion", "Para una recomendacion exacta segun disponibilidad, solicita asesoria por WhatsApp."]
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
      ["Siguiente paso", "Un asesor puede validar disponibilidad y cotizacion personalizada."]
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

function appendMessage(container, text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  container.appendChild(message);
  scrollChatToBottom(container);
}

function appendBotCard(container, payload) {
  const card = document.createElement("div");
  card.className = "message bot bot-card";

  const title = document.createElement("strong");
  title.className = "bot-card-title";
  title.textContent = payload.title;
  card.appendChild(title);

  if (payload.lines) {
    const list = document.createElement("ul");
    list.className = "bot-card-list";
    payload.lines.forEach((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      list.appendChild(item);
    });
    card.appendChild(list);
  }

  if (payload.rows) {
    const rows = document.createElement("dl");
    rows.className = "bot-card-rows";
    payload.rows.forEach(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = value;
      rows.append(term, detail);
    });
    card.appendChild(rows);
  }

  container.appendChild(card);
  if (payload.action) {
    appendWhatsAppButton(container, payload.action.message, payload.action.label);
  }
  scrollChatToBottom(container);
}

function appendQuickActions(container, actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "quick-replies";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-reply";
    button.textContent = action;
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

function askFlowQuestion(messages, title, question) {
  appendBotCard(messages, {
    title,
    lines: [question]
  });
}

function resetChatFlow(flow, step) {
  clearChatFlow();
  chatState.flow = flow;
  chatState.step = step;
}

function clearChatFlow() {
  chatState.flow = null;
  chatState.step = null;
  chatState.answers = {};
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
  const issues = ["pantalla rota", "no carga", "no enciende", "bateria", "sobrecalentamiento", "humedad", "camara", "sonido", "software", "virus", "computador lento"];
  return issues.find((issue) => text.includes(normalizeChatText(issue))) || null;
}

function getPossibleCauses(text) {
  if (matches(text, ["agua", "humedad", "liquido", "mojo"])) return ["humedad interna", "corrosion", "posible daño en placa"];
  if (matches(text, ["pantalla", "display", "touch", "golpe"])) return ["display afectado", "tactil dañado", "conector interno flojo"];
  if (matches(text, ["no carga", "cargador", "puerto"])) return ["puerto de carga", "cable o cargador", "bateria o flex de carga"];
  if (matches(text, ["no enciende", "no prende"])) return ["bateria descargada o deteriorada", "software", "posible falla de placa"];
  if (matches(text, ["bateria", "descarga"])) return ["bateria degradada", "consumo por apps", "cargador no compatible"];
  if (matches(text, ["camara"])) return ["lente sucio", "modulo de camara", "software de camara"];
  if (matches(text, ["sonido", "audio"])) return ["altavoz", "microfono", "configuracion o humedad"];
  if (matches(text, ["virus", "software", "apps"])) return ["apps sospechosas", "software saturado", "configuracion insegura"];
  if (matches(text, ["lento", "computador"])) return ["almacenamiento lleno", "disco deteriorado", "RAM insuficiente"];
  return ["requiere revision tecnica", "posible falla de software", "posible componente interno"];
}

function getUrgency(text) {
  if (matches(text, ["agua", "humedad", "liquido", "no enciende", "bateria inflada", "humo", "calienta mucho"])) return "Alto";
  if (matches(text, ["pantalla", "no carga", "camara", "sonido", "virus"])) return "Medio";
  return "Bajo";
}

function buildDiagnosticWhatsAppMessage(causes, urgency, recommendation) {
  return `Hola, necesito revision tecnica en DCS Technology. Dispositivo: ${chatState.deviceType || "no indicado"} ${chatState.brand || ""} ${chatState.model || ""}. Falla: ${chatState.issue || "no indicada"}. Posibles causas: ${causes.join(", ")}. Urgencia: ${urgency}. Recomendacion: ${recommendation}`;
}

function buildQuoteRecommendation() {
  const range = normalizeChatText(chatState.budgetRange || "");
  const usage = normalizeChatText(chatState.usage || "");
  const preference = normalizeChatText(chatState.preference || "");
  const level = range.includes("premium") ? "premium" : range.includes("alta") ? "gama alta" : range.includes("media") ? "gama media" : "opcion equilibrada";
  const useText = usage ? ` para ${chatState.usage}` : "";
  const preferenceText = preference ? ` con prioridad en ${chatState.preference}` : "";
  return `Segun tu perfil, te conviene una ${level}${useText}${preferenceText}. La recomendacion final depende de disponibilidad, garantia y condiciones de financiacion.`;
}

function getComputerProfile(text) {
  if (matches(text, ["programar", "programacion"])) {
    return { name: "programacion", cpu: "procesador moderno", ram: "16 GB RAM recomendado", display: "buena pantalla y teclado comodo" };
  }
  if (matches(text, ["diseño", "diseno", "edicion", "render"])) {
    return { name: "diseño", cpu: "procesador potente", ram: "RAM alta recomendada", display: "pantalla de buena calidad y GPU si aplica" };
  }
  if (matches(text, ["gaming", "juegos"])) {
    return { name: "gaming", cpu: "procesador potente", ram: "RAM alta", display: "GPU dedicada y buena ventilacion" };
  }
  if (matches(text, ["estudiar", "estudio"])) {
    return { name: "estudio", cpu: "procesador basico o intermedio", ram: "RAM suficiente para clases y tareas", display: "buena bateria y portabilidad" };
  }
  return { name: "trabajo y productividad", cpu: "procesador intermedio o moderno", ram: "RAM suficiente para multitarea", display: "SSD, buena pantalla y bateria estable" };
}

function scrollChatToBottom(container) {
  container.scrollTop = container.scrollHeight;
}
