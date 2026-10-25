/* =========================================================
   cero.ads — interactions
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const DISCORD = 'cero.ads';

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToTarget = (target) => {
    if (lenis) return lenis.scrollTo(target, { duration: 1.6 });
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    scrollToTarget(target);
  }));

  /* ---------- text splitting ---------- */
  function splitWords(el, wrap = true) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const inner = document.createElement('span');
            inner.className = wrap ? 'wi' : 'sw';
            inner.textContent = part;
            if (wrap) {
              const outer = document.createElement('span');
              outer.className = 'w';
              outer.appendChild(inner);
              frag.appendChild(outer);
            } else frag.appendChild(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
    };
    walk(el);
    return $$(wrap ? '.wi' : '.sw', el);
  }

  function splitChars(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...child.textContent.trim()].forEach((ch) => {
            const m = document.createElement('span'); m.className = 'cm';
            const c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
            m.appendChild(c); frag.appendChild(m);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    return $$('.c', el);
  }

  /* ---------- toast + discord ---------- */
  const toast = $('.toast');
  let toastTimer;
  function showToast(html) {
    toast.innerHTML = html;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3400);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }
  $$('[data-discord]').forEach((btn) => btn.addEventListener('click', async () => {
    const ok = await copyText(DISCORD);
    showToast(`<svg viewBox="0 0 24 24"><use href="#discord"/></svg><span>${ok ? 'Copied — add' : 'Add'} <b>${DISCORD}</b> on Discord</span>`);
  }));

  /* ---------- nav ---------- */
  const nav = $('.nav');
  const navBar = $('.nav__progress i');
  let lastY = 0;
  let modalOpen = false;
  function onScroll(y) {
    nav.classList.toggle('is-scrolled', y > 40);
    if (Math.abs(y - lastY) > 4) {
      nav.classList.toggle('is-hidden', y > lastY && y > 500 && !modalOpen);
      lastY = y;
    }
    const max = document.documentElement.scrollHeight - innerHeight;
    navBar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  }
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  /* ---------- cursor ---------- */
  function setupCursor() {
    if (!finePointer || reduce) return;
    document.documentElement.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    cur.classList.add('is-hidden');
    addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.translate = `${mx}px ${my}px`;
      cur.classList.remove('is-hidden');
    }, { passive: true });
    gsap.ticker.add(() => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.translate = `${rx}px ${ry}px`;
    });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor], a, button, .qa__q');
      const lbl = t && t.dataset.cursor;
      cur.classList.toggle('is-label', !!lbl);
      cur.classList.toggle('is-link', !!t && !lbl);
      label.textContent = lbl || '';
    });
    document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
    document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.documentElement.addEventListener('mouseleave', () => cur.classList.add('is-hidden'));
  }

  /* ---------- magnetic buttons ---------- */
  function setupMagnetic() {
    if (!finePointer || reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      const strength = el.classList.contains('btn--sm') ? 0.25 : 0.35;
      const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * strength);
        qy((e.clientY - r.top - r.height / 2) * strength);
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .35)', overwrite: true }));
    });
  }

  /* ---------- hero ---------- */
  const heroLine = $('#heroLine');
  const heroGlow = $('.hero__line--glow');
  const heroLen = heroLine.getTotalLength();
  [heroLine, heroGlow].forEach((p) => { p.style.strokeDasharray = heroLen; p.style.strokeDashoffset = heroLen; });

  function placeHeroDot(p) {
    const pt = heroLine.getPointAtLength(p * heroLen);
    for (const c of [$('.hero__dot'), $('.hero__dot-glow')]) { c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); }
  }

  function countUp(el, to, duration = 2.2) {
    const o = { v: 0 };
    gsap.to(o, { v: to, duration, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
  }

  function heroIntro() {
    const tl = gsap.timeline({ paused: true, onComplete: () => { heroParallax(); clickGag(); } });
    const dot = { p: 0 };
    tl.from('.hero__title .wi', { yPercent: 120, rotate: 6, duration: 1.4, stagger: 0.07, ease: 'expo.out' }, 0)
      .from('.hero .eyebrow', { y: 20, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.15)
      .from('.hero__sub', { y: 24, opacity: 0, duration: 1, ease: 'power3.out' }, 0.45)
      .from('.hero__ctas > *', { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, 0.55)
      .from('.hero__grid', { opacity: 0, duration: 2 }, 0)
      .from('.hcard', { opacity: 0, scale: 0.6, y: 70, duration: 1.3, stagger: 0.09, ease: 'back.out(1.5)' }, 0.35)
      .from('.hero__bars rect', { scaleY: 0, duration: 1.4, stagger: 0.05, ease: 'expo.out' }, 0.5)
      .to([heroLine, heroGlow], { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' }, 0.4)
      .to(dot, { p: 1, duration: 2.4, ease: 'power2.inOut', onUpdate: () => placeHeroDot(dot.p) }, 0.4)
      .from('.hero__area', { opacity: 0, duration: 2 }, 1.2)
      .add(() => {
        $$('[data-count-to]').forEach((el) => countUp(el, +el.dataset.countTo));
        gsap.to('.hcard__donut .arc', { strokeDasharray: '100 0', duration: 2.2, ease: 'power3.out' });
      }, 0.7)
      .from('.hero__scroll', { opacity: 0, duration: 1 }, 1.2)
      .add(() => {
        gsap.fromTo(dot, { p: 0 }, { p: 1, duration: 8, ease: 'none', repeat: -1, onUpdate: () => placeHeroDot(dot.p) });
      });
    return tl;
  }

  function heroParallax() {
    if (!finePointer || reduce) return;
    const cards = $$('.hcard').map((el) => ({
      d: +el.dataset.depth,
      qx: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3.out' }),
      qy: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3.out' }),
    }));
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      cards.forEach((c) => { c.qx(nx * 44 * c.d); c.qy(ny * 32 * c.d); });
    }, { passive: true });
  }

  /* An animated pointer flies in and clicks the word "click." on a loop. */
  function clickGag() {
    if (reduce) return;
    const hero = $('.hero'), word = $('.click-word'), ptr = $('.hero__pointer');
    const ripple = $('.hero__ripple'), sparkWrap = $('.hero__sparks'), sparks = $$('.hero__sparks i');
    const ctr = $('.hcard--ctr');
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    sparks.forEach((s, i) => gsap.set(s, { rotation: (i / sparks.length) * 360 + 90 }));

    function run() {
      if (!visible || document.hidden || window.scrollY > innerHeight * 0.5) { gsap.delayedCall(1.5, run); return; }
      const hr = hero.getBoundingClientRect(), wr = word.getBoundingClientRect();
      const tx = wr.left - hr.left + wr.width * 0.5, ty = wr.top - hr.top + wr.height * 0.58;
      const sx = tx + Math.min(240, hr.width * 0.22), sy = ty + 190;
      gsap.set(ptr, { x: sx, y: sy, opacity: 0, scale: 1 });
      gsap.set([ripple, sparkWrap], { x: tx, y: ty });
      gsap.timeline({ onComplete: () => gsap.delayedCall(3.4, run) })
        .to(ptr, { opacity: 1, duration: 0.3 })
        .to(ptr, { x: tx, y: ty, duration: 1.15, ease: 'power3.inOut' }, 0)
        .to(ptr, { scale: 0.78, duration: 0.11, ease: 'power2.in' })
        .to(word, { scale: 0.88, duration: 0.11, ease: 'power2.in' }, '<')
        .addLabel('hit')
        .to(ptr, { scale: 1, duration: 0.6, ease: 'elastic.out(1, .4)' }, 'hit')
        .to(word, { scale: 1, duration: 1, ease: 'elastic.out(1.3, .3)' }, 'hit')
        .fromTo(ripple, { scale: 0.2, opacity: 1 }, { scale: 2.8, opacity: 0, duration: 1, ease: 'expo.out' }, 'hit')
        .fromTo(sparks, { opacity: 1, x: 0, y: 0, scaleY: 1.2 }, {
          opacity: 0, scaleY: 0.3, duration: 0.8, ease: 'expo.out',
          x: (i) => Math.cos((i / sparks.length) * Math.PI * 2) * 74,
          y: (i) => Math.sin((i / sparks.length) * Math.PI * 2) * 74,
        }, 'hit')
        .add(() => {
          ctr.classList.add('is-pulse');
          setTimeout(() => ctr.classList.remove('is-pulse'), 900);
        }, 'hit')
        .to(ptr, { x: '+=110', y: '+=80', opacity: 0, duration: 0.9, ease: 'power2.in' }, 'hit+=.7');
    }
    gsap.delayedCall(0.6, run);
  }

  function heroScroll() {
    gsap.to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });
    gsap.to('.hero__cards', { y: -160, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__chart', { y: 80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- tapes (marquee, speeds up with scroll velocity) ---------- */
  function setupTapes() {
    $$('[data-marquee]').forEach((tape) => {
      const track = $('.tape__track', tape);
      const original = track.innerHTML;
      let guard = 0;
      while (track.scrollWidth < innerWidth * 1.6 && guard++ < 12) track.innerHTML += original;
      track.innerHTML += track.innerHTML;
      const dir = +tape.dataset.marquee;
      let half = track.scrollWidth / 2;
      let x = dir > 0 ? -half : 0;
      let boost = 0;
      addEventListener('resize', () => { half = track.scrollWidth / 2; });
      gsap.ticker.add((t, dt) => {
        const v = lenis ? lenis.velocity : 0;
        boost += (Math.min(Math.abs(v), 60) * 0.25 - boost) * 0.08;
        x += dir * (reduce ? 0 : 0.9 + boost) * (dt / 16.67);
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });
  }

  /* ---------- brand cards ---------- */
  function setupTilt() {
    if (!finePointer || reduce) return;
    $$('[data-tilt]').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        ry((px - 0.5) * 14);
        rx(-(py - 0.5) * 12);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------- scroll reveals ---------- */
  function setupReveals() {
    $$('[data-split]').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.from($$('.wi', el), {
        yPercent: 120, rotate: 5, duration: 1.3, stagger: 0.06, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });
    $$('[data-reveal]').forEach((el) => {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('.step .chips, .chips--pop').forEach((list) => {
      gsap.from(list.children, {
        opacity: 0, scale: 0.6, y: 16, duration: 0.7, stagger: 0.045, ease: 'back.out(2)',
        scrollTrigger: { trigger: list, start: 'top 88%', once: true },
      });
    });
    gsap.from('.checks li', {
      opacity: 0, x: -20, duration: 0.8, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.checks', start: 'top 88%', once: true },
    });
  }

  /* ---------- odometer stats ---------- */
  function setupOdometers() {
    $$('[data-odo]').forEach((el) => {
      const str = el.dataset.odo;
      el.textContent = '';
      el.setAttribute('role', 'img');
      const strips = [];
      [...str].forEach((ch) => {
        if (/\d/.test(ch)) {
          const col = document.createElement('span'); col.className = 'odo-col'; col.setAttribute('aria-hidden', 'true');
          const strip = document.createElement('span'); strip.className = 'odo-strip';
          for (let k = 0; k < 20; k++) { const s = document.createElement('span'); s.textContent = k % 10; strip.appendChild(s); }
          col.appendChild(strip); el.appendChild(col);
          strips.push({ strip, digit: +ch, col });
        } else {
          const s = document.createElement('span');
          s.className = `odo-sym${ch === '+' ? ' odo-sym--accent' : ''}`;
          s.setAttribute('aria-hidden', 'true');
          s.textContent = ch;
          el.appendChild(s);
        }
      });
      // Each column is as wide as its final digit, so "10" doesn't render as "1 0".
      const fs = parseFloat(getComputedStyle(el).fontSize);
      strips.forEach((s) => {
        const probe = document.createElement('span');
        probe.textContent = s.digit;
        el.appendChild(probe);
        s.col.style.width = `${probe.getBoundingClientRect().width / fs}em`;
        probe.remove();
      });
      const syms = $$('.odo-sym', el);
      if (reduce) { strips.forEach((s) => gsap.set(s.strip, { yPercent: -(10 + s.digit) * 5 })); return; }
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
          strips.forEach((s, i) => gsap.fromTo(s.strip, { yPercent: 0 }, { yPercent: -(10 + s.digit) * 5, duration: 2.4 + i * 0.3, ease: 'expo.out' }));
          gsap.from(syms, { opacity: 0, yPercent: 50, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.3 });
        },
      });
    });
  }

  /* ---------- work reel ---------- */
  const mm = gsap.matchMedia();
  function setupWork() {
    const reels = $$('.reel');
    const count = $('.work__count b'), bar = $('.work__bar i');
    $('.work__count').lastChild.textContent = ` / ${String(reels.length).padStart(2, '0')}`;
    const setProgress = (p) => {
      bar.style.transform = `scaleX(${p})`;
      count.textContent = String(Math.min(reels.length, Math.floor(p * (reels.length - 0.001)) + 1)).padStart(2, '0');
    };

    mm.add('(min-width: 961px)', () => {
      const pin = $('.work__pin'), track = $('.work__track');
      const dist = () => track.scrollWidth - document.documentElement.clientWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => `+=${dist() * 1.3}`, pin: true, scrub: 1,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => setProgress(self.progress),
        },
      });
      reels.forEach((r, i) => {
        if (i < 3) return;
        gsap.from(r, {
          y: 90, rotate: 4, ease: 'none',
          scrollTrigger: { trigger: r, containerAnimation: tween, start: 'left 102%', end: 'left 80%', scrub: true },
        });
      });
    });

    mm.add('(max-width: 960px)', () => {
      const vp = $('.work__viewport');
      const onS = () => { const max = vp.scrollWidth - vp.clientWidth; setProgress(max > 0 ? vp.scrollLeft / max : 0); };
      vp.addEventListener('scroll', onS, { passive: true });
      return () => vp.removeEventListener('scroll', onS);
    });
  }

  /* ---------- process: stacking cards ---------- */
  function setupProcess() {
    mm.add('(min-width: 961px)', () => {
      const steps = $$('.step');
      steps.forEach((step, i) => {
        const next = steps[i + 1];
        if (!next) return;
        gsap.fromTo($('.step__in', step), { scale: 1, filter: 'brightness(1)' }, {
          scale: 0.92, filter: 'brightness(0.45)', ease: 'none',
          scrollTrigger: {
            trigger: next, start: 'top 85%',
            end: () => `top ${parseFloat(getComputedStyle(next).top) || 100}px`,
            scrub: true, invalidateOnRefresh: true,
          },
        });
      });
    });
  }

  /* ---------- statement ---------- */
  function setupStatement() {
    const el = $('.statement__text');
    const words = splitWords(el, false);
    if (reduce) { gsap.set(words, { opacity: 1 }); el.querySelector('.strike').style.setProperty('--strike', 1); return; }
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 40%', scrub: 0.6 } });
    words.forEach((w, i) => tl.to(w, { opacity: 1, duration: 1, ease: 'none' }, i * 0.8));
    const strikeAt = words.findIndex((w) => w.closest('.strike'));
    tl.to('.strike', { '--strike': 1, duration: 1.2, ease: 'power2.inOut' }, strikeAt * 0.8 + 0.9);
    tl.from(el.querySelectorAll('em .sw'), { scale: 0.7, transformOrigin: '0% 70%', duration: 1.2, ease: 'back.out(2)' }, (words.length - 1) * 0.8);
  }

  /* ---------- pricing ---------- */
  function setupPricing() {
    const pv = $('[data-price]');
    const to = +pv.dataset.price;
    if (reduce) return;
    pv.textContent = '0';
    ScrollTrigger.create({
      trigger: pv, start: 'top 88%', once: true,
      onEnter: () => {
        const o = { v: 0 };
        gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => { pv.textContent = Math.round(o.v).toLocaleString('en-US'); } });
      },
    });
  }

  /* ---------- faq ---------- */
  function setupFaq() {
    $$('.qa').forEach((qa, i) => {
      const q = $('.qa__q', qa), a = $('.qa__a', qa);
      a.id = `qa-${i}`;
      q.setAttribute('aria-controls', a.id);
      q.addEventListener('click', () => {
        const open = q.getAttribute('aria-expanded') === 'true';
        $$('.qa__q[aria-expanded="true"]').forEach((o) => {
          if (o === q) return;
          o.setAttribute('aria-expanded', 'false');
          gsap.to(o.nextElementSibling, { height: 0, duration: 0.6, ease: 'expo.inOut' });
        });
        q.setAttribute('aria-expanded', String(!open));
        gsap.to(a, { height: open ? 0 : 'auto', duration: 0.7, ease: 'expo.inOut', onComplete: () => ScrollTrigger.refresh() });
      });
    });
  }

  /* ---------- footer ---------- */
  function setupFooter() {
    const mark = $('.footer__mark span');
    gsap.from(mark, { yPercent: 45, opacity: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.footer__mark', start: 'top 98%', once: true } });
    if (finePointer) {
      $('.footer').addEventListener('pointermove', (e) => {
        const r = mark.getBoundingClientRect();
        mark.style.setProperty('--mx', `${e.clientX - r.left}px`);
        mark.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    } else if (!reduce) {
      gsap.fromTo(mark, { '--mx': '10%' }, { '--mx': '90%', duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    const y = $('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- video modal ---------- */
  function setupModal() {
    const modal = $('.modal'), frame = $('.modal__frame');
    const open = (html, vertical, compact = false) => {
      frame.classList.toggle('is-vertical', vertical);
      frame.classList.toggle('is-compact', compact);
      frame.innerHTML = html;
      modal.showModal();
      modalOpen = true;
      if (lenis) lenis.stop();
      $$('.organic video').forEach((v) => v.pause());
    };
    $$('[data-yt]').forEach((b) => b.addEventListener('click', () => {
      const id = encodeURIComponent(b.dataset.yt);
      open(`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="Video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`, b.dataset.ratio === '9/16');
    }));
    // Self-hosted clips (organic cuts) play with sound in the same player.
    $$('[data-video]').forEach((b) => b.addEventListener('click', () => {
      const vertical = (b.dataset.ratio || '9/16') === '9/16';
      open(`<video src="${b.dataset.video}" controls autoplay playsinline></video>`, vertical, !vertical);
    }));
    $('.modal__close').addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', () => {
      frame.innerHTML = '';
      modalOpen = false;
      if (lenis) lenis.start();
      $$('.organic video').forEach((v) => {
        const r = v.getBoundingClientRect();
        if (!reduce && v.getAttribute('src') && r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {});
      });
    });
  }

  /* ---------- organic cuts: muted preview loops only load + play while on screen ---------- */
  function setupOrganic() {
    const vids = $$('.organic video');
    if (!vids.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting && !reduce && !modalOpen) {
          if (!v.getAttribute('src')) v.src = v.dataset.src;
          v.play().catch(() => {});
        } else v.pause();
      });
    }, { rootMargin: '150px' });
    vids.forEach((v) => io.observe(v));
    gsap.from('.organic__wide', {
      y: 60, opacity: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: '.organic__wide', start: 'top 90%', once: true },
    });
    gsap.from('.organic__item', {
      y: 90, opacity: 0, duration: 1.4, stagger: 0.14, ease: 'expo.out',
      scrollTrigger: { trigger: '.organic__phones', start: 'top 85%', once: true },
    });
  }

  /* ---------- pause looping visuals while offscreen ---------- */
  function setupLive() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
    }, { rootMargin: '120px' });
    $$('[data-live]').forEach((el) => io.observe(el));
  }

  /* ---------- boot ---------- */
  async function boot() {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

    $$('[data-split]').forEach((el) => splitWords(el));
    const markChars = splitChars($('.preloader__mark'));

    setupCursor();
    setupMagnetic();
    setupTapes();
    setupTilt();
    setupOdometers();
    setupWork();
    setupProcess();
    setupStatement();
    setupPricing();
    setupFaq();
    setupFooter();
    setupModal();
    setupOrganic();
    setupLive();
    setupReveals();
    heroScroll();
    const intro = heroIntro();

    addEventListener('load', () => ScrollTrigger.refresh());

    if (reduce) {
      $('.preloader').style.display = 'none';
      intro.progress(1);
      return;
    }

    const counter = { v: 0 };
    const countEl = $('[data-count]');
    gsap.timeline()
      .from(markChars, { yPercent: 110, duration: 1, stagger: 0.045, ease: 'expo.out' })
      .from('.preloader__row', { opacity: 0, duration: 0.6 }, 0.2)
      .to(counter, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => { countEl.textContent = Math.round(counter.v); } }, 0.15)
      .to('.preloader__bar i', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0.15)
      .to(markChars, { yPercent: -110, duration: 0.7, stagger: 0.03, ease: 'expo.in' }, '+=.1')
      .to('.preloader__row, .preloader__bar', { opacity: 0, duration: 0.4 }, '<')
      .to('.preloader__panels i', { yPercent: -100, duration: 1.1, stagger: 0.07, ease: 'expo.inOut' }, '-=.25')
      .add(() => intro.play(), '-=.75')
      .add(() => {
        $('.preloader').style.display = 'none';
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      });
  }

  boot();
})();
