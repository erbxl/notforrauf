(function () {
  "use strict";

  const data = window.__BRAND__ || {};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const escHTML = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Single direct wa.me link with the one pre-filled message (briefing
  // "conversion-whatsapp-directo" 2026-09-10) — replaces the old 3-option
  // intermediate page. Lead qualification happens inside the chat, not before it.
  function waHref(lang) {
    const phone = data.whatsappPhone || "";
    const msg = (data.whatsappMessage && data.whatsappMessage[lang]) || "";
    return "https://wa.me/" + phone + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }

  // Which two related services to surface in a service page's "next steps" block.
  const CROSS_MAP = {
    svcNewsletter: ["svcConsultation", "svcDiploma"],
    svcConsultation: ["svcDiploma", "svcSpanish"],
    svcDiploma: ["svcSpanish", "svcTranslations"],
    svcSpanish: ["svcDiploma", "svcTranslations"],
    svcTranslations: ["svcDiploma", "svcConsultation"]
  };
  const SVC_HREF = {
    svcNewsletter: "rassylka.html",
    svcConsultation: "consulta.html",
    svcDiploma: "homologacion.html",
    svcSpanish: "espanol.html",
    svcTranslations: "traducciones.html"
  };

  // Single-language site (Russian only, 2026-09-14) — no more language switcher.
  function getLang() {
    return data.defaultLang || "ru";
  }

  function initials(name) {
    return String(name || "").split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function render(lang) {
    document.documentElement.lang = lang;
    const nav = data.nav && data.nav[lang];

    // Nav (desktop + mobile share the same [data-nav] attributes)
    if (nav) {
      $$("[data-nav]").forEach(el => {
        const key = el.getAttribute("data-nav");
        if (nav[key] != null) el.textContent = nav[key];
      });
    }

    // Hero
    const hero = data.hero && data.hero[lang];
    if (hero) {
      $("[data-hero-kicker]") && ($("[data-hero-kicker]").textContent = hero.kicker);
      $("[data-hero-title]") && ($("[data-hero-title]").textContent = hero.title);
      $("[data-hero-sub]") && ($("[data-hero-sub]").textContent = hero.sub);
      $("[data-hero-cta1]") && ($("[data-hero-cta1]").textContent = hero.cta1);
      $("[data-hero-cta2]") && ($("[data-hero-cta2]").textContent = hero.cta2);
      const pointsTarget = $("[data-hero-points]");
      if (pointsTarget && hero.points) {
        pointsTarget.innerHTML = hero.points.map(p => `<li>${escHTML(p)}</li>`).join("");
      }
    }

    // Trust bar
    const trust = data.trust && data.trust[lang];
    const trustTarget = $("[data-trust]");
    if (trust && trustTarget) {
      trustTarget.innerHTML = trust.map(t => `
        <div>
          <div class="trust-num"><span data-count-to="${escHTML(t.num)}">0</span>${escHTML(t.suffix || "")}</div>
          <div class="trust-label">${escHTML(t.label)}</div>
        </div>
      `).join("");
      safe(bindCountUp, "bindCountUp(trust)");
    }

    // Marquee
    const marquee = data.marquee && data.marquee[lang];
    const marqueeTrack = $("[data-marquee]");
    if (marquee && marqueeTrack) {
      marqueeTrack.innerHTML = marquee.map(c => `<span>${escHTML(c)}</span><span>·</span>`).join("");
      safe(initMarquee, "initMarquee");
    }

    // Founder story
    const founder = data.founder && data.founder[lang];
    if (founder) {
      $("[data-founder-kicker]") && ($("[data-founder-kicker]").textContent = founder.kicker);
      $("[data-founder-year]") && ($("[data-founder-year]").textContent = founder.year);
      $("[data-founder-title]") && ($("[data-founder-title]").textContent = founder.title);
      const pTarget = $("[data-founder-paragraphs]");
      if (pTarget && founder.paragraphs) {
        pTarget.innerHTML = founder.paragraphs.map(p => `<p class="lede" style="max-width:none">${escHTML(p)}</p>`).join("");
      }
      $("[data-founder-quote]") && ($("[data-founder-quote]").textContent = "«" + founder.quote + "»");
      $("[data-founder-quote-caption]") && ($("[data-founder-quote-caption]").textContent = founder.quoteCaption);
    }

    // Why us
    const whyUs = data.whyUs && data.whyUs[lang];
    if (whyUs) {
      $("[data-why-kicker]") && ($("[data-why-kicker]").textContent = whyUs.kicker);
      const target = $("[data-why-items]");
      if (target && whyUs.items) {
        target.innerHTML = whyUs.items.map(i => `
          <article class="card reveal">
            <h3>${escHTML(i.t)}</h3>
            <p class="lede" style="margin-top:.75rem">${escHTML(i.d)}</p>
          </article>
        `).join("");
      }
    }

    // Process
    const process = data.process && data.process[lang];
    if (process) {
      $("[data-process-title]") && ($("[data-process-title]").textContent = process.title);
      $("[data-process-sub]") && ($("[data-process-sub]").textContent = process.sub);
      const target = $("[data-process-steps]");
      if (target) {
        target.innerHTML = process.steps.map(s => `
          <div class="process-step reveal">
            <span class="step-n">${escHTML(s.n)}</span>
            <div>
              <h3>${escHTML(s.t)}</h3>
              <p class="lede" style="margin-top:.4rem">${escHTML(s.d)}</p>
            </div>
          </div>
        `).join("");
      }
    }

    // Documents checklist (reused on the homepage and on the diploma service page)
    const documents = data.documents && data.documents[lang];
    if (documents) {
      $("[data-documents-kicker]") && ($("[data-documents-kicker]").textContent = documents.kicker);
      $("[data-documents-title]") && ($("[data-documents-title]").textContent = documents.title);
      $("[data-documents-sub]") && ($("[data-documents-sub]").textContent = documents.sub);
      const target = $("[data-documents-items]");
      if (target && documents.items) {
        target.innerHTML = documents.items.map(d => `<li class="reveal">${escHTML(d)}</li>`).join("");
      }
    }

    // Services teaser grid (homepage only)
    const servicesSummary = data.servicesSummary && data.servicesSummary[lang];
    if (servicesSummary) {
      $("[data-servicessummary-title]") && ($("[data-servicessummary-title]").textContent = servicesSummary.title);
      $("[data-servicessummary-sub]") && ($("[data-servicessummary-sub]").textContent = servicesSummary.sub);
      const target = $("[data-servicessummary-items]");
      if (target && servicesSummary.items) {
        target.innerHTML = servicesSummary.items.map(s => `
          <a class="card reveal${s.featured ? " is-featured" : ""}" href="${escHTML(s.href)}" style="display:block">
            ${s.badge ? `<span class="badge">${escHTML(s.badge)}</span>` : ""}
            <h3 style="margin-top:${s.badge ? ".75rem" : "0"}">${escHTML(s.name)}</h3>
            <span class="service-price">${escHTML(s.price)}</span>
            <p class="lede" style="margin-top:.75rem">${escHTML(s.d)}</p>
          </a>
        `).join("");
      }
    }

    // Services overview page header
    const servicesPage = data.servicesPage && data.servicesPage[lang];
    if (servicesPage) {
      $("[data-servicespage-kicker]") && ($("[data-servicespage-kicker]").textContent = servicesPage.kicker);
      $("[data-servicespage-title]") && ($("[data-servicespage-title]").textContent = servicesPage.title);
      $("[data-servicespage-sub]") && ($("[data-servicespage-sub]").textContent = servicesPage.sub);
    }

    // Services comparison table (servicios/index.html)
    const servicesCompare = data.servicesCompare && data.servicesCompare[lang];
    const compareTarget = $("[data-servicescompare-items]");
    if (servicesCompare && compareTarget) {
      const head = (servicesPage && servicesPage.compareHead) || ["", "", ""];
      compareTarget.innerHTML = servicesCompare.map(s => `
        <a class="compare-row reveal${s.featured ? " is-featured" : ""}" href="${escHTML(s.href.replace(/^servicios\//, ""))}">
          <strong>${escHTML(s.name)}</strong>
          <span class="compare-label">${escHTML(head[1] || "")}</span>
          <span>${escHTML(s.forWhom)}</span>
          <span class="compare-label">${escHTML(head[2] || "")}</span>
          <span class="compare-price">${escHTML(s.price)}</span>
        </a>
      `).join("");
    }

    // "Where to start" 3-step teaser (homepage)
    const startSteps = data.startSteps && data.startSteps[lang];
    if (startSteps) {
      $("[data-startsteps-kicker]") && ($("[data-startsteps-kicker]").textContent = startSteps.kicker);
      $("[data-startsteps-title]") && ($("[data-startsteps-title]").textContent = startSteps.title);
      $("[data-startsteps-sub]") && ($("[data-startsteps-sub]").textContent = startSteps.sub);
      const target = $("[data-startsteps-items]");
      if (target && startSteps.steps) {
        target.innerHTML = startSteps.steps.map(s => `
          <div class="process-step reveal">
            <span class="step-n">${escHTML(s.n)}</span>
            <div><h3>${escHTML(s.t)}</h3><p class="lede" style="margin-top:.4rem">${escHTML(s.d)}</p></div>
          </div>
        `).join("");
      }
    }

    // Proof / stats block (home + sobre-nosotros)
    const proof = data.proof && data.proof[lang];
    if (proof) {
      $("[data-proof-title]") && ($("[data-proof-title]").textContent = proof.title);
      const target = $("[data-proof-items]");
      if (target && proof.items) {
        target.innerHTML = proof.items.map(p => `
          <div>
            <div class="stat-num"><span data-count-to="${escHTML(p.num)}">0</span>${escHTML(p.suffix || "")}</div>
            <div class="stat-label">${escHTML(p.label)}</div>
          </div>
        `).join("");
        safe(bindCountUp, "bindCountUp(proof)");
      }
    }

    // Sobre nosotros — intro + people cards (home teaser + full page)
    const sobreNosotros = data.sobreNosotros && data.sobreNosotros[lang];
    if (sobreNosotros) {
      $("[data-sobre-kicker]") && ($("[data-sobre-kicker]").textContent = sobreNosotros.kicker);
      $("[data-sobre-title]") && ($("[data-sobre-title]").textContent = sobreNosotros.title);
      $("[data-sobre-sub]") && ($("[data-sobre-sub]").textContent = sobreNosotros.sub);
    }
    const people = data.people && data.people[lang];
    const peopleTarget = $("[data-people-items]");
    if (people && peopleTarget) {
      peopleTarget.innerHTML = people.map(p => `
        <article class="card person-card reveal">
          <div class="person-avatar" aria-hidden="true">${escHTML(initials(p.name))}</div>
          <h3>${escHTML(p.name)}</h3>
          <p class="person-role">${escHTML(p.role)}</p>
          <p class="person-d">${escHTML(p.d)}</p>
        </article>
      `).join("");
    }

    // Cómo funciona page
    const cf = data.comoFunciona && data.comoFunciona[lang];
    if (cf) {
      $("[data-cf-kicker]") && ($("[data-cf-kicker]").textContent = cf.kicker);
      $("[data-cf-title]") && ($("[data-cf-title]").textContent = cf.title);
      $("[data-cf-sub]") && ($("[data-cf-sub]").textContent = cf.sub);
      $("[data-cf-forwhom-title]") && ($("[data-cf-forwhom-title]").textContent = cf.forWhomTitle);
      const forWhomTarget = $("[data-cf-forwhom]");
      if (forWhomTarget && cf.forWhom) forWhomTarget.innerHTML = cf.forWhom.map(i => `<li class="reveal">${escHTML(i)}</li>`).join("");
      $("[data-cf-steps-title]") && ($("[data-cf-steps-title]").textContent = cf.stepsTitle);
      const stepsTarget = $("[data-cf-steps]");
      if (stepsTarget && cf.fullSteps) {
        stepsTarget.innerHTML = cf.fullSteps.map(s => `
          <div class="process-step reveal">
            <span class="step-n">${escHTML(s.n)}</span>
            <div><h3>${escHTML(s.t)}</h3><p class="lede" style="margin-top:.4rem">${escHTML(s.d)}</p></div>
          </div>
        `).join("");
      }
      $("[data-cf-wedo-title]") && ($("[data-cf-wedo-title]").textContent = cf.weDoTitle);
      const weDoTarget = $("[data-cf-wedo]");
      if (weDoTarget && cf.weDo) weDoTarget.innerHTML = cf.weDo.map(i => `<li class="reveal">${escHTML(i)}</li>`).join("");
      $("[data-cf-youdo-title]") && ($("[data-cf-youdo-title]").textContent = cf.youDoTitle);
      const youDoTarget = $("[data-cf-youdo]");
      if (youDoTarget && cf.youDo) youDoTarget.innerHTML = cf.youDo.map(i => `<li class="reveal">${escHTML(i)}</li>`).join("");
      $("[data-cf-timeline-title]") && ($("[data-cf-timeline-title]").textContent = cf.timelineTitle);
      $("[data-cf-timeline]") && ($("[data-cf-timeline]").textContent = cf.timeline);
      $("[data-cf-faq-note]") && ($("[data-cf-faq-note]").textContent = cf.faqNote);
      $("[data-cf-faq-cta]") && ($("[data-cf-faq-cta]").textContent = cf.faqCta);
    }

    // FAQ teaser (homepage) — first 5 questions, no categories
    const faqHome = data.faqHome && data.faqHome[lang];
    const faqPageDataForHome = data.faqPage && data.faqPage[lang];
    if (faqHome) {
      $("[data-faqhome-kicker]") && ($("[data-faqhome-kicker]").textContent = faqHome.kicker);
      $("[data-faqhome-title]") && ($("[data-faqhome-title]").textContent = faqHome.title);
      $("[data-faqhome-seeall]") && ($("[data-faqhome-seeall]").textContent = faqHome.seeAll);
      const target = $("[data-faqhome-items]");
      if (target && faqPageDataForHome && faqPageDataForHome.items) {
        target.innerHTML = faqPageDataForHome.items.slice(0, 5).map((item, idx) => `
          <details class="accordion-item reveal"${idx === 0 ? " open" : ""}>
            <summary aria-expanded="${idx === 0 ? "true" : "false"}">${escHTML(item.q)}</summary>
            <div class="accordion-body">${escHTML(item.a)}</div>
          </details>
        `).join("");
      }
    }

    // Full FAQ page
    const faqPage = data.faqPage && data.faqPage[lang];
    if (faqPage) {
      $("[data-faq-kicker]") && ($("[data-faq-kicker]").textContent = faqPage.kicker);
      $("[data-faq-title]") && ($("[data-faq-title]").textContent = faqPage.title);
      $("[data-faq-sub]") && ($("[data-faq-sub]").textContent = faqPage.sub);
      const catTarget = $("[data-faq-categories]");
      if (catTarget && faqPage.categories) {
        catTarget.innerHTML = faqPage.categories.map((c, idx) => `
          <button type="button" data-cat="${escHTML(c)}" aria-pressed="${idx === 0 ? "true" : "false"}">${escHTML(c)}</button>
        `).join("");
      }
      const itemsTarget = $("[data-faq-items]");
      if (itemsTarget && faqPage.items) {
        const allLabel = faqPage.categories && faqPage.categories[0];
        itemsTarget.innerHTML = faqPage.items.map(item => `
          <details class="accordion-item reveal" data-cat="${escHTML(item.cat)}">
            <summary aria-expanded="false">${escHTML(item.q)}</summary>
            <div class="accordion-body">${escHTML(item.a)}</div>
          </details>
        `).join("");
      }
      safe(initFaqFilter, "initFaqFilter");
    }
    safe(initAccordions, "initAccordions");

    // Resources hub (recursos/index.html)
    const resourcesHub = data.resourcesHub && data.resourcesHub[lang];
    if (resourcesHub) {
      $("[data-resourceshub-kicker]") && ($("[data-resourceshub-kicker]").textContent = resourcesHub.kicker);
      $("[data-resourceshub-title]") && ($("[data-resourceshub-title]").textContent = resourcesHub.title);
      $("[data-resourceshub-sub]") && ($("[data-resourceshub-sub]").textContent = resourcesHub.sub);
      const target = $("[data-resourceshub-items]");
      if (target && resourcesHub.cards) {
        target.innerHTML = resourcesHub.cards.map(c => `
          <a class="card resource-card reveal" href="${escHTML(c.href.replace(/^recursos\//, ""))}">
            <h3>${escHTML(c.title)}</h3>
            <p class="lede" style="margin-top:.75rem">${escHTML(c.d)}</p>
          </a>
        `).join("");
      }
    }

    // Individual resource article — <body data-article="mir"> etc.
    const articleKey = document.body.getAttribute("data-article");
    if (articleKey && data.resourceArticles && data.resourceArticles[articleKey]) {
      const art = data.resourceArticles[articleKey][lang];
      if (art) {
        $("[data-article-kicker]") && ($("[data-article-kicker]").textContent = art.kicker);
        $("[data-article-title]") && ($("[data-article-title]").textContent = art.title);
        $("[data-article-updated]") && ($("[data-article-updated]").textContent = art.updated);
        $("[data-article-lede]") && ($("[data-article-lede]").textContent = art.lede);
        const bodyTarget = $("[data-article-body]");
        if (bodyTarget && art.sections) {
          bodyTarget.innerHTML = art.sections.map(sec => `
            <h2>${escHTML(sec.h)}</h2>
            <ul>${sec.items.map(i => `<li>${escHTML(i)}</li>`).join("")}</ul>
          `).join("");
        }
        if (art.calloutTitle || art.callout) {
          const calloutTarget = $("[data-article-callout]");
          if (calloutTarget) {
            calloutTarget.innerHTML = `${art.calloutTitle ? `<p style="font-weight:600;color:var(--ink)">${escHTML(art.calloutTitle)}</p>` : ""}<p>${escHTML(art.callout || "")}</p>`;
          }
        }
        if (art.contactNote) { $("[data-article-contact]") && ($("[data-article-contact]").textContent = art.contactNote); }
        const crossTarget = $("[data-article-cross]");
        if (crossTarget && art.crossHref) {
          crossTarget.innerHTML = `<a class="btn btn-ghost" href="${escHTML(art.crossHref)}">${escHTML(art.crossLabel || "")}</a>`;
        }
      }
    }

    // 404 page
    const notFound = data.notFound && data.notFound[lang];
    if (notFound) {
      $("[data-404-title]") && ($("[data-404-title]").textContent = notFound.title);
      $("[data-404-body]") && ($("[data-404-body]").textContent = notFound.body);
      $("[data-404-cta1]") && ($("[data-404-cta1]").textContent = notFound.cta1);
      $("[data-404-cta2]") && ($("[data-404-cta2]").textContent = notFound.cta2);
    }

    // Myths vs reality
    const myths = data.myths && data.myths[lang];
    if (myths) {
      $("[data-myths-kicker]") && ($("[data-myths-kicker]").textContent = myths.kicker);
      $("[data-myths-title]") && ($("[data-myths-title]").textContent = myths.title);
      const target = $("[data-myths-items]");
      if (target && myths.items) {
        target.innerHTML = myths.items.map(m => `
          <article class="card myth-card reveal">
            <p class="myth-label">${escHTML(m.myth)}</p>
            <p class="fact-label">${escHTML(m.fact)}</p>
          </article>
        `).join("");
      }
      if (myths.diy) {
        $("[data-diy-title]") && ($("[data-diy-title]").textContent = myths.diy.title);
        $("[data-diy-body]") && ($("[data-diy-body]").textContent = myths.diy.body);
        $("[data-diy-cta]") && ($("[data-diy-cta]").textContent = myths.diy.cta);
      }
    }

    // Testimonials
    const testi = data.testimonials && data.testimonials[lang];
    const testiTarget = $("[data-testimonials]");
    if (testi && testiTarget) {
      testiTarget.innerHTML = testi.map(t => `
        <article class="card reveal">
          <p class="testi-quote">&ldquo;${escHTML(t.quote)}&rdquo;</p>
          <p class="testi-name">${escHTML(t.name)}</p>
        </article>
      `).join("");
    }

    // Landing hero (short conversion landing — briefing 2026-09-10)
    const landingHero = data.landingHero && data.landingHero[lang];
    if (landingHero) {
      $("[data-landinghero-kicker]") && ($("[data-landinghero-kicker]").textContent = landingHero.kicker);
      $("[data-landinghero-title]") && ($("[data-landinghero-title]").textContent = landingHero.title);
      $("[data-landinghero-sub]") && ($("[data-landinghero-sub]").textContent = landingHero.sub);
    }

    // Landing motivation — single bridge sentence (briefing "conversion-whatsapp-directo"
    // 2026-09-10, collapses the old 4-question identification block)
    const landingMotivation = data.landingMotivation && data.landingMotivation[lang];
    if (landingMotivation) { $("[data-landingmotivation-text]") && ($("[data-landingmotivation-text]").textContent = landingMotivation); }

    // Landing bridge — one sentence naming the mechanism (degree recognition) right before the services cards
    const landingBridge = data.landingBridge && data.landingBridge[lang];
    if (landingBridge) { $("[data-landingbridge-text]") && ($("[data-landingbridge-text]").textContent = landingBridge); }

    // Landing services (2 featured cards, no individual buttons — the fixed WhatsApp CTA is the only action)
    const landingServices = data.landingServices && data.landingServices[lang];
    if (landingServices) {
      $("[data-landingservices-kicker]") && ($("[data-landingservices-kicker]").textContent = landingServices.kicker);
      const target = $("[data-landingservices-items]");
      if (target && landingServices.items) {
        target.innerHTML = landingServices.items.map(s => `
          <article class="card reveal">
            <h3>${escHTML(s.title)}</h3>
            ${s.price ? `
              <span class="service-price">
                ${s.oldPrice ? `<span class="service-price-old">${escHTML(s.oldPrice)}</span>` : ""}
                <span class="service-price-current">${escHTML(s.price)}</span>
              </span>
            ` : ""}
            <p class="lede" style="margin-top:.75rem;max-width:none">${escHTML(s.d)}</p>
          </article>
        `).join("");
      }
    }

    // Landing "clients" section heading (reuses the same data-testimonials target/renderer as the old homepage)
    const landingClients = data.landingClients && data.landingClients[lang];
    if (landingClients) {
      $("[data-landingclients-kicker]") && ($("[data-landingclients-kicker]").textContent = landingClients.kicker);
      $("[data-landingclients-title]") && ($("[data-landingclients-title]").textContent = landingClients.title);
    }

    // Fixed WhatsApp bar label + direct wa.me link (no more intermediate
    // whatsapp.html page — briefing "conversion-whatsapp-directo" 2026-09-10).
    // Every element marked [data-wa-link] (fixed bar CTA + closing block CTA)
    // gets the same direct link, language-aware so it updates on switch.
    const waBar = data.whatsappBar && data.whatsappBar[lang];
    if (waBar) { $("[data-wa-bar-label]") && ($("[data-wa-bar-label]").textContent = waBar); }
    const waLink = waHref(lang);
    $$("[data-wa-link]").forEach(el => { el.href = waLink; });

    // Landing closing block ("Bloque final") — short re-statement of the CTA
    // right before the footer (briefing "conversion-whatsapp-directo" 2026-09-10)
    const landingFinal = data.landingFinal && data.landingFinal[lang];
    if (landingFinal) {
      $("[data-landingfinal-title]") && ($("[data-landingfinal-title]").textContent = landingFinal.title);
      $("[data-landingfinal-sub]") && ($("[data-landingfinal-sub]").textContent = landingFinal.sub);
      $("[data-landingfinal-button]") && ($("[data-landingfinal-button]").textContent = landingFinal.button);
    }

    // Team
    const team = data.team && data.team[lang];
    if (team) {
      $("[data-team-title]") && ($("[data-team-title]").textContent = team.title);
      $("[data-team-d]") && ($("[data-team-d]").textContent = team.d);
    }

    // Final CTA
    const cta = data.cta && data.cta[lang];
    if (cta) {
      $("[data-cta-title]") && ($("[data-cta-title]").textContent = cta.title);
      $("[data-cta-sub]") && ($("[data-cta-sub]").textContent = cta.sub);
      $("[data-cta-button]") && ($("[data-cta-button]").textContent = cta.button);
    }

    // Contact page
    const contactPage = data.contactPage && data.contactPage[lang];
    if (contactPage) {
      $("[data-contactpage-kicker]") && ($("[data-contactpage-kicker]").textContent = contactPage.kicker);
      $("[data-contactpage-title]") && ($("[data-contactpage-title]").textContent = contactPage.title);
      $("[data-contactpage-sub]") && ($("[data-contactpage-sub]").textContent = contactPage.sub);
      const cardsTarget = $("[data-contactpage-cards]");
      if (cardsTarget && contactPage.cards) {
        const c = data.contact || {};
        const waLabel = (data.whatsappBar && data.whatsappBar[lang]) || "WhatsApp";
        cardsTarget.innerHTML = contactPage.cards.map((card, idx) => {
          const phone = idx === 0 ? c.phone1 : c.phone2;
          // Email dropped as a contact CTA (2026-09-10) — it's friction people skip.
          // WhatsApp is the single low-friction channel now; phone stays as a fallback.
          return `
            <article class="card contact-card reveal">
              <h3>${escHTML(card.name)}</h3>
              <p class="contact-role">${escHTML(card.role)}</p>
              <div class="contact-links">
                <a href="${escHTML(waHref(lang))}" target="_blank" rel="noopener noreferrer">${escHTML(waLabel)}</a>
                ${phone ? `<a href="tel:${escHTML(phone)}">${escHTML(phone)}</a>` : ""}
              </div>
            </article>
          `;
        }).join("");
      }
      $("[data-contactpage-payment-title]") && ($("[data-contactpage-payment-title]").textContent = contactPage.paymentTitle);
      const payTarget = $("[data-contactpage-payment]");
      if (payTarget && contactPage.paymentMethods) {
        payTarget.innerHTML = contactPage.paymentMethods.map(p => `<span>${escHTML(p)}</span>`).join("");
      }
    }

    // Service detail page — <body data-service="svcDiploma"> etc.
    const svcKey = document.body.getAttribute("data-service");
    if (svcKey && data[svcKey]) {
      const svc = data[svcKey][lang];
      if (svc) {
        $$("[data-svc-kicker]").forEach(el => { el.textContent = svc.kicker; });
        $("[data-svc-title]") && ($("[data-svc-title]").textContent = svc.title);
        $("[data-svc-lede]") && ($("[data-svc-lede]").textContent = svc.lede);
        $("[data-svc-price-num]") && ($("[data-svc-price-num]").textContent = svc.priceNum);
        $("[data-svc-price-note]") && ($("[data-svc-price-note]").textContent = svc.priceNote);

        const inc = $("[data-svc-included]");
        if (inc && svc.included) {
          inc.innerHTML = svc.included.map(i => `<li class="reveal">${escHTML(i)}</li>`).join("");
        }

        if (svc.body) { $("[data-svc-body]") && ($("[data-svc-body]").textContent = svc.body); }

        const hiwTitle = $("[data-svc-howitworks-title]");
        if (svc.howItWorksTitle && hiwTitle) hiwTitle.textContent = svc.howItWorksTitle;
        const hiw = $("[data-svc-howitworks]");
        if (hiw && svc.howItWorks) {
          hiw.innerHTML = svc.howItWorks.map((s, idx) => `
            <div class="process-step reveal">
              <span class="step-n">${String(idx + 1).padStart(2, "0")}</span>
              <div><p class="lede" style="margin-top:0">${escHTML(s)}</p></div>
            </div>
          `).join("");
        }

        if (svc.realisticTitle) { $("[data-svc-realistic-title]") && ($("[data-svc-realistic-title]").textContent = svc.realisticTitle); }
        if (svc.realistic) { $("[data-svc-realistic]") && ($("[data-svc-realistic]").textContent = svc.realistic); }

        if (svc.paymentTitle) { $("[data-svc-payment-title]") && ($("[data-svc-payment-title]").textContent = svc.paymentTitle); }
        const pay = $("[data-svc-payment]");
        if (pay && svc.payment) {
          pay.innerHTML = svc.payment.map(p => `<span>${escHTML(p)}</span>`).join("");
        }

        if (svc.contactNote) { $("[data-svc-contact-note]") && ($("[data-svc-contact-note]").textContent = svc.contactNote); }

        if (svc.signupNote) { $("[data-svc-signup-note]") && ($("[data-svc-signup-note]").textContent = svc.signupNote); }
        const signup = $("[data-svc-signup-link]");
        if (signup && svc.signupLabel) {
          signup.textContent = svc.signupLabel;
          if (svc.signupHref) signup.href = svc.signupHref;
        }

        if (svc.crossTitle) { $("[data-svc-cross-title]") && ($("[data-svc-cross-title]").textContent = svc.crossTitle); }
        const crossTarget = $("[data-svc-cross-links]");
        if (crossTarget) {
          const related = (CROSS_MAP[svcKey] || []).map(k => {
            const label = nav && nav[k];
            const href = SVC_HREF[k];
            if (!label || !href) return "";
            return `<a href="${escHTML(href)}">${escHTML(label)}</a>`;
          }).join("");
          crossTarget.innerHTML = related;
        }
      }
    }

    // Footer
    const footer = data.footer && data.footer[lang];
    if (footer) {
      $("[data-footer-rights]") && ($("[data-footer-rights]").textContent = "Esparus — " + footer.rights);
      $("[data-footer-contact-label]") && ($("[data-footer-contact-label]").textContent = footer.contactLabel);
      $("[data-footer-resources-label]") && ($("[data-footer-resources-label]").textContent = footer.resourcesLabel);
      $("[data-footer-social-label]") && ($("[data-footer-social-label]").textContent = footer.socialLabel);
      $("[data-footer-services-label]") && ($("[data-footer-services-label]").textContent = footer.servicesLabel);
      $("[data-footer-about]") && ($("[data-footer-about]").textContent = footer.about);
    }
    const resourcesTitle = data.resourcesTitle && data.resourcesTitle[lang];
    if (resourcesTitle) { $("[data-resources-title]") && ($("[data-resources-title]").textContent = resourcesTitle); }
    const resources = data.resources && data.resources[lang];
    const resTarget = $("[data-resources-items]");
    if (resources && resTarget) {
      resTarget.innerHTML = resources.map(r => `<li><a href="${escHTML(r.href)}" target="_blank" rel="noopener noreferrer">${escHTML(r.label)}</a></li>`).join("");
    }
    const social = data.social;
    const socialTarget = $("[data-social-block]");
    if (social && socialTarget && socialTarget.children.length === 0) {
      socialTarget.innerHTML = `
        <a href="${escHTML(social.vk)}" target="_blank" rel="noopener noreferrer">VK</a>
        <a href="${escHTML(social.youtube)}" target="_blank" rel="noopener noreferrer">YouTube</a>
        <a href="${escHTML(social.blog)}" target="_blank" rel="noopener noreferrer">Blog</a>
      `;
    }

    // Footer contact block
    safe(() => mountContact(lang), "mountContact(refresh)");

    if (window.gsap) {
      safe(initReveals, "initReveals(refresh)");
    } else {
      $$(".reveal").forEach(el => el.classList.add("is-visible"));
    }
    safe(initTilt, "initTilt(refresh)");
    safe(bindLandingFunnel, "bindLandingFunnel(refresh)");
  }

  // Footer "contact" block. Email dropped as a CTA (2026-09-10) — it's
  // friction people skip; WhatsApp replaces it as the easy option, phone
  // numbers stay as a fallback.
  function mountContact(lang) {
    const c = data.contact || {};
    const target = $("[data-contact-block]");
    if (!target) return;
    const waLabel = (data.whatsappBar && data.whatsappBar[lang]) || "WhatsApp";
    // Direct wa.me link (no more whatsapp.html intermediate page — briefing
    // "conversion-whatsapp-directo" 2026-09-10). This one function is shared
    // by every page's footer, so fixing it here fixes the link site-wide.
    target.innerHTML = `
      <a href="${escHTML(waHref(lang))}" target="_blank" rel="noopener noreferrer">${escHTML(waLabel)}</a>
      <a href="tel:${escHTML(c.phone1 || "")}">${escHTML(c.phone1 || "")}</a>
      <a href="tel:${escHTML(c.phone2 || "")}">${escHTML(c.phone2 || "")}</a>
    `;
  }

  function initNav() {
    const nav = $(".site-nav");
    if (!nav) return;
    window.addEventListener("scroll", () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    }, { passive: true });
  }

  function initMobileNav() {
    const toggle = $(".nav-toggle");
    const panel = $(".mobile-nav");
    if (!toggle || !panel || toggle.dataset.mobileNavBound === "1") return;
    toggle.dataset.mobileNavBound = "1";

    const close = () => { toggle.setAttribute("aria-expanded", "false"); panel.setAttribute("data-open", "false"); };
    const open = () => { toggle.setAttribute("aria-expanded", "true"); panel.setAttribute("data-open", "true"); };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? close() : open();
    });
    $$("a", panel).forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  // Keep a <details> accordion's aria-expanded on its <summary> in sync,
  // and make sure opening one item doesn't leave stale state behind.
  function initAccordions() {
    $$(".accordion-item").forEach(item => {
      if (item.dataset.accordionBound === "1") return;
      item.dataset.accordionBound = "1";
      const summary = item.querySelector("summary");
      if (!summary) return;
      summary.setAttribute("aria-expanded", item.open ? "true" : "false");
      item.addEventListener("toggle", () => {
        summary.setAttribute("aria-expanded", item.open ? "true" : "false");
      });
    });
  }

  // FAQ category filter buttons (faq.html only — safe no-op elsewhere).
  function initFaqFilter() {
    const buttons = $$("[data-faq-categories] button");
    const items = $$("[data-faq-items] .accordion-item");
    if (!buttons.length || !items.length) return;
    buttons.forEach(btn => {
      if (btn.dataset.faqFilterBound === "1") return;
      btn.dataset.faqFilterBound = "1";
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;
        const isAll = buttons[0] && buttons[0].dataset.cat === cat;
        buttons.forEach(b => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
        items.forEach(item => {
          const show = isAll || item.dataset.cat === cat;
          item.hidden = !show;
        });
      });
    });
  }

  function initReveals() {
    const items = $$(".reveal");
    if (!items.length) return;

    if (!window.gsap || !window.ScrollTrigger) {
      items.forEach(el => el.classList.add("is-visible"));
      return;
    }

    items.forEach(el => {
      if (el.dataset.revealed === "1") return;
      el.dataset.revealed = "1";
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // 6s safety net: reveal anything still hidden (e.g. observer missed it)
    setTimeout(() => items.forEach(el => el.classList.add("is-visible")), 6000);
  }

  function bindCountUp(scope) {
    const els = $$("[data-count-to]", scope || document);
    els.forEach(el => {
      if (el.dataset.countBound === "1") return;
      el.dataset.countBound = "1";
      const target = parseFloat(el.dataset.countTo);
      if (!isFinite(target)) return;

      const trigger = () => {
        if (window.gsap) {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.4, ease: "power2.out",
            onUpdate: () => { el.textContent = Math.round(obj.v); }
          });
        } else {
          el.textContent = target;
        }
      };

      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { trigger(); io.unobserve(e.target); }
        });
      }, { threshold: 0.2 });
      io.observe(el);

      // Safety net: if already in view at bind time (e.g. hero on load), fire soon after.
      setTimeout(() => {
        if (el.dataset.countBound === "1" && el.textContent === "0" &&
            el.getBoundingClientRect().top < window.innerHeight) {
          trigger();
        }
      }, 1200);
    });
  }

  function initMarquee() {
    if (!window.gsap) return;
    const track = $("[data-marquee]");
    if (!track || track.dataset.marqueeBound === "1") return;
    track.dataset.marqueeBound = "1";
    const clone = track.cloneNode(true);
    clone.removeAttribute("data-marquee");
    track.parentNode.appendChild(clone);
    const distance = track.scrollWidth;
    if (!distance) return;
    const speed = 45; // px/sec
    gsap.to([track, clone], {
      x: -distance, duration: distance / speed, ease: "none", repeat: -1,
      modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % distance) },
    });
  }

  function initCursor() {
    if (!fineHover || reduced) return;
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);
    let ready = false;
    window.addEventListener("mousemove", e => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      if (!ready) { ready = true; cursor.classList.add("is-ready"); }
    }, { passive: true });
  }

  function initTilt() {
    if (!fineHover || reduced) return;
    $$(".card").forEach(card => {
      if (card.dataset.tiltBound === "1") return;
      card.dataset.tiltBound = "1";
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  // ---- Landing / WhatsApp funnel tracking (briefing 2026-09-10, section 19) ----
  // No-op scaffold until a real GA4/Meta Pixel snippet is added: pushes to
  // window.dataLayer when present, and always fires a DOM CustomEvent so any
  // future analytics snippet can hook in without touching this file again.
  function captureUTMs() {
    const params = new URLSearchParams(location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const utm = {};
    let has = false;
    keys.forEach(k => { const v = params.get(k); if (v) { utm[k] = v; has = true; } });
    if (has) localStorage.setItem("esparus_utm", JSON.stringify(utm));
  }

  function getUTMs() {
    try { return JSON.parse(localStorage.getItem("esparus_utm") || "{}"); } catch (_) { return {}; }
  }

  function trackEvent(name, detail) {
    const payload = Object.assign({ event: name }, getUTMs(), detail || {});
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    document.dispatchEvent(new CustomEvent("esparus:" + name, { detail: payload }));
  }

  // Fires once per page load (called from boot only — never from render/refresh).
  function trackLandingPageView() {
    if (!document.body.classList.contains("landing-page")) return;
    trackEvent("landing_view");
  }

  // (Re)binds click tracking on every direct wa.me link (fixed bar CTA +
  // closing block CTA). Safe to call repeatedly (e.g. after a language
  // switch) since already-bound elements are skipped via the waBound flag.
  // No more wa-option tracking — the intermediate page (whatsapp.html) was
  // removed per briefing "conversion-whatsapp-directo" (2026-09-10).
  function bindLandingFunnel() {
    if (!document.body.classList.contains("landing-page")) return;
    $$("[data-wa-link]").forEach(el => {
      if (el.dataset.waBound === "1") return;
      el.dataset.waBound = "1";
      const kind = el.dataset.waLink === "final" ? "wa_final_click" : "wa_bar_click";
      el.addEventListener("click", () => trackEvent(kind));
    });
  }

  function boot() {
    safe(captureUTMs, "captureUTMs");
    safe(() => render(getLang()), "render");
    safe(initNav, "initNav");
    safe(initMobileNav, "initMobileNav");
    safe(initCursor, "initCursor");
    safe(trackLandingPageView, "trackLandingPageView");
    safe(bindLandingFunnel, "bindLandingFunnel");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initReveals, "initReveals");
      safe(initTilt, "initTilt");
      safe(initMarquee, "initMarquee");
    } else {
      $$(".reveal").forEach(el => el.classList.add("is-visible"));
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
