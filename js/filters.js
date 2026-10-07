/**
 * ORBIT — Filters Module
 * Powers search, category, province, situation, experience, and closing date filtering.
 * Updates results live and announces counts to screen readers via aria-live.
 */

import { fetchOpportunities } from './data.js';
import { renderOpportunityCard, attachBookmarkListeners, renderEmptyState } from './render.js';

export function filterOpportunities(items, filters = {}) {
  const {
    keyword = '',
    category = 'all',
    province = 'all',
    experience = 'all',
    situation = 'all',
    closingWithin = 'all',
    skill = 'all',
    citySlug = 'all'
  } = filters;

  const kw = keyword.trim().toLowerCase();
  const now = new Date().getTime();

  return items.filter(opp => {
    // Keyword match
    if (kw) {
      const haystack = [
        opp.title,
        opp.organisation,
        opp.shortDescription,
        opp.description,
        opp.location,
        opp.province,
        ...(opp.skillsTags || []),
        ...(opp.situationTags || [])
      ].join(' ').toLowerCase();

      if (!haystack.includes(kw)) {
        return false;
      }
    }

    // Category match
    if (category && category !== 'all') {
      if (opp.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
    }

    // Province match
    if (province && province !== 'all') {
      if (opp.province.toLowerCase() !== province.toLowerCase()) {
        return false;
      }
    }

    // City Slug match
    if (citySlug && citySlug !== 'all') {
      if (opp.citySlug !== citySlug) {
        return false;
      }
    }

    // Experience Level match
    if (experience && experience !== 'all') {
      if (opp.experienceLevel.toLowerCase() !== experience.toLowerCase()) {
        return false;
      }
    }

    // Situation match
    if (situation && situation !== 'all') {
      const situations = (opp.situationTags || []).map(s => s.toLowerCase());
      if (!situations.some(s => s.includes(situation.toLowerCase()))) {
        return false;
      }
    }

    // Skill tag match
    if (skill && skill !== 'all') {
      const skills = (opp.skillsTags || []).map(s => s.toLowerCase());
      const desc = `${opp.title} ${opp.shortDescription}`.toLowerCase();
      if (!skills.some(s => s.includes(skill.toLowerCase())) && !desc.includes(skill.toLowerCase())) {
        return false;
      }
    }

    // Closing date filter
    if (closingWithin && closingWithin !== 'all') {
      const closingTime = new Date(opp.closingDate).getTime();
      const daysDiff = (closingTime - now) / (1000 * 60 * 60 * 24);
      const thresholdDays = parseInt(closingWithin, 10);
      if (!isNaN(thresholdDays) && (daysDiff < 0 || daysDiff > thresholdDays)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Initialize rotating placeholder text for search inputs
 */
export function initSearchPlaceholderRotator(inputElement) {
  if (!inputElement) return;
  const placeholders = [
    "Search 'Cape Town junior developer'...",
    "Search 'SETA learnership matric'...",
    "Search 'Data analytics internship'...",
    "Search 'Free AI & Python course'...",
    "Search 'Engineering bursary 2027'...",
    "Search 'Durban UI/UX design'..."
  ];

  let index = 0;
  setInterval(() => {
    index = (index + 1) % placeholders.length;
    inputElement.placeholder = placeholders[index];
  }, 3200);
}

/**
 * Sync URL params into filter state
 */
export function parseUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    keyword: params.get('q') || '',
    category: params.get('category') || 'all',
    province: params.get('province') || 'all',
    experience: params.get('experience') || 'all',
    situation: params.get('situation') || 'all',
    skill: params.get('skill') || 'all',
    citySlug: params.get('city') || 'all',
    closingWithin: params.get('closing') || 'all'
  };
}

/**
 * Update DOM results and announce via aria-live
 */
export function renderFilteredList(results, containerEl, countAnnouncerEl) {
  if (!containerEl) return;

  if (countAnnouncerEl) {
    const countText = results.length === 1 
      ? '1 possibility found' 
      : `${results.length} possibilities found`;
    countAnnouncerEl.textContent = countText;
  }

  if (results.length === 0) {
    containerEl.innerHTML = renderEmptyState(
      'No opportunities match these exact filters',
      'Try broadening your category or selecting "All Provinces" to uncover alternative routes.',
      '#',
      'Clear Filters'
    );
    const clearBtn = containerEl.querySelector('a');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'opportunities.html';
      });
    }
    return;
  }

  containerEl.innerHTML = results.map(renderOpportunityCard).join('');
  attachBookmarkListeners(containerEl);
}
