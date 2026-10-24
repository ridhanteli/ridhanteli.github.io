/**
 * RIDHAN TELI — CYBER-WORKBENCH PORTFOLIO ENGINE (V2.5)
 * Canvas 2D Particle System, Web Audio Synthesizer, 3D Tilt,
 * Interactive CLI, and Ridhan Presenter Console
 */

(function () {
  'use strict';

  // --- GLOBAL STATE ---
  const state = {
    projects: [],
    activeCategory: 'All',
    soundEnabled: false,
    audioCtx: null,
    currentTheme: localStorage.getItem('rt_theme') || 'cyan',
    cmdHistory: [],
    cmdHistoryIndex: -1,
    isConsoleAuth: sessionStorage.getItem('rt_console_auth') === 'true',
    isPitchMode: false,
    stashItems: []
  };

  // --- AUDIO SYNTHESIZER (Native Web Audio API) ---
  const initAudio = () => {
    if (!state.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        state.audioCtx = new AudioCtxClass();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  };

  const playSynthTone = (freq = 440, type = 'sine', duration = 0.06, gainVol = 0.04) => {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!state.audioCtx) return;

      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVol, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      osc.start();
      osc.stop(state.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not permitted yet or failed
    }
  };

  const playClickSound = () => playSynthTone(750, 'triangle', 0.05, 0.06);
  const playHoverSound = () => playSynthTone(520, 'sine', 0.03, 0.02);
  const playTerminalKeySound = () => playSynthTone(320 + Math.random() * 80, 'sine', 0.025, 0.02);
  const playSuccessSound = () => {
    playSynthTone(587.33, 'triangle', 0.07, 0.05);
    setTimeout(() => playSynthTone(880, 'sine', 0.1, 0.06), 70);
  };
  const playErrorSound = () => {
    playSynthTone(180, 'sawtooth', 0.15, 0.08);
  };

  // --- THEME ENGINE ---
  const applyTheme = (themeName) => {
    const validThemes = ['cyan', 'purple', 'emerald', 'amber'];
    if (!validThemes.includes(themeName)) themeName = 'cyan';

    state.currentTheme = themeName;
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('rt_theme', themeName);

    // Update Theme Switcher Dots
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.setTheme === themeName);
    });
  };

  // --- TOAST NOTIFICATION ---
  const showToast = (message) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2600);
  };

  // --- SCROLL PROGRESS BAR ---
  const initScrollProgress = () => {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${pct}%`;
    }, { passive: true });
  };

  // --- INTERACTIVE BACKGROUND CANVAS (Constellation & Flight Radar) ---
  const initCanvasBackground = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = window.innerWidth < 768 ? 40 : 85;
    const maxDistance = 140;

    let mouse = { x: -1000, y: -1000, radius: 160 };

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 1.8 + 1;
        this.alpha = Math.random() * 0.6 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Mouse repulsion
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 3;
          this.y -= Math.sin(angle) * force * 3;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    const getAccentRGB = () => {
      const style = getComputedStyle(document.body);
      const val = style.getPropertyValue('--accent-rgb').trim();
      return val || '0, 245, 255';
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const accentRGB = getAccentRGB();

      // Connect particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${accentRGB}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();
  };

  // --- DUAL-RING MAGNETIC CURSOR ---
  const initCursor = () => {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    }, { passive: true });

    const followLoop = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;

      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      requestAnimationFrame(followLoop);
    };
    followLoop();

    const interactiveSelectors = 'a, button, input, select, textarea, .tilt-card, .cmd-chip, .filter-chip, .theme-btn';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        document.body.classList.add('cursor-hover');
        playHoverSound();
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        document.body.classList.remove('cursor-hover');
      }
    });
  };

  // --- 3D TILT EFFECT WITH SPECULAR SPOTLIGHT ---
  const initTiltCards = () => {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  };

  // --- TELEMETRY HUD LIVE CLOCK & STATUS ---
  const initHudClock = () => {
    const clockElem = document.getElementById('hud-clock');
    if (!clockElem) return;

    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      clockElem.textContent = `${timeStr} IST`;
    };

    updateClock();
    setInterval(updateClock, 1000);

    // Saved status
    const savedStatus = localStorage.getItem('rt_bench_status');
    const statusText = document.getElementById('hud-status-text');
    if (savedStatus && statusText) {
      statusText.textContent = savedStatus;
    }
  };

  // --- DATE FORMATTER ---
  const formatDate = (val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // --- LOAD & RENDER PROJECTS ---
  const loadProjectsData = async () => {
    const container = document.getElementById('projects-container');

    try {
      const res = await fetch('data/projects.json');
      if (!res.ok) throw new Error('Network response not ok');
      state.projects = await res.json();

      const categories = ['All', ...new Set(state.projects.map((p) => p.category))];
      renderFilterChips(categories);
      renderProjectsGrid();
    } catch (err) {
      console.error('Error loading projects:', err);
      if (container) {
        container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">Unable to load builds.</p>';
      }
    }
  };

  const renderFilterChips = (categories) => {
    const filterContainer = document.getElementById('project-filters');
    if (!filterContainer) return;

    filterContainer.innerHTML = categories
      .map(
        (cat) => `
        <button type="button" class="filter-chip ${cat === state.activeCategory ? 'active' : ''}" data-cat="${cat}">
          ${cat}
        </button>
      `
      )
      .join('');

    filterContainer.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        state.activeCategory = btn.dataset.cat;
        renderFilterChips(categories);
        renderProjectsGrid();
      });
    });
  };

  const renderProjectsGrid = () => {
    const container = document.getElementById('projects-container');
    const countElem = document.getElementById('project-count');
    if (!container) return;

    const filtered = state.activeCategory === 'All'
      ? state.projects
      : state.projects.filter((p) => p.category === state.activeCategory);

    if (countElem) countElem.textContent = filtered.length;

    if (!filtered.length) {
      container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No builds found in this category.</p>';
      return;
    }

    const iconMap = {
      drone: '🛸',
      bot: '🤖',
      wind: '💨',
      cpu: '⚡',
      code: '💻'
    };

    container.innerHTML = filtered
      .map((project) => {
        const icon = iconMap[project.icon] || '⚙️';
        const specsSnapshot = project.specs
          ? Object.entries(project.specs)
              .slice(0, 2)
              .map(
                ([k, v]) => `
                <div class="spec-mini-item">
                  <span class="spec-mini-label">${k}:</span>
                  <span class="spec-mini-val">${v}</span>
                </div>
              `
              )
              .join('')
          : '';

        const tagsList = project.tags
          ? project.tags
              .map((t) => `<span class="tag-item">#${t}</span>`)
              .join('')
          : '';

        return `
        <article class="project-card glass-panel tilt-card reveal in-view" data-project-id="${project.id}">
          <div class="card-glow-reflection"></div>
          
          <div>
            <div class="card-blueprint-header">
              <div class="blueprint-icon">${icon}</div>
              <div class="badge-group">
                <span class="badge">${project.category}</span>
                <span class="badge ${project.badge === 'Flight Tested' ? 'flight' : 'status'}">${project.status}</span>
              </div>
            </div>

            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            
            ${specsSnapshot ? `<div class="card-specs-snapshot">${specsSnapshot}</div>` : ''}

            <div class="project-tags">${tagsList}</div>
          </div>

          <div class="project-card-footer">
            <span class="project-date">${formatDate(project.date)}</span>
            <button class="btn btn-secondary btn-sm inspect-btn" data-project-id="${project.id}">
              Inspect Specs ❯
            </button>
          </div>
        </article>
      `;
      })
      .join('');

    initTiltCards();
    container.querySelectorAll('.inspect-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        openProjectModal(btn.dataset.projectId);
      });
    });
  };

  // --- PROJECT INSPECTOR MODAL ---
  const openProjectModal = (projectId) => {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-desc').textContent = project.description;
    document.getElementById('modal-category').textContent = project.category;
    document.getElementById('modal-status').textContent = project.status;
    document.getElementById('modal-date').textContent = formatDate(project.date);

    const specsContainer = document.getElementById('modal-specs-container');
    if (specsContainer && project.specs) {
      specsContainer.innerHTML = Object.entries(project.specs)
        .map(
          ([key, val]) => `
          <div class="spec-box">
            <span class="spec-key">${key}</span>
            <span class="spec-val">${val}</span>
          </div>
        `
        )
        .join('');
    }

    const bomContainer = document.getElementById('modal-bom-container');
    if (bomContainer && project.bom) {
      bomContainer.innerHTML = project.bom
        .map(
          (item) => `
          <li class="bom-item">
            <span class="bom-bullet">▹</span>
            <span>${item}</span>
          </li>
        `
        )
        .join('');
    }

    const notesContainer = document.getElementById('modal-notes-container');
    if (notesContainer) {
      notesContainer.textContent = project.notes || 'No workbench notes recorded.';
    }

    const tagsContainer = document.getElementById('modal-tags-container');
    if (tagsContainer && project.tags) {
      tagsContainer.innerHTML = project.tags
        .map((t) => `<span class="tag-item">#${t}</span>`)
        .join(' ');
    }

    document.querySelectorAll('.modal-tab-btn').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
    document.querySelector('[data-tab="tab-specs"]')?.classList.add('active');
    document.getElementById('tab-specs')?.classList.add('active');

    modal.showModal();
  };

  const initModalHandlers = () => {
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('modal-close');
    const dismissBtn = document.getElementById('modal-dismiss-btn');

    const closeModal = () => {
      playClickSound();
      if (modal) modal.close();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);

    document.querySelectorAll('.modal-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        const tabId = btn.dataset.tab;

        document.querySelectorAll('.modal-tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');
      });
    });

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  };

  // --- INTERACTIVE WORKBENCH CLI TERMINAL ---
  const initTerminal = () => {
    const input = document.getElementById('terminal-input');
    const sendBtn = document.getElementById('terminal-send');
    const body = document.getElementById('terminal-body');

    if (!input || !body) return;

    const printLine = (text, className = '') => {
      const line = document.createElement('div');
      line.className = `terminal-line ${className}`;
      line.innerHTML = text;
      body.appendChild(line);
      body.scrollTop = body.scrollHeight;
    };

    const runCommand = (cmdRaw) => {
      const cmd = cmdRaw.trim().toLowerCase();
      if (!cmd) return;

      playSuccessSound();

      printLine(`<span class="prompt-user">ridhan@teli</span>:<span class="prompt-path">~</span>$ ${escapeHtml(cmdRaw)}`);

      state.cmdHistory.push(cmdRaw);
      state.cmdHistoryIndex = state.cmdHistory.length;

      const args = cmd.split(' ');
      const baseCmd = args[0];

      switch (baseCmd) {
        case 'help':
          printLine(`
Available Commands:
  <span class="cmd-highlight">projects</span>     List all current builds and prototypes
  <span class="cmd-highlight">drone</span>        Display telemetry specs for the ESP32 Quadcopter
  <span class="cmd-highlight">skills</span>       Display technical toolbelt
  <span class="cmd-highlight">about</span>        Read workbench background
  <span class="cmd-highlight">theme</span> &lt;color&gt; Switch theme: cyan, purple, emerald, amber
  <span class="cmd-highlight">sound</span>        Toggle audio FX
  <span class="cmd-highlight">contact</span>      Display direct contact links (Phone: 9620640630)
  <span class="cmd-highlight">console</span>      Open the Ridhan Console
  <span class="cmd-highlight">clear</span>        Clear terminal output
          `);
          break;

        case 'projects':
          if (!state.projects.length) {
            printLine('Loading projects...');
          } else {
            let output = '<strong>CURRENT BUILDS:</strong><br>';
            state.projects.forEach((p, idx) => {
              output += `[0${idx + 1}] <strong>${p.title}</strong> — <em>${p.category}</em> (${p.status})<br>`;
            });
            printLine(output);
          }
          break;

        case 'drone':
          printLine(`
<strong>[TELEMETRY: QUADCOPTER_01]</strong>
  MCU:        ESP32 Dual-Core (240MHz)
  IMU:        MPU6050 6-Axis (400kHz I2C)
  ESCs:       30A BLHeli_S
  Weight:     385g AUW
  Status:     PID Tuning & Flight Dynamics Testing
          `);
          break;

        case 'skills':
          printLine(`
<strong>[TOOLBELT]</strong>
  Hardware:   ESP32, Arduino, STM32, Sensors, BLDC Motors
  Code:       Embedded C++, Python, JavaScript, HTML5/CSS3, Git
  Lab Tools:  3D Printing (PETG/PLA), Fusion 360 CAD, Soldering
  Flight:     PID Tuning, IMU Sensor Fusion, Telemetry
          `);
          break;

        case 'about':
          printLine('Hey, I\'m Ridhan Teli — student and hardware builder in Bangalore. I build things with microcontrollers, 3D printing, and code.');
          break;

        case 'theme':
          if (args[1] && ['cyan', 'purple', 'emerald', 'amber'].includes(args[1])) {
            applyTheme(args[1]);
            printLine(`Theme switched to <strong>${args[1].toUpperCase()}</strong>.`);
          } else {
            printLine('Usage: theme &lt;cyan | purple | emerald | amber&gt;');
          }
          break;

        case 'sound':
          toggleSound();
          printLine(`Sound effects: <strong>${state.soundEnabled ? 'ENABLED' : 'DISABLED'}</strong>`);
          break;

        case 'contact':
          printLine(`
<strong>[CONTACT]</strong>
  Phone:      <a href="tel:+919620640630" class="cmd-highlight">+91 9620640630</a>
  Email:      <a href="mailto:ridhanteli@gmail.com" class="cmd-highlight">ridhanteli@gmail.com</a>
  Instagram:  <a href="https://instagram.com/ridhanteli" target="_blank" class="cmd-highlight">@ridhanteli</a>
  GitHub:     <a href="https://github.com/ridhanteli" target="_blank" class="cmd-highlight">github.com/ridhanteli</a>
          `);
          break;

        case 'console':
          openRidhanConsole();
          printLine('Launching Ridhan Console dialog...');
          break;

        case 'clear':
          body.innerHTML = '';
          break;

        default:
          printLine(`Command not recognized: <span style="color:#ef4444;">${escapeHtml(cmd)}</span>. Type <span class="cmd-highlight">help</span>.`);
          break;
      }
    };

    const escapeHtml = (text) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    input.addEventListener('keydown', (e) => {
      playTerminalKeySound();

      if (e.key === 'Enter') {
        const val = input.value;
        input.value = '';
        runCommand(val);
      } else if (e.key === 'ArrowUp') {
        if (state.cmdHistoryIndex > 0) {
          state.cmdHistoryIndex--;
          input.value = state.cmdHistory[state.cmdHistoryIndex];
        }
      } else if (e.key === 'ArrowDown') {
        if (state.cmdHistoryIndex < state.cmdHistory.length - 1) {
          state.cmdHistoryIndex++;
          input.value = state.cmdHistory[state.cmdHistoryIndex];
        } else {
          state.cmdHistoryIndex = state.cmdHistory.length;
          input.value = '';
        }
      }
    });

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const val = input.value;
        input.value = '';
        runCommand(val);
      });
    }

    document.querySelectorAll('.cmd-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const cmd = chip.dataset.cmd;
        if (cmd) runCommand(cmd);
      });
    });

    const heroTermBtn = document.getElementById('hero-terminal-btn');
    if (heroTermBtn) {
      heroTermBtn.addEventListener('click', () => {
        playClickSound();
        const termSec = document.getElementById('terminal-section');
        if (termSec) {
          termSec.scrollIntoView({ behavior: 'smooth' });
          input.focus();
        }
      });
    }
  };

  // --- SOUND TOGGLE ---
  const toggleSound = () => {
    state.soundEnabled = !state.soundEnabled;
    const soundToggle = document.getElementById('sound-toggle');
    const dockSoundBtn = document.getElementById('dock-sound-btn');
    const label = document.getElementById('sound-label');

    if (soundToggle) {
      soundToggle.classList.toggle('sound-on', state.soundEnabled);
    }
    if (label) {
      label.textContent = state.soundEnabled ? 'FX: ON' : 'FX: OFF';
    }
    if (dockSoundBtn) {
      dockSoundBtn.style.color = state.soundEnabled ? 'var(--accent)' : 'inherit';
    }

    if (state.soundEnabled) {
      initAudio();
      playSuccessSound();
      showToast('🔊 Audio FX Enabled');
    } else {
      showToast('🔇 Audio FX Muted');
    }
  };

  // --- COPY TO CLIPBOARD BUTTONS ---
  const initCopyButtons = () => {
    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        if (!text) return;

        playClickSound();
        try {
          await navigator.clipboard.writeText(text);
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          btn.style.borderColor = 'var(--status-green)';
          btn.style.color = 'var(--status-green)';

          showToast(`✓ Copied: ${text}`);

          setTimeout(() => {
            btn.textContent = original;
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 1800);
        } catch (e) {
          showToast('Clipboard unavailable');
        }
      });
    });
  };

  // =========================================================================
  // RIDHAN CONSOLE ENGINE (Full bottom button & Presenter Vault)
  // Username: ridhanteli | Password: Inkitel#1981
  // =========================================================================

  const defaultStash = [
    {
      id: 'stash-1',
      title: 'ESP32 Drone Telemetry Repo',
      type: 'link',
      url: 'https://github.com/ridhanteli/ridhanteli.github.io',
      desc: 'Quadcopter flight firmware with MPU6050 sensor fusion code.'
    },
    {
      id: 'stash-2',
      title: 'PID Flight Tuning Notes',
      type: 'note',
      url: 'Roll P=1.35, I=0.04, D=0.018. Throttle D-term low-pass filtering at 85Hz completely cleaned motor oscillation.',
      desc: 'Talking points for explaining sensor fusion & oscillation fix.'
    },
    {
      id: 'stash-3',
      title: 'Autonomous Rover State Machine',
      type: 'note',
      url: 'Cruises forward at 80% PWM. When VL53L0X distance < 25cm, pauses, sweeps servo 60 deg left/right, and pivots towards largest free corridor.',
      desc: 'Algorithm overview for demonstration.'
    }
  ];

  const loadStashItems = () => {
    try {
      const stored = localStorage.getItem('rt_console_stash');
      state.stashItems = stored ? JSON.parse(stored) : defaultStash;
    } catch (e) {
      state.stashItems = defaultStash;
    }
  };

  const saveStashItems = () => {
    try {
      localStorage.setItem('rt_console_stash', JSON.stringify(state.stashItems));
    } catch (e) {
      console.error('Failed to save stash to localStorage');
    }
  };

  const renderStashGrid = () => {
    const grid = document.getElementById('stash-items-grid');
    const countElem = document.getElementById('stash-count');
    if (!grid) return;

    if (countElem) countElem.textContent = state.stashItems.length;

    if (!state.stashItems.length) {
      grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No items in vault yet. Add one above!</p>';
      return;
    }

    grid.innerHTML = state.stashItems
      .map((item) => {
        const typeEmoji = item.type === 'link' ? '🔗' : item.type === 'image' ? '🖼' : item.type === 'file' ? '📂' : '📝';
        return `
        <div class="stash-card" data-item-id="${item.id}">
          <div>
            <div class="stash-top">
              <span class="stash-type-badge">${typeEmoji} ${item.type.toUpperCase()}</span>
            </div>
            <h4 class="stash-item-title">${item.title}</h4>
            <p class="stash-item-desc">${item.desc || 'No description'}</p>
          </div>
          <div class="stash-actions">
            <button class="btn btn-primary btn-sm stash-open-btn" data-item-id="${item.id}">Present</button>
            <button class="btn btn-secondary btn-sm stash-copy-btn" data-url="${escapeAttr(item.url)}">Copy</button>
            <button class="btn btn-glass btn-sm stash-del-btn" data-item-id="${item.id}">✕</button>
          </div>
        </div>
      `;
      })
      .join('');

    // Open/Present
    grid.querySelectorAll('.stash-open-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        const item = state.stashItems.find((i) => i.id === btn.dataset.itemId);
        if (item) openPresentationViewer(item);
      });
    });

    // Copy
    grid.querySelectorAll('.stash-copy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        playClickSound();
        const url = btn.dataset.url;
        await navigator.clipboard.writeText(url);
        showToast('✓ Stash content copied');
      });
    });

    // Delete
    grid.querySelectorAll('.stash-del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        state.stashItems = state.stashItems.filter((i) => i.id !== btn.dataset.itemId);
        saveStashItems();
        renderStashGrid();
        showToast('Item removed from stash');
      });
    });
  };

  const escapeAttr = (str) => {
    return (str || '').replace(/"/g, '&quot;');
  };

  // Fullscreen Presentation Viewer
  const openPresentationViewer = (item) => {
    const modal = document.getElementById('presentation-viewer-modal');
    const title = document.getElementById('viewer-title');
    const body = document.getElementById('viewer-body');
    if (!modal || !body) return;

    title.textContent = item.title;

    if (item.type === 'link') {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    } else if (item.type === 'image' || (item.type === 'file' && item.url.startsWith('data:image'))) {
      body.innerHTML = `<img src="${item.url}" alt="${item.title}">`;
    } else {
      body.innerHTML = `<div class="viewer-note">${item.url}</div>`;
    }

    modal.showModal();
  };

  const openRidhanConsole = () => {
    const modal = document.getElementById('ridhan-console-modal');
    const loginView = document.getElementById('console-login-view');
    const authView = document.getElementById('console-auth-view');
    if (!modal) return;

    playClickSound();

    if (state.isConsoleAuth) {
      if (loginView) loginView.style.display = 'none';
      if (authView) authView.style.display = 'block';
      loadStashItems();
      renderStashGrid();
    } else {
      if (loginView) loginView.style.display = 'block';
      if (authView) authView.style.display = 'none';
      setTimeout(() => document.getElementById('console-user')?.focus(), 100);
    }

    modal.showModal();
  };

  const initConsole = () => {
    const modal = document.getElementById('ridhan-console-modal');
    const openBtn = document.getElementById('open-console-btn');
    const closeBtn = document.getElementById('console-close-btn');
    const loginForm = document.getElementById('console-login-form');
    const authError = document.getElementById('console-auth-error');
    const logoutBtn = document.getElementById('console-logout-btn');
    const pitchModeBtn = document.getElementById('console-pitch-mode-btn');

    if (openBtn) {
      openBtn.addEventListener('click', openRidhanConsole);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        playClickSound();
        modal.close();
      });
    }

    // Login Form Submit (Username: ridhanteli | Password: Inkitel#1981)
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('console-user').value.trim();
        const pass = document.getElementById('console-pass').value;

        if (user === 'ridhanteli' && pass === 'Inkitel#1981') {
          state.isConsoleAuth = true;
          sessionStorage.setItem('rt_console_auth', 'true');
          playSuccessSound();
          showToast('✓ Authentication Successful: Welcome, Ridhan');

          if (authError) authError.style.display = 'none';
          document.getElementById('console-login-view').style.display = 'none';
          document.getElementById('console-auth-view').style.display = 'block';

          loadStashItems();
          renderStashGrid();
        } else {
          playErrorSound();
          if (authError) {
            authError.style.display = 'block';
            authError.textContent = '⚠ Access Denied: Incorrect username or password.';
          }
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        state.isConsoleAuth = false;
        sessionStorage.removeItem('rt_console_auth');
        playClickSound();
        showToast('Console Locked');
        document.getElementById('console-login-view').style.display = 'block';
        document.getElementById('console-auth-view').style.display = 'none';
        document.getElementById('console-pass').value = '';
      });
    }

    // Pitch Mode Toggle
    if (pitchModeBtn) {
      pitchModeBtn.addEventListener('click', () => {
        state.isPitchMode = !state.isPitchMode;
        document.body.classList.toggle('pitch-mode', state.isPitchMode);
        pitchModeBtn.textContent = state.isPitchMode ? '🎬 Pitch Mode: ON' : '🎬 Pitch Mode: OFF';
        playSuccessSound();
        showToast(state.isPitchMode ? 'Pitch Mode Enabled (High Focus)' : 'Pitch Mode Disabled');
      });
    }

    // Console Tab Switching
    document.querySelectorAll('.c-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        const ctabId = btn.dataset.ctab;

        document.querySelectorAll('.c-tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.c-tab-content').forEach((c) => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(ctabId)?.classList.add('active');
      });
    });

    // Add Item Form handling
    const addForm = document.getElementById('add-stash-form');
    const typeSelect = document.getElementById('stash-type');
    const groupUrl = document.getElementById('group-url');
    const groupFile = document.getElementById('group-file');
    const labelUrl = document.getElementById('label-stash-url');

    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        const val = typeSelect.value;
        if (val === 'file') {
          groupFile.style.display = 'block';
          groupUrl.style.display = 'none';
          document.getElementById('stash-url').removeAttribute('required');
        } else {
          groupFile.style.display = 'none';
          groupUrl.style.display = 'block';
          document.getElementById('stash-url').setAttribute('required', 'true');

          if (val === 'note') labelUrl.textContent = 'NOTE / TALKING POINT TEXT';
          else if (val === 'image') labelUrl.textContent = 'IMAGE URL (OR DIRECT LINK)';
          else labelUrl.textContent = 'WEB LINK / REPO URL';
        }
      });
    }

    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('stash-title').value.trim();
        const type = document.getElementById('stash-type').value;
        const desc = document.getElementById('stash-desc').value.trim();
        const urlInput = document.getElementById('stash-url').value.trim();
        const fileInput = document.getElementById('stash-file-input');

        if (type === 'file' && fileInput.files.length) {
          const file = fileInput.files[0];
          const reader = new FileReader();
          reader.onload = () => {
            const newItem = {
              id: 'stash-' + Date.now(),
              title: title || file.name,
              type: 'file',
              url: reader.result,
              desc: desc || `Uploaded file (${(file.size / 1024).toFixed(1)} KB)`
            };
            state.stashItems.unshift(newItem);
            saveStashItems();
            renderStashGrid();
            addForm.reset();
            playSuccessSound();
            showToast('✓ File saved to Presenter Stash');
            document.querySelector('[data-ctab="ctab-stash"]')?.click();
          };
          reader.readAsDataURL(file);
        } else {
          const newItem = {
            id: 'stash-' + Date.now(),
            title,
            type,
            url: urlInput,
            desc
          };
          state.stashItems.unshift(newItem);
          saveStashItems();
          renderStashGrid();
          addForm.reset();
          playSuccessSound();
          showToast('✓ Saved to Presenter Stash');
          document.querySelector('[data-ctab="ctab-stash"]')?.click();
        }
      });
    }

    // Clear Stash Button
    const clearBtn = document.getElementById('clear-stash-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all items from Presenter Stash?')) {
          state.stashItems = [];
          saveStashItems();
          renderStashGrid();
          showToast('Stash cleared');
        }
      });
    }

    // Site Controls: Update HUD Status
    const statusInput = document.getElementById('ctrl-status-input');
    const statusSaveBtn = document.getElementById('ctrl-status-save');
    if (statusSaveBtn && statusInput) {
      statusSaveBtn.addEventListener('click', () => {
        const val = statusInput.value.trim();
        if (val) {
          const hudStatus = document.getElementById('hud-status-text');
          if (hudStatus) hudStatus.textContent = val;
          localStorage.setItem('rt_bench_status', val);
          playSuccessSound();
          showToast(`HUD Status updated: ${val}`);
        }
      });
    }

    // Site Controls: Theme Buttons
    document.querySelectorAll('.ctrl-theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        applyTheme(btn.dataset.theme);
        showToast(`Theme: ${btn.dataset.theme.toUpperCase()}`);
      });
    });

    // Site Controls: Test Sound
    const testSoundBtn = document.getElementById('ctrl-test-sound');
    if (testSoundBtn) {
      testSoundBtn.addEventListener('click', () => {
        state.soundEnabled = true;
        document.getElementById('sound-toggle')?.classList.add('sound-on');
        const label = document.getElementById('sound-label');
        if (label) label.textContent = 'FX: ON';
        initAudio();
        playSuccessSound();
        showToast('🔊 Synthesizer Audio Test OK');
      });
    }

    // Viewer modal close
    const viewerClose = document.getElementById('viewer-close-btn');
    const viewerModal = document.getElementById('presentation-viewer-modal');
    if (viewerClose && viewerModal) {
      viewerClose.addEventListener('click', () => {
        playClickSound();
        viewerModal.close();
      });
    }
  };

  // --- FLOATING DOCK HANDLERS ---
  const initFloatingDock = () => {
    const dockTerminalBtn = document.getElementById('dock-terminal-btn');
    const dockSoundBtn = document.getElementById('dock-sound-btn');
    const dockThemeBtn = document.getElementById('dock-theme-btn');
    const dockTopBtn = document.getElementById('dock-top-btn');

    if (dockTerminalBtn) {
      dockTerminalBtn.addEventListener('click', () => {
        playClickSound();
        document.getElementById('terminal-section')?.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('terminal-input')?.focus();
      });
    }

    if (dockSoundBtn) {
      dockSoundBtn.addEventListener('click', () => {
        toggleSound();
      });
    }

    if (dockThemeBtn) {
      const themes = ['cyan', 'purple', 'emerald', 'amber'];
      dockThemeBtn.addEventListener('click', () => {
        playClickSound();
        const nextIndex = (themes.indexOf(state.currentTheme) + 1) % themes.length;
        applyTheme(themes[nextIndex]);
        showToast(`Theme: ${themes[nextIndex].toUpperCase()}`);
      });
    }

    if (dockTopBtn) {
      dockTopBtn.addEventListener('click', () => {
        playClickSound();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  // --- SCROLL REVEAL OBSERVER ---
  const initScrollObserver = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  };

  // --- NAVIGATION & MOBILE MENU ---
  const initNavigation = () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        playClickSound();
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    window.addEventListener('scroll', () => {
      const pos = window.scrollY + 120;
      document.querySelectorAll('section[id]').forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (pos >= top && pos < top + height) {
          document.querySelectorAll('.nav-link').forEach((link) => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${id}`);
          });
        }
      });
    }, { passive: true });
  };

  // --- SETUP THEME PICKER BUTTONS ---
  const initThemePicker = () => {
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playClickSound();
        applyTheme(btn.dataset.setTheme);
      });
    });
  };

  // --- SOUND TOGGLE BUTTON INITIALIZER ---
  const initSoundToggle = () => {
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.addEventListener('click', toggleSound);
    }
  };

  // --- DOM READY INIT ---
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.currentTheme);
    initScrollProgress();
    initCanvasBackground();
    initCursor();
    initTiltCards();
    initHudClock();
    initThemePicker();
    initSoundToggle();
    initNavigation();
    initTerminal();
    initModalHandlers();
    initCopyButtons();
    initConsole();
    initFloatingDock();
    initScrollObserver();

    loadProjectsData();
  });
})();
