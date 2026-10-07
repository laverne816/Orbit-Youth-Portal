/**
 * ORBIT — Opportunity Detail Page Module
 * Handles loading detail data, recently viewed recording, interactive application checklist,
 * native share / clipboard copy fallback, and South African scam safety checks.
 */

import { getOpportunityById, fetchOpportunities } from './data.js';
import { 
  recordRecentlyViewed, 
  isSaved, 
  toggleSave, 
  getOpportunityChecklist, 
  toggleOpportunityChecklistItem,
  getActiveUser
} from './storage.js';
import { 
  formatClosingCountdown, 
  showToast, 
  renderOpportunityCard, 
  attachBookmarkListeners, 
  renderEmptyState 
} from './render.js';

export async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const container = document.getElementById('detail-page-container');
  if (!container) return;

  if (!id) {
    container.innerHTML = renderEmptyState(
      'No opportunity selected',
      'Please select an opportunity from the possibilities catalogue.',
      'opportunities.html',
      'Browse All Opportunities'
    );
    return;
  }

  const opp = await getOpportunityById(id);

  if (!opp) {
    container.innerHTML = renderEmptyState(
      'Opportunity not found',
      'The opportunity you are searching for may have concluded or been relocated.',
      'opportunities.html',
      'Browse All Opportunities'
    );
    return;
  }

  // Record this visit to recently viewed
  recordRecentlyViewed(opp.id);

  // Update page title
  document.title = `${opp.title} · ORBIT`;

  const saved = isSaved(opp.id);
  const countdown = formatClosingCountdown(opp.closingDate);
  const idNumber = opp.id.replace('ubu-', '').padStart(3, '0');
  const userChecklist = getOpportunityChecklist(opp.id);

  // Render detail layout
  container.innerHTML = `
    <!-- Hero / Header Area -->
    <div class="detail-hero-block">
      <div class="opp-coordinate" style="margin-bottom: 16px;">
        <span>UBU / ${idNumber}</span>
        <span class="opp-coordinate-sep" aria-hidden="true">·</span>
        <span>${opp.location.toUpperCase()}</span>
        <span class="opp-coordinate-sep" aria-hidden="true">·</span>
        <span>${opp.experienceLevel.toUpperCase()}</span>
        <span class="opp-coordinate-sep" aria-hidden="true">·</span>
        <span>${opp.category.toUpperCase()}</span>
      </div>

      <h1 class="text-display" style="margin-bottom: 16px;">${escapeHtml(opp.title)}</h1>

      <div class="opp-meta-unboxed" style="font-size: 15px; margin-bottom: 24px;">
        <span style="font-weight: 700; color: var(--text-primary);">${escapeHtml(opp.organisation)}</span>
        <span class="opp-meta-sep" aria-hidden="true">·</span>
        <span>${escapeHtml(opp.location)} (${escapeHtml(opp.province)})</span>
        <span class="opp-meta-sep" aria-hidden="true">·</span>
        <span class="closing-countdown-text">${countdown}</span>
        <span class="opp-meta-sep" aria-hidden="true">·</span>
        <span class="demo-tag">DEMO LISTING</span>
      </div>

      <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
        <a href="${escapeHtml(opp.applicationUrl || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg">
          <span>MAKE YOUR MOVE</span>
          <span aria-hidden="true">→</span>
        </a>
        <button id="detail-save-btn" class="bookmark-toggle-btn ${saved ? 'saved' : ''}" style="padding: 14px 20px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <span style="font-size: 14px; font-weight: 600;">${saved ? 'Saved to Pathway' : 'Save Opportunity'}</span>
        </button>
        <button id="detail-share-btn" class="btn btn-secondary btn-sm" style="padding: 14px 18px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span>Share</span>
        </button>
      </div>
    </div>

    <!-- Editorial 2-Column Content Grid -->
    <div class="detail-grid">
      <!-- Main Content Flow -->
      <div class="detail-main-flow">
        <section class="detail-section-card">
          <span class="section-kicker">01 · OVERVIEW</span>
          <h3>About the Opportunity</h3>
          <p class="text-lead" style="color: var(--text-primary); margin-bottom: 16px;">
            ${escapeHtml(opp.shortDescription)}
          </p>
          <p style="color: var(--text-secondary); line-height: 1.7;">
            ${escapeHtml(opp.description)}
          </p>
        </section>

        <section class="detail-section-card">
          <span class="section-kicker">02 · PREREQUISITES</span>
          <h3>What You'll Need &amp; Qualifications</h3>
          <div style="margin-bottom: 18px;">
            <strong style="color: var(--text-primary); display: block; margin-bottom: 6px;">Required Academic Baseline:</strong>
            <p style="color: var(--text-secondary);">${escapeHtml(opp.qualifications)}</p>
          </div>
          <div>
            <strong style="color: var(--text-primary); display: block; margin-bottom: 8px;">Target Skills Profile:</strong>
            <div class="opp-meta-unboxed">
              ${(opp.skillsTags || []).map(s => `<span>${escapeHtml(s)}</span>`).join('<span class="opp-meta-sep" aria-hidden="true">·</span>')}
            </div>
          </div>
        </section>

        <section class="detail-section-card">
          <span class="section-kicker">03 · COMPLIANCE</span>
          <h3>Eligibility Criteria</h3>
          <p style="color: var(--text-secondary); line-height: 1.7;">
            ${escapeHtml(opp.eligibility)}
          </p>
        </section>

        <section class="detail-section-card">
          <span class="section-kicker">04 · ROADMAP</span>
          <h3>Application Steps</h3>
          <ol style="padding-left: 20px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 12px; line-height: 1.6;">
            ${(opp.applicationSteps || []).map(step => `
              <li>${escapeHtml(step)}</li>
            `).join('')}
          </ol>
        </section>

        <section class="detail-section-card">
          <span class="section-kicker">05 · ECOSYSTEM</span>
          <h3>About the Organisation</h3>
          <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 12px;">
            ${escapeHtml(opp.organisationDetails || `${opp.organisation} is an active employer partner in the South African youth ecosystem.`)}
          </p>
          <div class="opp-meta-unboxed" style="font-size: 12px;">
            <span>Verified Partner Organisation</span>
            <span class="opp-meta-sep" aria-hidden="true">·</span>
            <span>Last audit: ${escapeHtml(opp.lastUpdated || '06 October 2026')}</span>
          </div>
        </section>
      </div>

      <!-- Right Column Sidebar -->
      <div class="detail-sidebar">
        <!-- Interactive Application Checklist -->
        <div class="detail-section-card">
          <span class="section-kicker">INTERACTIVE CHECKLIST</span>
          <h3 style="font-size: 1.15rem;">Required Application Documents</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
            Tick items off as you prepare. Progress is automatically saved on this device.
          </p>

          <div id="application-checklist-container">
            ${(opp.requiredDocuments || []).map((doc, index) => {
              const isChecked = !!userChecklist[index];
              return `
                <label class="checklist-item-row" style="cursor: pointer;">
                  <input type="checkbox" 
                         class="milestone-checkbox" 
                         data-doc-index="${index}" 
                         ${isChecked ? 'checked' : ''} />
                  <span style="${isChecked ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                    ${escapeHtml(doc)}
                  </span>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <!-- South African Youth Scam Safety Panel -->
        <div class="safety-check-panel">
          <h4>
            <span aria-hidden="true">⚠️</span>
            <span>Real Or Red Flag? Opportunity Safety Check</span>
          </h4>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
            South African youth are frequently targeted by application fee and interview scams. Protect yourself:
          </p>
          <ul class="safety-rules-list">
            <li><strong>1. Never pay to apply:</strong> Legitimate SA employers, SETAs, and bursaries never ask for application fees or "uniform deposits".</li>
            <li><strong>2. Verify the organisation:</strong> Ensure emails come from corporate domains, not generic free webmail.</li>
            <li><strong>3. Never share banking PINs or OTPs:</strong> A bursary or employer only needs bank confirmation for stipend deposit.</li>
            <li><strong>4. Check interview locations:</strong> Legitimate interviews occur at registered corporate offices or verified video links.</li>
          </ul>
        </div>

        <!-- Quick Summary Card -->
        <div class="detail-section-card" style="font-size: 13px;">
          <h4 style="font-size: 14px; margin-bottom: 12px; font-family: var(--font-mono);">SNAPSHOT METRICS</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div>
              <span style="color: var(--text-muted); display: block;">Remuneration / Support:</span>
              <strong style="color: var(--color-teal); font-family: var(--font-mono); font-size: 15px;">
                ${escapeHtml(opp.stipendOrSalary || 'Not specified')}
              </strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Closing Date:</span>
              <strong>${new Date(opp.closingDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Identifier:</span>
              <span class="text-mono">UBU/${idNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Possibilities -->
    <section class="section" style="padding-top: 20px;">
      <span class="section-kicker">EXPLORE ALTERNATE ROUTES</span>
      <h2 class="text-h2" style="margin-bottom: 24px;">Similar Possibilities You Might Like</h2>
      <div id="related-opportunities-grid" class="opportunities-editorial-layout"></div>
    </section>
  `;

  // Attach Detail Save Listener
  const detailSaveBtn = document.getElementById('detail-save-btn');
  if (detailSaveBtn) {
    detailSaveBtn.addEventListener('click', () => {
      const nowSaved = toggleSave(opp.id);
      const activeUser = getActiveUser();
      const profileLabel = activeUser ? `${activeUser.name}'s profile` : 'your pathway';
      if (nowSaved) {
        detailSaveBtn.classList.add('saved');
        detailSaveBtn.querySelector('span').textContent = 'Saved to Pathway';
        detailSaveBtn.querySelector('svg').setAttribute('fill', 'currentColor');
        showToast(`Saved to ${profileLabel}.`);
      } else {
        detailSaveBtn.classList.remove('saved');
        detailSaveBtn.querySelector('span').textContent = 'Save Opportunity';
        detailSaveBtn.querySelector('svg').setAttribute('fill', 'none');
        showToast(`Removed from ${profileLabel}.`);
      }
    });
  }

  // Attach Share Listener
  const detailShareBtn = document.getElementById('detail-share-btn');
  if (detailShareBtn) {
    detailShareBtn.addEventListener('click', async () => {
      const shareData = {
        title: `${opp.title} — ORBIT`,
        text: `Check out this opportunity: ${opp.title} at ${opp.organisation} on ORBIT`,
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          // User cancelled or share failed, fallback to copy
          copyLinkToClipboard();
        }
      } else {
        copyLinkToClipboard();
      }
    });
  }

  function copyLinkToClipboard() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copied to clipboard.');
      }).catch(() => {
        showToast('Link copied.');
      });
    } else {
      showToast('Link copied.');
    }
  }

  // Attach Interactive Checklist Listeners
  const checklistContainer = document.getElementById('application-checklist-container');
  if (checklistContainer) {
    checklistContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const index = checkbox.getAttribute('data-doc-index');
        toggleOpportunityChecklistItem(opp.id, index);
        const span = checkbox.nextElementSibling;
        if (span) {
          if (checkbox.checked) {
            span.style.textDecoration = 'line-through';
            span.style.opacity = '0.6';
          } else {
            span.style.textDecoration = 'none';
            span.style.opacity = '1';
          }
        }
      });
    });
  }

  // Render Related Opportunities (same category or province, excluding current)
  const allOpps = await fetchOpportunities();
  const related = allOpps
    .filter(item => item.id !== opp.id && (item.category === opp.category || item.province === opp.province))
    .slice(0, 3);

  const relatedGrid = document.getElementById('related-opportunities-grid');
  if (relatedGrid) {
    if (related.length > 0) {
      relatedGrid.innerHTML = related.map(renderOpportunityCard).join('');
      attachBookmarkListeners(relatedGrid);
    } else {
      relatedGrid.innerHTML = '<p style="color: var(--text-muted);">No alternate opportunities in this category right now.</p>';
    }
  }
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
