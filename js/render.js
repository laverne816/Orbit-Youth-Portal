/**
 * ORBIT — Render Module
 * Responsible for generating editorial layouts, opportunity cards, discovery tiles,
 * skeleton loaders, empty states, and toast notifications.
 * Strictly adheres to anti-pill metadata rules (clean unboxed text with typographic separators).
 */

import { isSaved, toggleSave, getActiveUser } from './storage.js';

/**
 * Format closing date countdown
 * e.g. "04 DAYS · 12 HRS · 28 MIN"
 */
export function formatClosingCountdown(closingDateString) {
  if (!closingDateString) return 'OPEN ENROLMENT';
  
  const target = new Date(closingDateString).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return 'CLOSED RECENTLY';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const pad = (n) => String(n).padStart(2, '0');

  if (days > 0) {
    return `CLOSES IN ${pad(days)} DAYS · ${pad(hours)} HRS`;
  } else {
    return `CLOSES IN ${pad(hours)} HRS · ${pad(minutes)} MIN`;
  }
}

/**
 * Render single opportunity card with NEXA coordinate header
 */
export function renderOpportunityCard(opp) {
  const saved = isSaved(opp.id);
  const countdown = formatClosingCountdown(opp.closingDate);
  const idNumber = opp.id.replace('ubu-', '').padStart(3, '0');

  return `
    <article class="opp-card" data-id="${opp.id}">
      <div class="opp-coordinate">
        <span>UBU / ${idNumber}</span>
        <span class="opp-coordinate-sep" aria-hidden="true">·</span>
        <span>${opp.location.toUpperCase()}</span>
        <span class="opp-coordinate-sep" aria-hidden="true">·</span>
        <span>${opp.experienceLevel.toUpperCase()}</span>
        <span class="opp-coordinate-sep" aria-hidden="true">·</span>
        <span>${opp.category.toUpperCase()}</span>
      </div>

      <div class="opp-card-header">
        <h3 class="opp-card-title">
          <a href="opportunity.html?id=${opp.id}">${escapeHtml(opp.title)}</a>
        </h3>
        <button class="bookmark-toggle-btn ${saved ? 'saved' : ''}" 
                data-save-id="${opp.id}" 
                aria-label="${saved ? 'Remove from saved' : 'Save opportunity'}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>${saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      <!-- Clean Unboxed Metadata (Zero-Pill Rule) -->
      <div class="opp-meta-unboxed">
        <span>${escapeHtml(opp.organisation)}</span>
        <span class="opp-meta-sep" aria-hidden="true">·</span>
        <span class="closing-countdown-text">${countdown}</span>
        <span class="opp-meta-sep" aria-hidden="true">·</span>
        <span class="demo-tag">DEMO LISTING</span>
        ${opp.stipendOrSalary ? `
          <span class="opp-meta-sep" aria-hidden="true">·</span>
          <span>${escapeHtml(opp.stipendOrSalary)}</span>
        ` : ''}
      </div>

      <p class="opp-card-desc">${escapeHtml(opp.shortDescription)}</p>

      <div class="opp-card-footer">
        <div class="opp-meta-unboxed" style="font-size: 12px;">
          <span>Last updated: ${escapeHtml(opp.lastUpdated || '06 October 2026')}</span>
        </div>
        <a href="opportunity.html?id=${opp.id}" class="btn btn-primary btn-sm">
          <span>MAKE YOUR MOVE</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  `;
}

/**
 * Render featured editorial showcase card (Today's Possibility or Hero Feature)
 */
export function renderFeaturedOpportunity(opp) {
  if (!opp) return '';
  const saved = isSaved(opp.id);
  const countdown = formatClosingCountdown(opp.closingDate);
  const idNumber = opp.id.replace('ubu-', '').padStart(3, '0');

  return `
    <article class="featured-opportunity-card">
      <div class="featured-badge-indicator">TODAY'S POSSIBILITY</div>
      
      <div>
        <div class="opp-coordinate" style="margin-bottom: 12px;">
          <span>UBU / ${idNumber}</span>
          <span class="opp-coordinate-sep" aria-hidden="true">·</span>
          <span>${opp.location.toUpperCase()}</span>
          <span class="opp-coordinate-sep" aria-hidden="true">·</span>
          <span>FEATURED HIGHLIGHT</span>
        </div>

        <h3 class="text-h2" style="margin-bottom: 12px;">
          <a href="opportunity.html?id=${opp.id}" style="color: inherit; text-decoration: none;">
            ${escapeHtml(opp.title)}
          </a>
        </h3>

        <!-- Unboxed Metadata -->
        <div class="opp-meta-unboxed" style="margin-bottom: 16px;">
          <span style="font-weight: 600; color: var(--text-primary);">${escapeHtml(opp.organisation)}</span>
          <span class="opp-meta-sep" aria-hidden="true">·</span>
          <span>${escapeHtml(opp.location)}</span>
          <span class="opp-meta-sep" aria-hidden="true">·</span>
          <span class="closing-countdown-text">${countdown}</span>
        </div>

        <p class="text-lead" style="margin-bottom: 24px;">
          ${escapeHtml(opp.shortDescription)}
        </p>

        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
          <a href="opportunity.html?id=${opp.id}" class="btn btn-primary">
            <span>MAKE YOUR MOVE</span>
            <span aria-hidden="true">→</span>
          </a>
          <button class="bookmark-toggle-btn ${saved ? 'saved' : ''}" data-save-id="${opp.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>${saved ? 'Saved' : 'Save Opportunity'}</span>
          </button>
        </div>
      </div>

      <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span class="section-kicker">AT A GLANCE</span>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 12px;">REWARD / STIPEND</span>
              <strong style="color: var(--text-primary); font-family: var(--font-mono);">${escapeHtml(opp.stipendOrSalary || 'Competitive')}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 12px;">PREREQUISITE</span>
              <span>${escapeHtml(opp.qualifications || 'Open entry')}</span>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 12px;">LOCATION</span>
              <span>${escapeHtml(opp.location)} (${escapeHtml(opp.province)})</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-muted);">
          <span>DEMO LISTING · Last updated: ${escapeHtml(opp.lastUpdated || '06 October 2026')}</span>
        </div>
      </div>
    </article>
  `;
}

