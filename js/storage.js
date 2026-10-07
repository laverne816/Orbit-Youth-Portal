/**
 * ORBIT — Storage Module
 * Manages client-side persistence with localStorage:
 * - User Accounts (Sign in, Sign up, Active Profile, Multi-user support)
 * - User-scoped Bookmarked opportunities (saved to active profile)
 * - Recently viewed items (last 5)
 * - Theme preferences (dark/light)
 * - "My Route" milestone checklist (scoped to active user)
 * - Opportunity application checklists (scoped to active user)
 * - Career Passport achievements
 * - Discovered Possibility DNA (scoped to active user)
 */

const STORAGE_KEYS = {
  USERS: 'orbit_registered_users',
  ACTIVE_USER_ID: 'orbit_active_user_id',
  SAVED: 'orbit_saved_opportunities',
  RECENT: 'orbit_recently_viewed',
  THEME: 'orbit_theme_preference',
  ROUTE: 'orbit_my_route_progress',
  CHECKLISTS: 'orbit_app_checklists',
  PASSPORT: 'orbit_passport_achievements',
  DNA: 'orbit_possibility_dna'
};

// Default starter demo user
const DEMO_USER = {
  id: 'user_demo_01',
  name: 'Kagiso Motsepe',
  email: 'kagiso@orbit.org.za',
  password: 'password123',
  situation: 'A graduate',
  province: 'Gauteng',
  city: 'Johannesburg',
  avatarInitials: 'KM',
  savedOpps: ['ubu-001', 'ubu-002', 'ubu-005'],
  routeProgress: {
    'skill_identified': true,
    'course_enrolled': true,
    'cv_updated': true,
    'portfolio_drafted': false,
    'first_application': false,
    'network_connected': false
  },
  dna: {
    tech: 85,
    creative: 62,
    business: 48,
    leadership: 54,
    people: 40,
    archetype: 'THE BUILDER'
  },
  createdAt: '2026-09-15T08:00:00Z'
};

function safeGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    // Legacy migration check for prior sessions
    const legacyKey = key.replace(/^orbit_/, 'ubunye_');
    if (legacyKey !== key) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        localStorage.setItem(key, legacyRaw);
        return JSON.parse(legacyRaw);
      }
    }
    return defaultValue;
  } catch (e) {
    console.warn('Storage read failed:', e);
    return defaultValue;
  }
}

function dispatchStorageEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(`orbit:${name}`, { detail }));
  window.dispatchEvent(new CustomEvent(`ubunye:${name}`, { detail }));
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

/* ==========================================================================
   USER AUTHENTICATION & PROFILES
   ========================================================================== */

export function getAllUsers() {
  const users = safeGet(STORAGE_KEYS.USERS, []);
  if (!users || users.length === 0) {
    // Seed default demo user
    safeSet(STORAGE_KEYS.USERS, [DEMO_USER]);
    return [DEMO_USER];
  }
  return users;
}

export function getActiveUser() {
  const activeId = safeGet(STORAGE_KEYS.ACTIVE_USER_ID, null);
  if (!activeId) return null;
  const users = getAllUsers();
  return users.find(u => u.id === activeId) || null;
}

export function registerUser({ name, email, password, situation = 'A graduate', province = 'Gauteng', city = 'Johannesburg' }) {
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();

  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  // Derive initials
  const initials = name
    .trim()
    .split(/\s+/)
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  // Merge any guest saved items into the new profile
  const guestSaved = safeGet(STORAGE_KEYS.SAVED, []);

  const newUser = {
    id: 'user_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: password,
    situation,
    province,
    city,
    avatarInitials: initials,
    savedOpps: Array.from(new Set([...guestSaved])),
    routeProgress: safeGet(STORAGE_KEYS.ROUTE, {
      'skill_identified': false,
      'course_enrolled': false,
      'cv_updated': false,
      'portfolio_drafted': false,
      'first_application': false,
      'network_connected': false
    }),
    dna: safeGet(STORAGE_KEYS.DNA, null),
    checklists: safeGet(STORAGE_KEYS.CHECKLISTS, {}),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  safeSet(STORAGE_KEYS.USERS, users);
  safeSet(STORAGE_KEYS.ACTIVE_USER_ID, newUser.id);

  unlockAchievement('profile_started');

  dispatchStorageEvent('auth-changed', { user: newUser });
  dispatchStorageEvent('saved-changed', { ids: newUser.savedOpps, count: newUser.savedOpps.length });

  return newUser;
}

export function signInUser(email, password) {
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();
  let user = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user && (cleanEmail === 'kagiso@orbit.org.za' || cleanEmail === 'kagiso@ubunye.org.za')) {
    user = DEMO_USER;
  }

  if (!user) {
    throw new Error('No profile found with this email. Please check your credentials or create an account.');
  }

  if (user.password !== password) {
    throw new Error('Incorrect password. Please verify and try again.');
  }

  safeSet(STORAGE_KEYS.ACTIVE_USER_ID, user.id);
  dispatchStorageEvent('auth-changed', { user });
  dispatchStorageEvent('saved-changed', { ids: user.savedOpps || [], count: (user.savedOpps || []).length });

  return user;
}

