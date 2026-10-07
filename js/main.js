/**
 * ORBIT — Main Application Controller
 * Handles global navigation, mobile drawer, theme toggles, saved counter,
 * User Authentication (Sign In, Sign Up, Profile management),
 * Ask ORBIT rule-based keyword assistant, and Career Toolkit accessible dialogs.
 */

import { 
  getTheme, 
  setTheme, 
  getSavedCount, 
  getActiveUser, 
  signInUser, 
  signInDemoUser, 
  registerUser, 
  signOutUser, 
  updateUserProfile,
  getRouteProgress,
  getUnlockedAchievements
} from './storage.js';
import { fetchOpportunities } from './data.js';
import { filterOpportunities } from './filters.js';
import { renderOpportunityCard, attachBookmarkListeners, showToast } from './render.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalTheme();
  initNavigation();
  initSavedBadge();
  initAuthAndProfile();
  initAskOrbitAssistant();
  initCareerToolkitModals();
});

/**
 * Initialize Dark / Light theme toggle & persistence
 */
function initGlobalTheme() {
  const currentTheme = getTheme();
  document.documentElement.setAttribute('data-theme', currentTheme);

  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach(btn => {
    updateThemeIcon(btn, currentTheme);

    btn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme');
      const nextTheme = active === 'light' ? 'dark' : 'light';
      setTheme(nextTheme);
      toggleBtns.forEach(b => updateThemeIcon(b, nextTheme));
    });
  });
}

function updateThemeIcon(btn, theme) {
  if (theme === 'light') {
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    btn.setAttribute('aria-label', 'Switch to dark theme');
  } else {
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="21" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    btn.setAttribute('aria-label', 'Switch to light theme');
  }
}

/**
 * Navigation & Mobile Drawer
 */
function initNavigation() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const backdrop = document.querySelector('.mobile-backdrop');
  const closeBtn = document.querySelector('.mobile-drawer-close');

  function openMenu() {
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  // Active link highlighters
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-drawer-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Global ESC key listener for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      document.querySelectorAll('.modal-overlay.open').forEach(modal => {
        modal.classList.remove('open');
      });
      const dropdown = document.getElementById('profile-dropdown-menu');
      if (dropdown) dropdown.classList.remove('show');
    }
  });
}

/**
 * Saved Counter in Navigation
 */
function initSavedBadge() {
  function updateBadges(count) {
    document.querySelectorAll('.saved-count-bubble').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }

  updateBadges(getSavedCount());

  const handleSavedChange = (e) => {
    updateBadges(e.detail.count);
  };
  window.addEventListener('orbit:saved-changed', handleSavedChange);
  window.addEventListener('ubunye:saved-changed', handleSavedChange);
}

/**
 * ==========================================================================
 * USER AUTHENTICATION & PROFILE SYSTEM
 * ==========================================================================
 */
function initAuthAndProfile() {
  // Inject Auth Modal & Profile Modal into DOM if not already present
  injectAuthModalHtml();
  injectProfileModalHtml();

  // Render header auth button / profile badge
  renderNavAuthSection();

  const handleAuthChange = () => {
    renderNavAuthSection();
  };
  window.addEventListener('orbit:auth-changed', handleAuthChange);
  window.addEventListener('ubunye:auth-changed', handleAuthChange);

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profile-dropdown-menu');
    const profileBtn = document.getElementById('nav-user-profile-btn');
    if (dropdown && dropdown.classList.contains('show')) {
      if (!dropdown.contains(e.target) && !profileBtn?.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    }
  });
}

