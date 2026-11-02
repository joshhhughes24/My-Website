(() => {
  const progressBar = document.querySelector('.progress-bar');
  const homePage = document.body.dataset.page === 'home';
  const canvas = document.querySelector('.home-field');
  const mask = document.querySelector('.home-mask');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.accordion-trigger').forEach((button) => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

  const essayList = document.querySelector('.essay-list-view');
  const essayReader = document.querySelector('.essay-reader');
  const essaysBackground = document.querySelector('.essays-background');
  const essayItems = Array.from(document.querySelectorAll('.essay-link'));
  const essayBodies = {
    'essay-1': ['[First paragraph of the essay.]', '[Second paragraph of the essay.]'],
    'essay-2': ['[First paragraph of the essay.]', '[Second paragraph of the essay.]'],
    'essay-3': ['[First paragraph of the essay.]', '[Second paragraph of the essay.]'],
    'essay-4': ['[First paragraph of the essay.]', '[Second paragraph of the essay.]'],
  };
  const essays = essayItems.map((link) => ({
    id: link.dataset.essayId,
    date: link.querySelector('.date').textContent,
    title: link.querySelector('.essay-title').textContent,
    body: essayBodies[link.dataset.essayId] || [],
  }));

  const showEssay = (id, updateHistory = true) => {
    const essay = essays.find((item) => item.id === id);
    if (!essay || !essayList || !essayReader) return;
    essayList.hidden = true;
    essayReader.hidden = false;
    if (essaysBackground) essaysBackground.hidden = true;
    essayReader.querySelector('.essay-reader-date').textContent = essay.date;
    essayReader.querySelector('.essay-reader-title').textContent = essay.title;
    essayReader.querySelector('.essay-body').replaceChildren(...essay.body.map((paragraph) => {
      const element = document.createElement('p');
      element.textContent = paragraph;
      return element;
    }));
    if (updateHistory) history.pushState({ essayId: id }, '', `#${id}`);
    window.scrollTo(0, 0);
  };

  const closeEssay = (updateHistory = true) => {
    if (!essayList || !essayReader) return;
    essayReader.hidden = true;
    essayList.hidden = false;
    if (essaysBackground) essaysBackground.hidden = false;
    if (updateHistory) history.pushState({}, '', location.pathname);
    window.scrollTo(0, 0);
  };

  essayItems.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    showEssay(link.dataset.essayId);
  }));
  document.querySelector('.essay-back')?.addEventListener('click', () => closeEssay());
  window.addEventListener('popstate', () => {
    const essayId = location.hash.slice(1);
    if (essayId) showEssay(essayId, false);
    else closeEssay(false);
  });
  if (location.hash) showEssay(location.hash.slice(1), false);

  const cvSections = Array.from(document.querySelectorAll('.cv-section'));
  const cvLinks = Array.from(document.querySelectorAll('[data-cv-section]'));
  cvLinks.forEach((link) => link.addEventListener('click', () => {
    cvLinks.forEach((item) => item.removeAttribute('aria-current'));
    link.setAttribute('aria-current', 'location');
  }));
  const updateCVSection = () => {
    if (!cvSections.length) return;
    const active = cvSections.filter((section) => section.getBoundingClientRect().top <= window.innerHeight * 0.4).at(-1) || cvSections[0];
    cvLinks.forEach((link) => {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const updateScrollEffects = () => {
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const scrollable = document.documentElement.scrollHeight - viewportHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${scrollable > 0 ? scrollTop / scrollable : 0})`;
    const parallaxOffset = -Math.min(scrollTop * 0.35, viewportHeight * 0.3);
    document.querySelectorAll('.projects-background, .projects-axis, .essays-background').forEach((element) => {
      element.style.transform = `translateY(${parallaxOffset}px)`;
    });
    updateCVSection();
    if (homePage) {
      if (canvas) canvas.style.opacity = String(Math.max(0, Math.min(1, 1 - scrollTop / (viewportHeight * 0.85))));
      if (mask) mask.style.opacity = String(Math.max(0, Math.min(1, (scrollTop - viewportHeight * 0.85) / (viewportHeight * 0.5))));
    }
  };

  window.addEventListener('scroll', updateScrollEffects, { passive: true });
  window.addEventListener('resize', updateScrollEffects);
  updateScrollEffects();

  const scrollArrow = document.querySelector('.scroll-arrow');
  scrollArrow?.addEventListener('click', () => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }));

  if (!homePage || !canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  let width = 0;
  let height = 0;
  let animationId = 0;
  let startTime = performance.now();
  let lastFrame = startTime;
  let simulationTime = 0;
  const columns = 170;
  const rows = 130;
  const count = columns * rows;
  const pointX = new Float32Array(count);
  const pointY = new Float32Array(count);
  const depth = new Float32Array(count);
  const heightNorm = new Float32Array(count);
  const visible = new Uint8Array(count);
  const smoothstep = (a, b, value) => {
    const amount = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return amount * amount * (3 - 2 * amount);
  };

  const resizeCanvas = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (reducedMotion) draw(0);
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    if (!width || canvas.style.opacity === '0') return;

    const fade = Math.max(0, Math.min(1, 1 - window.scrollY / (window.innerHeight * 0.85)));
    const color = [13, 105, 88];
    const amplitude = 1;
    const focalLength = Math.max(width, height) * 0.75;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const pitch = 0.62;
    const pitchCos = Math.cos(pitch);
    const pitchSin = Math.sin(pitch);
    const rotation = -0.38;
    const rotationCos = Math.cos(rotation);
    const rotationSin = Math.sin(rotation);
    const sources = [[-4, 6], [5, 10]];

    for (let row = 0; row < rows; row += 1) {
      const worldZ = -6 + (row / (rows - 1)) * 40;
      for (let column = 0; column < columns; column += 1) {
        const worldX = -22 + (column / (columns - 1)) * 44;
        const [sourceAX, sourceAZ] = sources[0];
        const [sourceBX, sourceBZ] = sources[1];
        const radiusA = Math.hypot(worldX - sourceAX, worldZ - sourceAZ);
        const radiusB = Math.hypot(worldX - sourceBX, worldZ - sourceBZ);
        const waveHeight = amplitude * (
          0.38 * Math.sin(worldX * 0.45 + time * 0.5)
          + 0.28 * Math.sin(worldZ * 0.55 - time * 0.4)
          + 0.18 * Math.sin((worldX + worldZ) * 0.95 + time * 0.85)
          + 0.12 * Math.sin((worldX - worldZ * 0.7) * 1.7 - time * 0.7)
          + 0.07 * Math.sin((worldX * 0.3 + worldZ) * 2.6 + time * 1.3)
          + 0.22 * Math.sin(radiusA * 1.5 - time * 1.6) / (1 + radiusA * 0.12)
          + 0.22 * Math.sin(radiusB * 1.5 - time * 1.6) / (1 + radiusB * 0.12)
        );
        const x = worldX * rotationCos - worldZ * rotationSin;
        const z = worldX * rotationSin + worldZ * rotationCos + 4;
        const relativeY = waveHeight - 4;
        const cameraY = relativeY * pitchCos + z * pitchSin;
        const cameraZ = z * pitchCos - relativeY * pitchSin;
        const index = row * columns + column;
        if (cameraZ < 0.5) {
          visible[index] = 0;
          continue;
        }
        const xOnScreen = centerX + (x / cameraZ) * focalLength;
        const yOnScreen = centerY - (cameraY / cameraZ) * focalLength;
        pointX[index] = xOnScreen;
        pointY[index] = yOnScreen;
        depth[index] = Math.min(1, Math.max(0, (cameraZ - 3) / 16));
        heightNorm[index] = Math.max(0, Math.min(1, waveHeight / (amplitude * 1.3) * 0.5 + 0.5));
        visible[index] = xOnScreen > -60 && xOnScreen < width + 60 && yOnScreen > -60 && yOnScreen < height + 60 ? 1 : 0;
      }
    }

    const buckets = 8;
    const paths = Array.from({ length: buckets }, () => new Path2D());
    const addSegment = (first, second) => {
      if (!visible[first] || !visible[second]) return;
      const distance = (depth[first] + depth[second]) * 0.5;
      const lineAlpha = smoothstep(0.12, 0.42, distance) * (1 - smoothstep(0.75, 1, distance) * 0.85);
      if (lineAlpha < 0.04) return;
      const bucket = Math.min(buckets - 1, Math.floor(lineAlpha * buckets));
      paths[bucket].moveTo(pointX[first], pointY[first]);
      paths[bucket].lineTo(pointX[second], pointY[second]);
    };

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        if (column < columns - 1) addSegment(index, index + 1);
        if (row < rows - 1) addSegment(index, index + columns);
      }
    }

    context.lineWidth = 0.7;
    context.strokeStyle = `rgb(${color.join(',')})`;
    for (let bucket = 0; bucket < buckets; bucket += 1) {
      context.globalAlpha = fade * ((bucket + 0.5) / buckets) * 0.6;
      context.stroke(paths[bucket]);
    }
    context.fillStyle = `rgb(${color.join(',')})`;
    for (let index = 0; index < count; index += 1) {
      if (!visible[index]) continue;
      const distance = depth[index];
      const alpha = (1 - smoothstep(0.2, 0.5, distance) * 0.85) * (1 - smoothstep(height * 0.7, height * 0.9, pointY[index]));
      if (alpha <= 0.01) continue;
      context.globalAlpha = fade * alpha * (0.3 + 0.7 * heightNorm[index]);
      const size = (1.2 + 2.2 * (1 - distance)) * (0.75 + 0.5 * heightNorm[index]);
      context.fillRect(pointX[index] - size / 2, pointY[index] - size / 2, size, size);
    }
    context.globalAlpha = 1;
  };

  const animate = (now) => {
    simulationTime += Math.min(0.1, (now - lastFrame) / 1000) * 0.35;
    lastFrame = now;
    draw(simulationTime);
    animationId = requestAnimationFrame(animate);
  };

  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(canvas);
  resizeCanvas();
  if (!reducedMotion) animationId = requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(animationId);
    observer.disconnect();
  }, { once: true });
})();