export function signInDemoUser() {
  const users = getAllUsers();
  let demo = users.find(u => u.id === DEMO_USER.id);
  if (!demo) {
    demo = DEMO_USER;
    users.push(demo);
    safeSet(STORAGE_KEYS.USERS, users);
  }
  safeSet(STORAGE_KEYS.ACTIVE_USER_ID, demo.id);
  dispatchStorageEvent('auth-changed', { user: demo });
  dispatchStorageEvent('saved-changed', { ids: demo.savedOpps || [], count: (demo.savedOpps || []).length });
  return demo;
}

export function signOutUser() {
  safeSet(STORAGE_KEYS.ACTIVE_USER_ID, null);
  const guestSaved = safeGet(STORAGE_KEYS.SAVED, []);
  dispatchStorageEvent('auth-changed', { user: null });
  dispatchStorageEvent('saved-changed', { ids: guestSaved, count: guestSaved.length });
}

export function updateUserProfile(updates) {
  const activeUser = getActiveUser();
  if (!activeUser) return null;

  const users = getAllUsers();
  const index = users.findIndex(u => u.id === activeUser.id);
  if (index === -1) return null;

  const updatedUser = { ...users[index], ...updates };
  if (updates.name) {
    updatedUser.avatarInitials = updates.name
      .trim()
      .split(/\s+/)
      .map(p => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  users[index] = updatedUser;
  safeSet(STORAGE_KEYS.USERS, users);

  dispatchStorageEvent('auth-changed', { user: updatedUser });
  return updatedUser;
}

/* ==========================================================================
   SAVED OPPORTUNITIES (PROFILE-SCOPED)
   ========================================================================== */

export function getSavedIds() {
  const activeUser = getActiveUser();
  if (activeUser) {
    return activeUser.savedOpps || [];
  }
  return safeGet(STORAGE_KEYS.SAVED, []);
}

export function isSaved(id) {
  const ids = getSavedIds();
  return ids.includes(id);
}

export function toggleSave(id) {
  const activeUser = getActiveUser();

  if (activeUser) {
    // Save to user profile
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === activeUser.id);
    let savedList = activeUser.savedOpps || [];
    const pos = savedList.indexOf(id);
    let nowSaved = false;

    if (pos > -1) {
      savedList.splice(pos, 1);
      nowSaved = false;
    } else {
      savedList.push(id);
      nowSaved = true;
      unlockAchievement('first_saved');
      if (savedList.length >= 5) {
        unlockAchievement('five_saved');
      }
    }

    if (index > -1) {
      users[index].savedOpps = savedList;
      safeSet(STORAGE_KEYS.USERS, users);
    }

    dispatchStorageEvent('saved-changed', { 
      ids: savedList, count: savedList.length, user: users[index], nowSaved 
    });
    return nowSaved;
  }

  // Fallback to guest storage
  const ids = safeGet(STORAGE_KEYS.SAVED, []);
  const pos = ids.indexOf(id);
  let nowSaved = false;

  if (pos > -1) {
    ids.splice(pos, 1);
    nowSaved = false;
  } else {
    ids.push(id);
    nowSaved = true;
    unlockAchievement('first_saved');
    if (ids.length >= 5) {
      unlockAchievement('five_saved');
    }
  }

  safeSet(STORAGE_KEYS.SAVED, ids);
  dispatchStorageEvent('saved-changed', { 
    ids, count: ids.length, user: null, nowSaved 
  });
  return nowSaved;
}

export function getSavedCount() {
  return getSavedIds().length;
}

/* ==========================================================================
   RECENTLY VIEWED
   ========================================================================== */

export function getRecentlyViewedIds() {
  return safeGet(STORAGE_KEYS.RECENT, []);
}

export function recordRecentlyViewed(id) {
  if (!id) return;
  let recent = getRecentlyViewedIds();
  recent = recent.filter(item => item !== id);
  recent.unshift(id);
  recent = recent.slice(0, 5);
  safeSet(STORAGE_KEYS.RECENT, recent);
}

/* ==========================================================================
   THEME
   ========================================================================== */

export function getTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {}
  return 'dark';
}

