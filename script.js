const state = {
  projects: [],
  activeCategory: 'All',
};

const elements = {
  projectsContainer: document.getElementById('projects-container'),
  timelineContainer: document.getElementById('timeline-container'),
  journalContainer: document.getElementById('journal-container'),
  projectCount: document.getElementById('project-count'),
  projectFilters: document.getElementById('project-filters'),
  navToggle: document.querySelector('.nav-toggle'),
  navLinks: document.querySelector('.nav-links'),
};

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

loadProjects();
