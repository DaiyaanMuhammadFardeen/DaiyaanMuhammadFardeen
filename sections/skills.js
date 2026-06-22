/**
 * Skills Section — initSkills
 * 3D skill constellation on canvas with auto-rotation, drag, hover, tooltips.
 */
export function initSkills() {
  const canvas = document.getElementById('skills-canvas');
  if (!canvas) return;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isReduced = window.portfolio?.reducedMotion ?? false;

  // Responsive sizing
  const isMobile = window.innerWidth < 768;
  const scale = isMobile ? 0.5 : 1.0;

  // ── Data ────────────────────────────────────────────

  const skills = [
    { name: 'Python', category: 'language', level: 95, x: 0 * scale, y: 0 * scale, z: 0 * scale },
    { name: 'C++', category: 'language', level: 85, x: 200 * scale, y: 80 * scale, z: -50 * scale },
    { name: 'Rust', category: 'language', level: 75, x: -150 * scale, y: 120 * scale, z: 100 * scale },
    { name: 'Go', category: 'language', level: 72, x: 180 * scale, y: -90 * scale, z: 150 * scale },
    { name: 'TypeScript', category: 'language', level: 78, x: -200 * scale, y: -60 * scale, z: -100 * scale },
    { name: 'PyTorch', category: 'ai', level: 90, x: 60 * scale, y: -180 * scale, z: 80 * scale },
    { name: 'Transformers', category: 'ai', level: 85, x: -80 * scale, y: -200 * scale, z: -40 * scale },
    { name: 'vLLM', category: 'ai', level: 70, x: 120 * scale, y: -150 * scale, z: 200 * scale },
    { name: 'ROCm', category: 'ai', level: 65, x: -180 * scale, y: -120 * scale, z: 160 * scale },
    { name: 'Embeddings', category: 'ai', level: 80, x: 0 * scale, y: -250 * scale, z: 0 * scale },
    { name: 'OpenGL', category: 'systems', level: 82, x: 250 * scale, y: 50 * scale, z: -180 * scale },
    { name: 'ECS', category: 'systems', level: 88, x: -250 * scale, y: 80 * scale, z: -80 * scale },
    { name: 'GPU Compute', category: 'systems', level: 72, x: 150 * scale, y: 200 * scale, z: -200 * scale },
    { name: 'Linux', category: 'systems', level: 90, x: -100 * scale, y: 180 * scale, z: 200 * scale },
    { name: 'FastAPI', category: 'backend', level: 85, x: -60 * scale, y: 250 * scale, z: -50 * scale },
    { name: 'PostgreSQL', category: 'backend', level: 80, x: 200 * scale, y: 220 * scale, z: 100 * scale },
    { name: 'Redis', category: 'backend', level: 75, x: -220 * scale, y: 200 * scale, z: -150 * scale },
    { name: 'Docker', category: 'backend', level: 70, x: 100 * scale, y: 280 * scale, z: 200 * scale },
    // ── New skills from resume ────────────────────────
    { name: 'Java', category: 'language', level: 75, x: 300 * scale, y: 60 * scale, z: 120 * scale },
    { name: 'JavaScript', category: 'language', level: 80, x: -80 * scale, y: 40 * scale, z: -300 * scale },
    { name: 'Dart', category: 'language', level: 60, x: -320 * scale, y: -40 * scale, z: 80 * scale },
    { name: 'Kotlin', category: 'language', level: 60, x: 120 * scale, y: -60 * scale, z: -280 * scale },
    { name: 'HTML', category: 'language', level: 85, x: -260 * scale, y: -140 * scale, z: -60 * scale },
    { name: 'CSS', category: 'language', level: 82, x: 280 * scale, y: -180 * scale, z: 40 * scale },
    { name: 'Bash', category: 'systems', level: 72, x: 180 * scale, y: 240 * scale, z: -160 * scale },
    { name: 'Spring Boot', category: 'backend', level: 70, x: -160 * scale, y: 300 * scale, z: 60 * scale },
    { name: 'Next.js', category: 'backend', level: 72, x: 300 * scale, y: 260 * scale, z: 140 * scale },
    { name: 'Flutter', category: 'backend', level: 65, x: -300 * scale, y: 180 * scale, z: -140 * scale },
    { name: 'React', category: 'backend', level: 78, x: 40 * scale, y: 340 * scale, z: -40 * scale },
    { name: 'MySQL', category: 'backend', level: 75, x: 260 * scale, y: 200 * scale, z: -200 * scale },
    { name: 'MongoDB', category: 'backend', level: 70, x: -240 * scale, y: -260 * scale, z: 80 * scale },
    { name: 'Ollama', category: 'ai', level: 78, x: 240 * scale, y: -100 * scale, z: -180 * scale },
    { name: 'Microservices', category: 'backend', level: 68, x: -200 * scale, y: -280 * scale, z: -100 * scale },
    { name: 'System Design', category: 'systems', level: 75, x: -180 * scale, y: -200 * scale, z: 280 * scale },
    { name: 'Algorithms', category: 'systems', level: 80, x: 60 * scale, y: 140 * scale, z: -250 * scale },
    { name: 'Multithreading', category: 'systems', level: 78, x: -120 * scale, y: 60 * scale, z: 300 * scale },
    { name: 'Event-Driven', category: 'backend', level: 65, x: 200 * scale, y: -240 * scale, z: -240 * scale },
  ];

  const CATEGORY_COLORS = {
    language: '#00e5ff',
    ai: '#ff00aa',
    systems: '#00ff41',
    backend: '#ffb300',
  };

  const CATEGORY_LABELS = {
    language: 'Languages',
    ai: 'AI / ML',
    systems: 'Systems',
    backend: 'Backend',
  };

  // ── State ───────────────────────────────────────────

  const FOV = 500;
  let rotationX = 0;
  let rotationY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let isDragging = false;
  let lastMX = 0;
  let lastMY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let hoveredNode = null;
  let animId = null;
  let running = true;
  let tooltipEl = null;

  // Size
  let w, h, centerX, centerY, pxScale;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    w = canvas.width = rect.width * dpr;
    h = canvas.height = rect.height * dpr;
    centerX = w / 2;
    centerY = h / 2;
    pxScale = dpr;
    ctx.setTransform(pxScale, 0, 0, pxScale, 0, 0);
    // Reset CSS size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  // ── 3D Math ─────────────────────────────────────────

  function rotate3D(node, rx, ry) {
    // Rotate around Y
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x1 = node.x * cosY - node.z * sinY;
    const z1 = node.x * sinY + node.z * cosY;
    const y1 = node.y;

    // Rotate around X
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    return { x: x1, y: y2, z: z2 };
  }

  function project(x, y, z) {
    const factor = FOV / (z + FOV);
    return {
      sx: x * factor + centerX / pxScale,
      sy: y * factor + centerY / pxScale,
      factor,
    };
  }

  // ── Drawing ─────────────────────────────────────────

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, w / pxScale, h / pxScale);

    // Apply inertia to rotation
    if (!isDragging) {
      rotationX += velocityX;
      rotationY += velocityY;
      velocityX *= 0.92;
      velocityY *= 0.92;
    }

    // Auto-rotation (only when not dragging)
    if (!isDragging) {
      targetRotY += 0.003;
      targetRotX = Math.sin(Date.now() * 0.0005) * 0.15;
      rotationY += (targetRotY - rotationY) * 0.02;
      rotationX += (targetRotX - rotationX) * 0.02;
    }

    // Transform all nodes
    const projected = skills.map((node) => {
      const rot = rotate3D(node, rotationX, rotationY);
      const proj = project(rot.x, rot.y, rot.z);
      return { ...node, rot, proj };
    });

    // Sort by depth (far to near)
    projected.sort((a, b) => b.rot.z - a.rot.z);

    // ── Draw connections ──────────────────────────────
    for (const cat of ['language', 'ai', 'systems', 'backend']) {
      const catNodes = projected.filter((n) => n.category === cat);
      const color = CATEGORY_COLORS[cat];

      for (let i = 0; i < catNodes.length; i++) {
        for (let j = i + 1; j < catNodes.length; j++) {
          const a = catNodes[i];
          const b = catNodes[j];
          const avgDepth = (a.rot.z + b.rot.z) / 2;
          const dx = a.rot.x - b.rot.x;
          const dy = a.rot.y - b.rot.y;
          const dz = a.rot.z - b.rot.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const maxDist = 400;

          if (dist < maxDist) {
            const opacity = 0.15 + (1 - dist / maxDist) * 0.2;
            const alpha = Math.max(0, Math.min(1, opacity));
            ctx.beginPath();
            ctx.moveTo(a.proj.sx, a.proj.sy);
            ctx.lineTo(b.proj.sx, b.proj.sy);
            ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // ── Draw nodes ────────────────────────────────────
    for (const node of projected) {
      const { sx, sy, factor } = node.proj;
      const isHovered = hoveredNode && hoveredNode.name === node.name;
      const radius = ((node.level / 100) * 12 + 4) * (isHovered ? 1.5 : 1);
      const color = CATEGORY_COLORS[node.category];

      // Glow ring for hovered
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = color + '66';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Outer glow
        const grad = ctx.createRadialGradient(sx, sy, radius, sx, sy, radius + 20);
        grad.addColorStop(0, color + '33');
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 20, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color + (isHovered ? 'CC' : '99');
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      // Level indicator — inner fill
      const fillRatio = node.level / 100;
      ctx.beginPath();
      ctx.arc(sx, sy, radius * fillRatio, 0, Math.PI * 2);
      ctx.fillStyle = color + '44';
      ctx.fill();

      // Label
      const fontSize = 11 + Math.max(0, Math.min(1, (node.rot.z + 300) / 600)) * 4;
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isHovered ? '#e8e8f8' : '#7878a8';
      ctx.fillText(node.name, sx, sy + radius + fontSize + 4);
    }

    // ── Hover tooltip ─────────────────────────────────
    if (hoveredNode && tooltipEl) {
      updateTooltip(hoveredNode);
    }

    animId = requestAnimationFrame(draw);
  }

  // ── Tooltip ─────────────────────────────────────────

  function createTooltip() {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'skills-tooltip';
    tooltipEl.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 100;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #111127;
      border: 1px solid #00e5ff33;
      border-radius: 4px;
      padding: 10px 14px;
      color: #e8e8f8;
      opacity: 0;
      transition: opacity 200ms;
      min-width: 160px;
    `;
    document.body.appendChild(tooltipEl);
  }

  function updateTooltip(node) {
    if (!tooltipEl) return;

    const color = CATEGORY_COLORS[node.category];
    const catLabel = CATEGORY_LABELS[node.category];

    tooltipEl.innerHTML = `
      <div style="color:${color}; font-weight:700; margin-bottom:4px;">${node.name}</div>
      <div style="color:#7878a8; font-size:11px; margin-bottom:6px;">${catLabel}</div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="flex:1; height:4px; background:#3a3a5c; border-radius:2px; overflow:hidden;">
          <div style="width:${node.level}%; height:100%; background:${color}; border-radius:2px;"></div>
        </div>
        <span style="color:${color}; font-size:11px;">${node.level}%</span>
      </div>
    `;
    tooltipEl.style.opacity = '1';
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.style.opacity = '0';
    }
  }

  // ── Hit Testing ────────────────────────────────────

  function getNodeAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * pxScale;
    const my = (clientY - rect.top) * pxScale;

    // Transform all nodes with current rotation
    const projected = skills.map((node) => {
      const rot = rotate3D(node, rotationX, rotationY);
      const proj = project(rot.x, rot.y, rot.z);
      return { ...node, rot, proj };
    });

    // Sort front-to-back for accurate picking
    projected.sort((a, b) => a.rot.z - b.rot.z);

    for (const node of projected) {
      const { sx, sy } = node.proj;
      const radius = ((node.level / 100) * 12 + 4) * 1.5; // use hover scale for hit area
      const dx = mx / pxScale - sx;
      const dy = my / pxScale - sy;
      if (dx * dx + dy * dy < radius * radius) {
        return node;
      }
    }
    return null;
  }

  // ── Mouse / Touch Events ────────────────────────────

  function onPointerDown(e) {
    isDragging = true;
    velocityX = 0;
    velocityY = 0;
    lastMX = e.clientX;
    lastMY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (isDragging) {
      const dx = e.clientX - lastMX;
      const dy = e.clientY - lastMY;
      rotationY += dx * 0.008;
      rotationX += dy * 0.008;
      velocityX = dy * 0.008;
      velocityY = dx * 0.008;
      lastMX = e.clientX;
      lastMY = e.clientY;
      hideTooltip();
    } else {
      // Hover detection
      const node = getNodeAt(e.clientX, e.clientY);
      if (node) {
        hoveredNode = node;
        canvas.style.cursor = 'pointer';
        if (tooltipEl) {
          tooltipEl.style.left = (e.clientX + 16) + 'px';
          tooltipEl.style.top = (e.clientY - 10) + 'px';
          updateTooltip(node);
        }
      } else {
        if (hoveredNode) {
          hoveredNode = null;
          hideTooltip();
        }
        canvas.style.cursor = 'grab';
      }
    }
  }

  function onPointerUp() {
    isDragging = false;
    canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  }

  function onPointerLeave() {
    isDragging = false;
    hoveredNode = null;
    hideTooltip();
    canvas.style.cursor = 'grab';
  }

  // ── Init / Cleanup ──────────────────────────────────

  function start() {
    resize();
    createTooltip();

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('mouseleave', onPointerLeave);

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      onPointerDown({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      onPointerMove({ clientX: t.clientX, clientY: t.clientY });
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);

    window.addEventListener('resize', resize);

    running = true;
    draw();
  }

  function stop() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
    if (tooltipEl && tooltipEl.parentNode) tooltipEl.parentNode.removeChild(tooltipEl);
  }

  // ── Reduced Motion: Static Frame ────────────────────

  if (isReduced) {
    resize();
    // Draw a single static frame
    running = false;
    const projected = skills.map((node) => {
      const rot = rotate3D(node, 0, 0);
      const proj = project(rot.x, rot.y, rot.z);
      return { ...node, rot, proj };
    });
    projected.sort((a, b) => b.rot.z - a.rot.z);

    // Draw connections
    for (const cat of ['language', 'ai', 'systems', 'backend']) {
      const catNodes = projected.filter((n) => n.category === cat);
      const color = CATEGORY_COLORS[cat];
      for (let i = 0; i < catNodes.length; i++) {
        for (let j = i + 1; j < catNodes.length; j++) {
          const a = catNodes[i];
          const b = catNodes[j];
          const dx = a.rot.x - b.rot.x;
          const dy = a.rot.y - b.rot.y;
          const dz = a.rot.z - b.rot.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 400) {
            const opacity = 0.15 + (1 - dist / 400) * 0.2;
            ctx.beginPath();
            ctx.moveTo(a.proj.sx, a.proj.sy);
            ctx.lineTo(b.proj.sx, b.proj.sy);
            ctx.strokeStyle = color + Math.round(opacity * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    for (const node of projected) {
      const { sx, sy } = node.proj;
      const radius = (node.level / 100) * 12 + 4;
      const color = CATEGORY_COLORS[node.category];

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = color + '99';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      const fontSize = 13;
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7878a8';
      ctx.fillText(node.name, sx, sy + radius + fontSize + 4);
    }
    return;
  }

  start();
}