function renderNavAuthSection() {
  const actionsContainer = document.querySelector('.nav-actions');
  if (!actionsContainer) return;

  const existingAuthGroup = document.getElementById('nav-auth-group');
  if (existingAuthGroup) {
    existingAuthGroup.remove();
  }

  const user = getActiveUser();
  const group = document.createElement('div');
  group.id = 'nav-auth-group';
  group.style.display = 'inline-flex';
  group.style.alignItems = 'center';
  group.style.position = 'relative';

  if (user) {
    // User is logged in
    group.innerHTML = `
      <button id="nav-user-profile-btn" class="user-profile-badge" title="Account: ${escapeHtml(user.name)}" aria-label="Open profile options">
        <span class="user-avatar-circle">${escapeHtml(user.avatarInitials)}</span>
        <span class="user-name-text">${escapeHtml(user.name.split(' ')[0])}</span>
        <span class="user-status-dot"></span>
      </button>

      <div id="profile-dropdown-menu" class="profile-dropdown-menu">
        <div class="dropdown-user-header">
          <strong style="color: var(--text-primary); display: block; font-size: 14px;">${escapeHtml(user.name)}</strong>
          <span style="font-size: 12px; color: var(--color-mint); display: block; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(user.email)}</span>
          <span style="font-size: 11px; color: var(--text-secondary); display: block; margin-top: 4px;">📍 ${escapeHtml(user.city || user.province)} · ${escapeHtml(user.situation)}</span>
        </div>
        <a href="saved.html" class="dropdown-action-btn">
          <span>⭐ My Saved Opportunities (${user.savedOpps ? user.savedOpps.length : 0})</span>
        </a>
        <button id="dropdown-open-profile-btn" class="dropdown-action-btn">
          <span>👤 View &amp; Edit Profile</span>
        </button>
        <button id="dropdown-signout-btn" class="dropdown-action-btn" style="color: #f87171;">
          <span>🚪 Sign Out</span>
        </button>
      </div>
    `;

    // Dropdown toggle
    const profileBtn = group.querySelector('#nav-user-profile-btn');
    const dropdownMenu = group.querySelector('#profile-dropdown-menu');
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });

    // Profile Modal trigger from dropdown
    const openProfileBtn = group.querySelector('#dropdown-open-profile-btn');
    openProfileBtn.addEventListener('click', () => {
      dropdownMenu.classList.remove('show');
      openProfileModal();
    });

    // Sign out trigger
    const signoutBtn = group.querySelector('#dropdown-signout-btn');
    signoutBtn.addEventListener('click', () => {
      dropdownMenu.classList.remove('show');
      signOutUser();
      showToast('Signed out of profile. Switched to guest mode.');
    });
  } else {
    // User is guest
    group.innerHTML = `
      <button id="nav-auth-btn" class="nav-auth-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Sign In</span>
      </button>
    `;

    const authBtn = group.querySelector('#nav-auth-btn');
    authBtn.addEventListener('click', () => {
      openAuthModal('signin');
    });
  }

  // Insert before the theme toggle
  const themeBtn = actionsContainer.querySelector('.theme-toggle-btn');
  if (themeBtn) {
    actionsContainer.insertBefore(group, themeBtn);
  } else {
    actionsContainer.appendChild(group);
  }

  // Also update mobile drawer with auth state
  renderMobileDrawerAuth(user);
}

