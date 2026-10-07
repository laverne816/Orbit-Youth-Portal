/**
 * ORBIT — Data Module
 * Responsible for fetching, caching, and querying the opportunities dataset.
 * Includes embedded fallback for strict file:// origins and zero-network resilience.
 */

let _cachedOpportunities = null;

// Embedded baseline fallback to guarantee zero-blank-screen even under offline / strict file protocols
const FALLBACK_OPPORTUNITIES = [
  {
    id: "ubu-001",
    title: "Junior Full-Stack Web Developer",
    organisation: "Plum Systems Africa",
    category: "Jobs",
    location: "Cape Town, WC",
    province: "Western Cape",
    citySlug: "cape-town",
    experienceLevel: "Entry Level",
    stipendOrSalary: "R22,000 - R26,000 / month",
    shortDescription: "Build modern responsive web applications and APIs using modern JavaScript, React, and Node.js for high-growth African fintech platforms.",
    description: "Plum Systems Africa is recruiting an entry-level Junior Full-Stack Developer to join our Cape Town engineering cohort. You will collaborate closely with senior software engineers, participate in agile sprint ceremonies, write unit tests, and ship client-facing portal features.",
    eligibility: "South African citizen aged 18-35. Recent diploma, degree, or certified coding bootcamp graduate.",
    qualifications: "National Diploma, BSc in Computer Science/IT, or accredited coding bootcamp certificate.",
    requiredDocuments: ["Updated CV", "Certified SA ID copy", "Academic transcript / Certificate", "GitHub project links"],
    applicationSteps: ["Submit credentials and portfolio", "Asynchronous coding assessment", "Technical interview", "Final offer"],
    closingDate: "2026-10-15T23:59:59Z",
    applicationUrl: "https://example.com/apply/ubu-001",
    isDemo: true,
    lastUpdated: "06 October 2026",
    organisationDetails: "Fintech & Enterprise · Woodstock, Cape Town · B-BBEE Level 1",
    situationTags: ["A graduate", "Changing careers", "Looking for experience"],
    skillsTags: ["JavaScript", "TypeScript", "React", "Node.js", "Git"]
  },
  {
    id: "ubu-002",
    title: "UI/UX & Product Design Internship",
    organisation: "KasiDigital Studio",
    category: "Internships",
    location: "Johannesburg, GP",
    province: "Gauteng",
    citySlug: "johannesburg",
    experienceLevel: "Entry Level",
    stipendOrSalary: "R9,500 / month",
    shortDescription: "12-month paid product design residency designing digital interfaces, user flows, and wireframes for mobile financial and health apps.",
    description: "Join our human-centred design studio in Braamfontein. Conduct contextual user research, design high-fidelity Figma prototypes, and assist in usability testing sessions.",
    eligibility: "South African youth aged 19-30 with a design portfolio or Figma case studies.",
    qualifications: "Diploma or Degree in Multimedia, Graphic Design, Information Systems, or self-taught designer.",
    requiredDocuments: ["Curriculum Vitae", "Certified SA ID copy", "Portfolio link (Figma / Behance)", "Cover letter"],
    applicationSteps: ["Portfolio screening", "Take-home design challenge", "Portfolio presentation", "Onboarding"],
    closingDate: "2026-10-12T23:59:59Z",
    applicationUrl: "https://example.com/apply/ubu-002",
    isDemo: true,
    lastUpdated: "06 October 2026",
    organisationDetails: "Creative Tech Studio · Braamfontein, Johannesburg",
    situationTags: ["A university student", "A graduate", "Looking for experience", "Unemployed"],
    skillsTags: ["UI/UX", "Figma", "User Research", "Prototyping"]
  }
];

export async function fetchOpportunities() {
  if (_cachedOpportunities) {
    return _cachedOpportunities;
  }

  try {
    const response = await fetch('/data/opportunities.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    _cachedOpportunities = data;
    return _cachedOpportunities;
  } catch (err) {
    console.warn('ORBIT data fetch encountered warning, applying resilient fallback:', err);
    // If running under static file origin or fetch blocked, try relative path or fallback
    try {
      const fallbackResp = await fetch('./data/opportunities.json');
      if (fallbackResp.ok) {
        _cachedOpportunities = await fallbackResp.json();
        return _cachedOpportunities;
      }
    } catch (e) {
      // Ignored
    }
    _cachedOpportunities = FALLBACK_OPPORTUNITIES;
    return _cachedOpportunities;
  }
}

export async function getOpportunityById(id) {
  const all = await fetchOpportunities();
  return all.find(item => item.id === id) || null;
}

export async function getTodaysPossibility() {
  const all = await fetchOpportunities();
  if (!all.length) return null;
  // Deterministic daily hash based on year, month, date
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % all.length;
  return all[index];
}

export async function getClosingSoonOpportunities(limit = 4) {
  const all = await fetchOpportunities();
  const now = new Date().getTime();
  
  // Sort by closing date ascending
  const sorted = [...all].sort((a, b) => {
    const timeA = new Date(a.closingDate).getTime();
    const timeB = new Date(b.closingDate).getTime();
    return timeA - timeB;
  });

  return sorted.slice(0, limit);
}

export async function getTrendingSkills() {
  const all = await fetchOpportunities();
  const targetSkills = [
    'JavaScript',
    'AI',
    'Cybersecurity',
    'Data Analytics',
    'Cloud',
    'UI/UX',
    'Digital Marketing',
    'Python'
  ];

  return targetSkills.map(skill => {
    const count = all.filter(opp => {
      const skillsStr = (opp.skillsTags || []).join(' ').toLowerCase();
      const text = `${opp.title} ${opp.shortDescription} ${opp.description}`.toLowerCase();
      return skillsStr.includes(skill.toLowerCase()) || text.includes(skill.toLowerCase());
    }).length;

    return {
      name: skill,
      count: count
    };
  });
}

export async function getCityStats(citySlug) {
  const all = await fetchOpportunities();
  const cityOpps = all.filter(opp => opp.citySlug === citySlug);
  
  const stats = {
    total: cityOpps.length,
    jobs: cityOpps.filter(o => o.category === 'Jobs').length,
    internships: cityOpps.filter(o => o.category === 'Internships').length,
    learnerships: cityOpps.filter(o => o.category === 'Learnerships').length,
    bursaries: cityOpps.filter(o => o.category === 'Bursaries').length,
    courses: cityOpps.filter(o => o.category === 'Courses').length,
    events: cityOpps.filter(o => o.category === 'Events').length
  };
  
  return stats;
}