export function setTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', theme);
  dispatchStorageEvent('theme-changed', { theme });
}

/* ==========================================================================
   MY ROUTE & MILESTONES (PROFILE-SCOPED)
   ========================================================================== */

export function getRouteProgress() {
  const activeUser = getActiveUser();
  if (activeUser && activeUser.routeProgress) {
    return activeUser.routeProgress;
  }
  return safeGet(STORAGE_KEYS.ROUTE, {
    'skill_identified': false,
    'course_enrolled': false,
    'cv_updated': false,
    'portfolio_drafted': false,
    'first_application': false,
    'network_connected': false
  });
}

export function toggleRouteProgress(key) {
  const activeUser = getActiveUser();
  const current = getRouteProgress();
  const updated = { ...current, [key]: !current[key] };

  if (activeUser) {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === activeUser.id);
    if (index > -1) {
      users[index].routeProgress = updated;
      safeSet(STORAGE_KEYS.USERS, users);
    }
  } else {
    safeSet(STORAGE_KEYS.ROUTE, updated);
  }

  return updated;
}

/* ==========================================================================
   OPPORTUNITY DETAIL APPLICATION CHECKLISTS
   ========================================================================== */

export function getOpportunityChecklist(oppId) {
  const activeUser = getActiveUser();
  const allChecklists = activeUser && activeUser.checklists 
    ? activeUser.checklists 
    : safeGet(STORAGE_KEYS.CHECKLISTS, {});
  return allChecklists[oppId] || {};
}

export function toggleOpportunityChecklistItem(oppId, itemIndex) {
  const activeUser = getActiveUser();
  const allChecklists = activeUser && activeUser.checklists 
    ? activeUser.checklists 
    : safeGet(STORAGE_KEYS.CHECKLISTS, {});

  if (!allChecklists[oppId]) {
    allChecklists[oppId] = {};
  }
  allChecklists[oppId][itemIndex] = !allChecklists[oppId][itemIndex];

  if (activeUser) {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === activeUser.id);
    if (index > -1) {
      users[index].checklists = allChecklists;
      safeSet(STORAGE_KEYS.USERS, users);
    }
  } else {
    safeSet(STORAGE_KEYS.CHECKLISTS, allChecklists);
  }

  return allChecklists[oppId];
}

/* ==========================================================================
   CAREER PASSPORT ACHIEVEMENTS
   ========================================================================== */

export const PASSPORT_ACHIEVEMENTS = [
  { key: 'profile_started', title: 'Possibility Explorer', desc: 'Created personal career profile & launched mapping', icon: '🧭' },
  { key: 'first_saved', title: 'First Anchor', desc: 'Saved your first career opportunity to profile', icon: '⭐' },
  { key: 'first_course_explored', title: 'Knowledge Seeker', desc: 'Explored a free training course or learnership', icon: '📚' },
  { key: 'five_saved', title: 'Possibility Collector', desc: 'Bookmarked 5 viable career pathways in profile', icon: '🎯' },
  { key: 'toolkit_completed', title: 'Work-Ready Certified', desc: 'Reviewed all career toolkit checklists', icon: '💼' }
];

export function getUnlockedAchievements() {
  return safeGet(STORAGE_KEYS.PASSPORT, ['profile_started']);
}

export function unlockAchievement(key) {
  const current = getUnlockedAchievements();
  if (!current.includes(key)) {
    current.push(key);
    safeSet(STORAGE_KEYS.PASSPORT, current);
    dispatchStorageEvent('achievement-unlocked', { key });
  }
}

/* ==========================================================================
   POSSIBILITY DNA
   ========================================================================== */

export function getPossibilityDna() {
  const activeUser = getActiveUser();
  if (activeUser && activeUser.dna) {
    return activeUser.dna;
  }
  return safeGet(STORAGE_KEYS.DNA, null);
}

export function savePossibilityDna(dna) {
  const activeUser = getActiveUser();
  if (activeUser) {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === activeUser.id);
    if (index > -1) {
      users[index].dna = dna;
      safeSet(STORAGE_KEYS.USERS, users);
    }
  }
  safeSet(STORAGE_KEYS.DNA, dna);
  unlockAchievement('profile_started');
}