function renderMobileDrawerAuth(user) {
  const drawer = document.querySelector('.mobile-nav-drawer');
  if (!drawer) return;

  let mobileAuthBox = document.getElementById('mobile-drawer-auth-box');
  if (!mobileAuthBox) {
    mobileAuthBox = document.createElement('div');
    mobileAuthBox.id = 'mobile-drawer-auth-box';
    mobileAuthBox.style.padding = '16px 0';
    mobileAuthBox.style.borderBottom = '1px solid var(--border-subtle)';
    const header = drawer.querySelector('.mobile-drawer-header');
    if (header && header.nextSibling) {
      drawer.insertBefore(mobileAuthBox, header.nextSibling);
    }
  }

  if (user) {
    mobileAuthBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <span class="user-avatar-circle" style="width: 38px; height: 38px; font-size: 14px;">${escapeHtml(user.avatarInitials)}</span>
        <div>
          <strong style="color: var(--text-primary); display: block; font-size: 15px;">${escapeHtml(user.name)}</strong>
          <span style="font-size: 12px; color: var(--color-mint);">${escapeHtml(user.situation)}</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="mobile-profile-edit-btn" class="btn btn-secondary btn-sm" style="flex: 1;">Edit Profile</button>
        <button id="mobile-signout-btn" class="btn btn-sm" style="background: rgba(244, 63, 94, 0.15); color: #f87171;">Sign Out</button>
      </div>
    `;

    mobileAuthBox.querySelector('#mobile-profile-edit-btn').addEventListener('click', () => {
      drawer.classList.remove('open');
      const backdrop = document.querySelector('.mobile-backdrop');
      if (backdrop) backdrop.classList.remove('open');
      document.body.style.overflow = '';
      openProfileModal();
    });

    mobileAuthBox.querySelector('#mobile-signout-btn').addEventListener('click', () => {
      drawer.classList.remove('open');
      const backdrop = document.querySelector('.mobile-backdrop');
      if (backdrop) backdrop.classList.remove('open');
      document.body.style.overflow = '';
      signOutUser();
      showToast('Signed out of profile.');
    });
  } else {
    mobileAuthBox.innerHTML = `
      <button id="mobile-signin-btn" class="btn btn-primary" style="width: 100%;">
        <span>Sign In / Create Profile</span>
      </button>
    `;
    mobileAuthBox.querySelector('#mobile-signin-btn').addEventListener('click', () => {
      drawer.classList.remove('open');
      const backdrop = document.querySelector('.mobile-backdrop');
      if (backdrop) backdrop.classList.remove('open');
      document.body.style.overflow = '';
      openAuthModal('signin');
    });
  }
}

/**
 * Inject Auth Modal HTML (Sign In & Sign Up)
 */
function injectAuthModalHtml() {
  if (document.getElementById('auth-modal')) return;

  const modalHtml = `
    <div id="auth-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div class="modal-window">
        <button id="auth-modal-close" class="modal-close-btn" aria-label="Close modal">✕</button>
        
        <span class="section-kicker">PERSONAL IDENTITY</span>
        <h2 id="auth-modal-title" class="text-h3" style="margin-bottom: 16px;">ORBIT Profile Access</h2>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
          Create your profile to save opportunities, track your roadmap progress, and discover pathways matched to your exact coordinates.
        </p>

        <!-- Auth Tabs: Sign In / Create Account -->
        <div class="auth-tabs-row">
          <button id="tab-btn-signin" class="auth-tab-btn active" type="button">Sign In</button>
          <button id="tab-btn-signup" class="auth-tab-btn" type="button">Create Account</button>
        </div>

        <!-- Tab 1: SIGN IN FORM -->
        <form id="auth-signin-form" novalidate>
          <div class="form-group">
            <label for="signin-email" class="form-label">Email Address *</label>
            <input type="email" id="signin-email" class="form-control" placeholder="e.g. kagiso@orbit.org.za" required />
            <span id="signin-email-err" class="form-error-msg"></span>
          </div>

          <div class="form-group">
            <label for="signin-password" class="form-label">Password *</label>
            <input type="password" id="signin-password" class="form-control" placeholder="••••••••" required />
            <span id="signin-password-err" class="form-error-msg"></span>
          </div>

          <div id="signin-general-err" class="form-error-msg" style="margin-bottom: 14px;"></div>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-bottom: 12px;">
            <span>Sign In to My Profile</span>
            <span aria-hidden="true">→</span>
          </button>

          <!-- 1-Click Demo Profile Button -->
          <div style="padding-top: 14px; border-top: 1px solid var(--border-subtle); margin-top: 14px; text-align: center;">
            <span style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 8px;">TRY WITHOUT REGISTRATION:</span>
            <button id="auth-demo-signin-btn" type="button" class="btn btn-secondary btn-sm" style="width: 100%;">
              ⚡ Quick Sign In as Demo User (Kagiso Motsepe)
            </button>
          </div>
        </form>

        <!-- Tab 2: CREATE ACCOUNT FORM -->
        <form id="auth-signup-form" style="display: none;" novalidate>
          <div class="form-group">
            <label for="signup-name" class="form-label">Full Name *</label>
            <input type="text" id="signup-name" class="form-control" placeholder="e.g. Naledi Dlamini" required />
            <span id="signup-name-err" class="form-error-msg"></span>
          </div>

          <div class="form-group">
            <label for="signup-email" class="form-label">Email Address *</label>
            <input type="email" id="signup-email" class="form-control" placeholder="e.g. naledi@example.co.za" required />
            <span id="signup-email-err" class="form-error-msg"></span>
          </div>

          <div class="form-group">
            <label for="signup-password" class="form-label">Password * (min 6 characters)</label>
            <input type="password" id="signup-password" class="form-control" placeholder="••••••••" required />
            <span id="signup-password-err" class="form-error-msg"></span>
          </div>

          <div class="form-group">
            <label for="signup-situation" class="form-label">Current Situation *</label>
            <select id="signup-situation" class="form-control" style="cursor: pointer;">
              <option value="A Matric learner">A Matric learner</option>
              <option value="A TVET student">A TVET student</option>
              <option value="A university student">A university student</option>
              <option value="A graduate" selected>A graduate</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Changing careers">Changing careers</option>
              <option value="Looking for experience">Looking for experience</option>
              <option value="Starting a business">Starting a business</option>
            </select>
          </div>

          <div class="form-group">
            <label for="signup-city" class="form-label">City / Province *</label>
            <select id="signup-city" class="form-control" style="cursor: pointer;">
              <option value="Johannesburg, GP" selected>Johannesburg, GP</option>
              <option value="Cape Town, WC">Cape Town, WC</option>
              <option value="Pretoria, GP">Pretoria, GP</option>
              <option value="Durban, KZN">Durban, KZN</option>
              <option value="Gqeberha, EC">Gqeberha, EC</option>
              <option value="Bloemfontein, FS">Bloemfontein, FS</option>
              <option value="Polokwane, LP">Polokwane, LP</option>
              <option value="Mbombela, MP">Mbombela, MP</option>
              <option value="Kimberley, NC">Kimberley, NC</option>
              <option value="East London, EC">East London, EC</option>
            </select>
          </div>

          <div id="signup-general-err" class="form-error-msg" style="margin-bottom: 14px;"></div>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
            <span>Create Profile &amp; Save Opportunities</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Wire Modal Controls
  const authModal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('auth-modal-close');
  const tabSignIn = document.getElementById('tab-btn-signin');
  const tabSignUp = document.getElementById('tab-btn-signup');
  const formSignIn = document.getElementById('auth-signin-form');
  const formSignUp = document.getElementById('auth-signup-form');
  const demoBtn = document.getElementById('auth-demo-signin-btn');

  closeBtn.addEventListener('click', () => authModal.classList.remove('open'));
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.classList.remove('open');
  });

  tabSignIn.addEventListener('click', () => {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    formSignIn.style.display = 'block';
    formSignUp.style.display = 'none';
  });

  tabSignUp.addEventListener('click', () => {
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    formSignIn.style.display = 'none';
    formSignUp.style.display = 'block';
  });

  // Handle Demo 1-Click login
  demoBtn.addEventListener('click', () => {
    const user = signInDemoUser();
    authModal.classList.remove('open');
    showToast(`Signed in as ${user.name}! Opportunities saved will sync to your profile.`);
  });

  // Handle Sign In submit
  formSignIn.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const errEl = document.getElementById('signin-general-err');
    errEl.textContent = '';
    errEl.classList.remove('visible');

    if (!email || !password) {
      errEl.textContent = 'Please enter both your email address and password.';
      errEl.classList.add('visible');
      return;
    }

    try {
      const user = signInUser(email, password);
      authModal.classList.remove('open');
      showToast(`Welcome back, ${user.name}!`);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('visible');
    }
  });

  // Handle Create Account submit
  formSignUp.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const situation = document.getElementById('signup-situation').value;
    const cityLocation = document.getElementById('signup-city').value;
    const [city, province] = cityLocation.split(', ');
    const errEl = document.getElementById('signup-general-err');

    errEl.textContent = '';
    errEl.classList.remove('visible');

    if (!name || name.length < 2) {
      errEl.textContent = 'Please provide your full name.';
      errEl.classList.add('visible');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errEl.textContent = 'Please enter a valid email address.';
      errEl.classList.add('visible');
      return;
    }

    if (!password || password.length < 6) {
      errEl.textContent = 'Password must be at least 6 characters.';
      errEl.classList.add('visible');
      return;
    }

    try {
      const user = registerUser({
        name,
        email,
        password,
        situation,
        province: province || 'Gauteng',
        city: city || 'Johannesburg'
      });
      authModal.classList.remove('open');
      showToast(`Account created! Welcome to ORBIT, ${user.name}.`);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('visible');
    }
  });
}

