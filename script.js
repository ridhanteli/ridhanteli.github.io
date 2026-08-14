const state = {
  projects: [],
  activeCategory: 'All',
  scrollY: 0,
};

const elements = {
  projectsContainer: document.getElementById('projects-container'),
  timelineContainer: document.getElementById('timeline-container'),
  journalContainer: document.getElementById('journal-container'),
  projectCount: document.getElementById('project-count'),
  projectFilters: document.getElementById('project-filters'),
  navToggle: document.querySelector('.nav-toggle'),
  navLinks: document.querySelector('.nav-links'),
  bg: document.querySelector('.bg'),
};

// Parallax background effect
window.addEventListener('scroll', () => {
  state.scrollY = window.scrollY;
  if (elements.bg) {
    elements.bg.style.transform = `translateY(${state.scrollY * 0.5}px)`;
  }
});

// Mouse parallax effect for background
document.addEventListener('mousemove', (e) => {
  if (!elements.bg) return;
  const x = (e.clientX / window.innerWidth) * 20 - 10;
  const y = (e.clientY / window.innerHeight) * 20 - 10;
  elements.bg.style.transition = 'transform 0.3s ease-out';
  elements.bg.style.transform = `translateY(${state.scrollY * 0.5}px) translate(${x}px, ${y}px)`;
});

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const loadProjects = async () => {
  try {
    const response = await fetch('data/projects.json');
    const projects = await response.json();

    state.projects = projects
      .map((project) => ({
        ...project,
        images: Array.isArray(project.images)
          ? project.images
          : project.image
          ? [project.image]
          : [],
        dateObject: new Date(project.date),
      }))
      .sort((a, b) => b.dateObject - a.dateObject);

    const categories = ['All', ...new Set(state.projects.map((project) => project.category))];
    renderFilters(categories);
    renderProjects();
    renderTimeline();
    renderJournal();
    initRevealObserver();
  } catch (error) {
    console.error('Failed to load project data:', error);
    elements.projectsContainer.innerHTML = '<p class="section-empty">Unable to load projects.</p>';
  }
};

const renderFilters = (categories) => {
  elements.projectFilters.innerHTML = categories
    .map(
      (category) => `
        <button type="button" class="filter-chip ${category === state.activeCategory ? 'active' : ''}" data-category="${category}">${category}</button>
      `
    )
    .join('');

  elements.projectFilters.querySelectorAll('.filter-chip').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      renderFilters(categories);
      renderProjects();
    });
  });
};

const renderProjects = () => {
  const filteredProjects = state.activeCategory === 'All'
    ? state.projects
    : state.projects.filter((project) => project.category === state.activeCategory);

  elements.projectCount.textContent = filteredProjects.length;

  if (!filteredProjects.length) {
    elements.projectsContainer.innerHTML = '<p class="section-empty">No projects match this category yet.</p>';
    return;
  }

  elements.projectsContainer.innerHTML = filteredProjects
    .map((project) => {
      const imageMarkup = project.images.length
        ? `
            <div class="project-media">
              <img src="${project.images[0]}" alt="${project.title}">
            </div>
          `
        : '';

      const imageCount = project.images.length > 1 ? `<span class="badge">${project.images.length} images</span>` : '';
      const videoLink = project.video
        ? `<a href="${project.video}" target="_blank" rel="noopener" class="project-links">Watch preview</a>`
        : '';

      return `
        <article class="project-card reveal">
          ${imageMarkup}
          <div class="project-info">
            <div class="project-meta">
              <span class="badge">${project.category}</span>
              <span class="badge status">${project.status}</span>
              ${imageCount}
            </div>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-footer">
              <p class="project-date">${formatDate(project.date)}</p>
              <div class="project-links">
                ${videoLink}
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
};

const renderTimeline = () => {
  elements.timelineContainer.innerHTML = state.projects
    .map((project) => `
      <article class="timeline-item reveal">
        <h3>${formatDate(project.date)}</h3>
        <p>${project.title}</p>
        <div class="timeline-meta">
          <span>${project.category}</span>
          <span class="timeline-status">${project.status}</span>
        </div>
      </article>
    `)
    .join('');
};

const renderJournal = () => {
  elements.journalContainer.innerHTML = state.projects
    .map((project) => `
      <article class="journal-entry reveal">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="journal-meta">
          <span>${formatDate(project.date)}</span>
          <span>${project.category}</span>
          <span class="timeline-status">${project.status}</span>
        </div>
      </article>
    `)
    .join('');
};

const initRevealObserver = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Add staggered animation for multiple elements
          const siblings = entry.target.parentElement?.querySelectorAll('.reveal.visible') || [];
          const delay = (siblings.length % 5) * 0.1;
          entry.target.style.animationDelay = `${delay}s`;
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
};

const closeMobileMenu = () => {
  elements.navToggle.setAttribute('aria-expanded', 'false');
  elements.navLinks.classList.remove('open');
};

elements.navToggle.addEventListener('click', () => {
  const expanded = elements.navToggle.getAttribute('aria-expanded') === 'true';
  elements.navToggle.setAttribute('aria-expanded', String(!expanded));
  elements.navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 720) {
    closeMobileMenu();
  }
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

// Enhanced cursor tracking
const cursor = document.querySelector('.animated-cursor');
if (cursor) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX - 10 + 'px';
    cursor.style.top = e.clientY - 10 + 'px';
  });
}

// Smooth scroll spy for nav links
window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY + 100;
  document.querySelectorAll('section').forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      const id = section.getAttribute('id');
      document.querySelectorAll('.nav-links a').forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
          link.style.color = '#60a5fa';
        }
      });
    }
  });
});

// Section reveal animation with in-view detection
const observeInView = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('section').forEach((section) => observer.observe(section));
};

// Enhanced loading animation
const addLoadingEffect = () => {
  const cards = document.querySelectorAll('.project-card, .journal-entry, .timeline-item, .contact-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.animation = `scale-in 0.6s ease-out forwards`;
    card.style.animationDelay = `${index * 0.05}s`;
  });
};

// Parallax text effect for headings
const addHeadingParallax = () => {
  const headings = document.querySelectorAll('h1, h2, h3');
  headings.forEach((heading) => {
    heading.addEventListener('mouseenter', () => {
      heading.style.letterSpacing = '0.05em';
    });
    heading.addEventListener('mouseleave', () => {
      heading.style.letterSpacing = '';
    });
  });
};

// Add ripple effect on button click
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.position = 'absolute';
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.4)';
    ripple.style.opacity = '1';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple 0.6s ease-out';
    
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Initialize all animations
observeInView();
addLoadingEffect();
addHeadingParallax();