/**
 * Render Discovery Tiles (Section H)
 */
export function renderDiscoveryTiles() {
  const tiles = [
    { num: '01', title: 'Jobs', category: 'Jobs', desc: 'Entry-level, junior developer, analyst and technician positions.' },
    { num: '02', title: 'Internships', category: 'Internships', desc: 'Paid 6-12 month workplace residencies with senior mentorship.' },
    { num: '03', title: 'Learnerships', category: 'Learnerships', desc: 'SETA-accredited classroom learning combined with practical industry stipends.' },
    { num: '04', title: 'Bursaries', category: 'Bursaries', desc: 'Tuition support, book allowances and youth venture micro-grants.' },
    { num: '05', title: 'Courses', category: 'Courses', desc: 'Free & subsidized bootcamps in AI, Cloud, Python and Digital Marketing.' },
    { num: '06', title: 'Events', category: 'Events', desc: 'Youth innovation summits, portfolio review clinics and live hackathons.' }
  ];

  return tiles.map(tile => `
    <a href="opportunities.html?category=${encodeURIComponent(tile.category)}" class="discovery-tile">
      <div>
        <span class="tile-num">${tile.num} · DISCOVERY</span>
        <h3 class="tile-title">${tile.title}</h3>
        <p class="tile-desc">${tile.desc}</p>
      </div>
      <div class="tile-footer">
        <span>EXPLORE ${tile.title.toUpperCase()}</span>
        <span aria-hidden="true">→</span>
      </div>
    </a>
  `).join('');
}

/**
 * Render Skeleton Loading Blocks
 */
export function renderSkeletons(count = 3) {
  return Array.from({ length: count }).map(() => `
    <div class="opp-card skeleton-box" style="height: 180px; opacity: 0.6;"></div>
  `).join('');
}

/**
 * Render Empty State Block
 */
export function renderEmptyState(title = 'No possibilities found', message = 'Try clearing your filters or exploring another province.', actionUrl = 'opportunities.html', actionText = 'View All Possibilities') {
  return `
    <div class="empty-state-card">
      <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="12" x2="16" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="16"></line>
      </svg>
      <h3 style="font-size: 1.25rem; font-weight: 700;">${escapeHtml(title)}</h3>
      <p style="color: var(--text-secondary); max-width: 440px; font-size: 14px;">${escapeHtml(message)}</p>
      ${actionUrl ? `
        <a href="${actionUrl}" class="btn btn-secondary btn-sm" style="margin-top: 8px;">
          ${escapeHtml(actionText)} →
        </a>
      ` : ''}
    </div>
  `;
}

/**
 * Trigger lightweight Toast notification
 */
export function showToast(message) {
  let toast = document.getElementById('orbit-toast') || document.getElementById('ubunye-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'orbit-toast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/**
 * Attach live bookmark toggle listeners to a container
 */
export function attachBookmarkListeners(containerElement) {
  if (!containerElement) return;
  const buttons = containerElement.querySelectorAll('[data-save-id]');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const oppId = btn.getAttribute('data-save-id');
      const nowSaved = toggleSave(oppId);
      
      // Update all matching buttons on the page
      document.querySelectorAll(`[data-save-id="${oppId}"]`).forEach(b => {
        if (nowSaved) {
          b.classList.add('saved');
          b.querySelector('span').textContent = 'Saved';
          const svg = b.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'currentColor');
        } else {
          b.classList.remove('saved');
          b.querySelector('span').textContent = 'Save';
          const svg = b.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'none');
        }
      });

      const activeUser = getActiveUser();
      const profileName = activeUser ? `${activeUser.name}'s profile` : 'your pathway';
      showToast(nowSaved ? `Saved to ${profileName}.` : `Removed from ${profileName}.`);
    });
  });
}

// Utility: Escape HTML to prevent injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