function openAuthModal(tab = 'signin') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  const tabSignIn = document.getElementById('tab-btn-signin');
  const tabSignUp = document.getElementById('tab-btn-signup');
  const formSignIn = document.getElementById('auth-signin-form');
  const formSignUp = document.getElementById('auth-signup-form');

  if (tab === 'signup') {
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    formSignIn.style.display = 'none';
    formSignUp.style.display = 'block';
  } else {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    formSignIn.style.display = 'block';
    formSignUp.style.display = 'none';
  }

  modal.classList.add('open');
}

/**
 * Inject Profile View & Edit Modal HTML
 */
function injectProfileModalHtml() {
  if (document.getElementById('profile-modal')) return;

  const modalHtml = `
    <div id="profile-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
      <div class="modal-window">
        <button id="profile-modal-close" class="modal-close-btn" aria-label="Close profile">✕</button>
        
        <span class="section-kicker">PERSONAL DOSSIER</span>
        <h2 id="profile-modal-title" class="text-h3" style="margin-bottom: 20px;">My Career Profile</h2>

        <div id="profile-modal-body"></div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const profileModal = document.getElementById('profile-modal');
  const closeBtn = document.getElementById('profile-modal-close');
  closeBtn.addEventListener('click', () => profileModal.classList.remove('open'));
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.classList.remove('open');
  });
}

function openProfileModal() {
  const user = getActiveUser();
  if (!user) {
    openAuthModal('signin');
    return;
  }

  const modal = document.getElementById('profile-modal');
  const body = document.getElementById('profile-modal-body');
  if (!modal || !body) return;

  const routeProgress = getRouteProgress();
  const completedMilestones = Object.values(routeProgress).filter(Boolean).length;
  const savedCount = (user.savedOpps || []).length;
  const achievements = getUnlockedAchievements();

  body.innerHTML = `
    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle);">
      <div class="user-profile-large-avatar">${escapeHtml(user.avatarInitials)}</div>
      <div>
        <h3 style="font-size: 1.4rem; color: var(--text-primary); margin-bottom: 4px;">${escapeHtml(user.name)}</h3>
        <span style="font-size: 13px; color: var(--color-mint); display: block;">${escapeHtml(user.email)}</span>
        <span style="font-size: 12px; color: var(--text-muted); display: block; margin-top: 4px;">Member since ${new Date(user.createdAt || Date.now()).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}</span>
      </div>
    </div>

    <!-- Personal Profile Snapshot Stats -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; text-align: center;">
      <div style="background: var(--bg-surface-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 20px; font-weight: 700; color: var(--color-mint); display: block;" class="text-mono">${savedCount}</span>
        <span style="font-size: 11px; color: var(--text-secondary);">Saved Possibilities</span>
      </div>
      <div style="background: var(--bg-surface-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 20px; font-weight: 700; color: var(--color-teal); display: block;" class="text-mono">${completedMilestones}/6</span>
        <span style="font-size: 11px; color: var(--text-secondary);">Route Milestones</span>
      </div>
      <div style="background: var(--bg-surface-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <span style="font-size: 20px; font-weight: 700; color: var(--accent-amber); display: block;" class="text-mono">${achievements.length}</span>
        <span style="font-size: 11px; color: var(--text-secondary);">Badges Unlocked</span>
      </div>
    </div>

    <!-- Edit Profile Form -->
    <form id="profile-edit-form" novalidate>
      <div class="form-group">
        <label for="edit-profile-name" class="form-label">Full Name</label>
        <input type="text" id="edit-profile-name" class="form-control" value="${escapeHtml(user.name)}" required />
      </div>

      <div class="form-group">
        <label for="edit-profile-situation" class="form-label">Current Situation</label>
        <select id="edit-profile-situation" class="form-control" style="cursor: pointer;">
          <option value="A Matric learner" ${user.situation === 'A Matric learner' ? 'selected' : ''}>A Matric learner</option>
          <option value="A TVET student" ${user.situation === 'A TVET student' ? 'selected' : ''}>A TVET student</option>
          <option value="A university student" ${user.situation === 'A university student' ? 'selected' : ''}>A university student</option>
          <option value="A graduate" ${user.situation === 'A graduate' ? 'selected' : ''}>A graduate</option>
          <option value="Unemployed" ${user.situation === 'Unemployed' ? 'selected' : ''}>Unemployed</option>
          <option value="Changing careers" ${user.situation === 'Changing careers' ? 'selected' : ''}>Changing careers</option>
          <option value="Looking for experience" ${user.situation === 'Looking for experience' ? 'selected' : ''}>Looking for experience</option>
          <option value="Starting a business" ${user.situation === 'Starting a business' ? 'selected' : ''}>Starting a business</option>
        </select>
      </div>

      <div class="form-group">
        <label for="edit-profile-city" class="form-label">Location (City / Province)</label>
        <input type="text" id="edit-profile-city" class="form-control" value="${escapeHtml(user.city || user.province || 'Johannesburg, GP')}" />
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button type="submit" class="btn btn-primary" style="flex: 1;">
          <span>Save Changes</span>
        </button>
        <a href="saved.html" class="btn btn-secondary">
          <span>Go to Saved Pathway →</span>
        </a>
      </div>
    </form>
  `;

  const editForm = body.querySelector('#profile-edit-form');
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('edit-profile-name').value.trim();
    const newSituation = document.getElementById('edit-profile-situation').value;
    const newCity = document.getElementById('edit-profile-city').value.trim();

    updateUserProfile({
      name: newName,
      situation: newSituation,
      city: newCity
    });

    modal.classList.remove('open');
    showToast('Profile updated successfully!');
  });

  modal.classList.add('open');
}

/**
 * Ask ORBIT Rule-Based Conversational Discovery Assistant
 * Parses natural inquiries like "I'm a recent graduate in Cape Town looking for an internship"
 */
function initAskOrbitAssistant() {
  const triggerBtn = document.getElementById('ask-orbit-trigger') || document.getElementById('ask-ubunye-trigger');
  const modal = document.getElementById('ask-orbit-modal') || document.getElementById('ask-ubunye-modal');
  const closeBtn = document.getElementById('ask-orbit-close') || document.getElementById('ask-ubunye-close');
  const form = document.getElementById('ask-orbit-form') || document.getElementById('ask-ubunye-form');
  const input = document.getElementById('ask-orbit-input') || document.getElementById('ask-ubunye-input');
  const responseSlot = document.getElementById('ask-orbit-response') || document.getElementById('ask-ubunye-response');

  if (!modal) return;

  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      modal.classList.add('open');
      if (input) input.focus();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (form && input && responseSlot) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = input.value.trim().toLowerCase();
      if (!query) return;

      responseSlot.innerHTML = '<div class="skeleton-box" style="height: 100px; margin-top: 16px;"></div>';

      const all = await fetchOpportunities();

      // Rule-based keyword matching
      let category = 'all';
      if (query.includes('job') || query.includes('work')) category = 'Jobs';
      else if (query.includes('intern') || query.includes('residency')) category = 'Internships';
      else if (query.includes('learnership') || query.includes('seta')) category = 'Learnerships';
      else if (query.includes('bursary') || query.includes('fund') || query.includes('scholarship')) category = 'Bursaries';
      else if (query.includes('course') || query.includes('learn') || query.includes('bootcamp')) category = 'Courses';
      else if (query.includes('event') || query.includes('summit') || query.includes('hackathon')) category = 'Events';

      let province = 'all';
      if (query.includes('cape town') || query.includes('western cape')) province = 'Western Cape';
      else if (query.includes('joburg') || query.includes('johannesburg') || query.includes('gauteng') || query.includes('pretoria')) province = 'Gauteng';
      else if (query.includes('durban') || query.includes('kzn') || query.includes('natal')) province = 'KwaZulu-Natal';
      else if (query.includes('gqeberha') || query.includes('eastern cape') || query.includes('east london')) province = 'Eastern Cape';
      else if (query.includes('bloemfontein') || query.includes('free state')) province = 'Free State';
      else if (query.includes('polokwane') || query.includes('limpopo')) province = 'Limpopo';
      else if (query.includes('kimberley') || query.includes('northern cape')) province = 'Northern Cape';
      else if (query.includes('mbombela') || query.includes('mpumalanga')) province = 'Mpumalanga';

      let experience = 'all';
      if (query.includes('graduate')) experience = 'Graduate';
      else if (query.includes('no experience') || query.includes('beginner')) experience = 'No Experience Required';
      else if (query.includes('entry') || query.includes('junior')) experience = 'Entry Level';
      else if (query.includes('matric')) experience = 'Student / Matric';

      const matches = filterOpportunities(all, {
        keyword: query.split(' ').filter(w => w.length > 3).join(' '),
        category,
        province,
        experience
      });

      const displayList = matches.length > 0 ? matches.slice(0, 3) : all.slice(0, 3);

      responseSlot.innerHTML = `
        <div style="margin-top: 20px; padding: 18px; background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
          <p style="font-size: 14px; color: var(--text-primary); margin-bottom: 12px;">
            <strong>ORBIT Recommendation:</strong> Found ${displayList.length} relevant paths matching your coordinates.
          </p>
          <div class="opportunities-editorial-layout">
            ${displayList.map(renderOpportunityCard).join('')}
          </div>
        </div>
      `;

      attachBookmarkListeners(responseSlot);
    });
  }
}

/**
 * Career Toolkit Modals (Feature V)
 */
function initCareerToolkitModals() {
  const modal = document.getElementById('toolkit-modal');
  const titleEl = document.getElementById('toolkit-modal-title');
  const contentEl = document.getElementById('toolkit-modal-content');
  const closeBtn = document.getElementById('toolkit-modal-close');

  if (!modal || !titleEl || !contentEl) return;

  const TOOLKIT_DATA = {
    'cv': {
      title: 'South African Youth CV Blueprint',
      html: `
        <p style="color: var(--text-secondary); margin-bottom: 16px;">
          South African recruiters screen hundreds of CVs per opening. Stand out with these proven conventions:
        </p>
        <ul style="padding-left: 20px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
          <li><strong>2-Page Maximum:</strong> Keep your layout strictly under 2 pages. Remove primary school records.</li>
          <li><strong>No Photos or ID Numbers on Public Portals:</strong> Protect your personal security. Share certified copies only upon formal request.</li>
          <li><strong>Quantify What You Did:</strong> Instead of "Responsible for social media", write "Created 12 video clips reaching 4,000 community views".</li>
          <li><strong>Projects Over Experience:</strong> If you lack corporate experience, put a bold <em>"Featured Projects"</em> section at the top.</li>
        </ul>
      `
    },
    'interview': {
      title: 'Interview Preparation & Contingency Guide',
      html: `
        <p style="color: var(--text-secondary); margin-bottom: 16px;">
          Confidence comes from structured preparation. Use the STAR formula (Situation, Task, Action, Result).
        </p>
        <ul style="padding-left: 20px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
          <li><strong>Load Shedding / Connectivity Plan:</strong> Check your local area schedule. Ensure your phone is charged with hotspot data backup.</li>
          <li><strong>The First 90 Seconds:</strong> Prepare a 60-second summary answering "Tell us about yourself" focused on what you love building.</li>
          <li><strong>Ask Great Questions:</strong> Ask them: <em>"What does success look like for this role in the first 90 days?"</em></li>
        </ul>
      `
    },
    'portfolio': {
      title: 'Building a Zero-Experience Tech Portfolio',
      html: `
        <p style="color: var(--text-secondary); margin-bottom: 16px;">
          You do not need prior employment to have a standout portfolio.
        </p>
        <ul style="padding-left: 20px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
          <li><strong>Solve a Real Problem:</strong> Don't just clone Netflix. Build a taxi route calculator or a local community club website.</li>
          <li><strong>Live Hosted Demos:</strong> Always provide a live clickable URL (Vercel, GitHub Pages, Netlify) — not just code files.</li>
          <li><strong>Clear README:</strong> Include screenshots, tech stack choices, and what hurdles you overcame.</li>
        </ul>
      `
    },
    'linkedin': {
      title: 'LinkedIn & Professional Networking',
      html: `
        <p style="color: var(--text-secondary); margin-bottom: 16px;">
          70% of junior hires in South Africa happen through direct outreach and referral networks.
        </p>
        <ul style="padding-left: 20px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
          <li><strong>Headline Formula:</strong> [Aspiring Role] · [Key Skills] · [Current Project / Mission]</li>
          <li><strong>Engage with Local Leaders:</strong> Comment thoughtfully on posts from South African engineering and product leaders.</li>
          <li><strong>Share Your Learning Journey:</strong> Post weekly updates: "What I learned this week building with React/Python".</li>
        </ul>
      `
    }
  };

  document.querySelectorAll('[data-toolkit-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-toolkit-open');
      const item = TOOLKIT_DATA[key];
      if (item) {
        titleEl.textContent = item.title;
        contentEl.innerHTML = item.html;
        modal.classList.add('open');
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
