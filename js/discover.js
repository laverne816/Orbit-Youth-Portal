/**
 * ORBIT — Discover Module
 * Powers the signature features:
 * - "Start Where You Are" onboarding flow
 * - The dynamic SVG Possibility Map with animated paths & node interaction
 * - "SHOW ME ANOTHER FUTURE →" regeneration engine
 * - "My Possibility DNA" profile card
 * - "Meet Your Possible Futures" identity dossiers
 * - "I Have No Idea" judgement-free visual this-or-that discovery flow
 */

import { fetchOpportunities } from './data.js';
import { savePossibilityDna, getPossibilityDna, unlockAchievement } from './storage.js';
import { renderOpportunityCard, attachBookmarkListeners } from './render.js';

// Pre-defined alternate pathway blueprints
const FUTURE_BLUEPRINTS = [
  {
    key: 'builder',
    title: 'THE BUILDER',
    subtitle: 'Software Systems & AI Developer',
    description: 'You transform abstract logic into living, scalable digital tools that solve everyday African challenges.',
    dna: { tech: 85, creative: 62, business: 48, leadership: 54, people: 40 },
    strengths: ['Algorithmic Thinking', 'Systems Architecture', 'Tenacious Debugging', 'Autonomous Learning'],
    skillsNeeded: ['JavaScript / TypeScript', 'Python & APIs', 'Git & CI/CD', 'Database Design'],
    courses: [
      { name: 'Ubuntu Tech Academy — Practical Python & ML', url: 'opportunity.html?id=ubu-005' },
      { name: 'Plum Systems Full-Stack Fellowship', url: 'opportunity.html?id=ubu-001' }
    ],
    projectIdeas: [
      'Build a WhatsApp bot that notifies matriculants of available university application dates',
      'Create an offline-first micro-inventory PWA for township spaza shops'
    ],
    mapData: {
      origin: 'YOU (START HERE)',
      lanes: [
        { label: 'LEARN', node: 'AI & Full-Stack Bootcamp', detail: '16 weeks intensive Python & modern web foundations' },
        { label: 'BUILD', node: '3 Live Web Projects', detail: 'Production repo on GitHub with test coverage' },
        { label: 'WORK', node: 'Junior Engineering Residency', detail: 'Mentored placement in high-growth team' }
      ],
      destination: 'SENIOR SOFTWARE ENGINEER / TECH LEAD'
    }
  },
  {
    key: 'creator',
    title: 'THE CREATOR',
    subtitle: 'UI/UX & Interactive Product Designer',
    description: 'You understand people before pixels. You craft intuitive, dignity-affirming digital experiences.',
    dna: { tech: 58, creative: 92, business: 54, leadership: 60, people: 78 },
    strengths: ['Empathetic Listening', 'Visual Hierarchy', 'Contextual Field Research', 'Interaction Design'],
    skillsNeeded: ['Figma & Prototyping', 'User Research & Journey Mapping', 'Design Systems', 'Microcopy & Accessibility'],
    courses: [
      { name: 'KasiDigital Studio — UI/UX Residency', url: 'opportunity.html?id=ubu-002' },
      { name: 'Vortex Digital Arts Collective — Creative Tech Workshop', url: 'opportunity.html?id=ubu-018' }
    ],
    projectIdeas: [
      'Redesign a SASSA grant status mobile flow for low-literacy smartphone users',
      'Design a collaborative savings & stokvel accounting interface with audio cues'
    ],
    mapData: {
      origin: 'YOU (START HERE)',
      lanes: [
        { label: 'LEARN', node: 'Human-Centred UX Foundations', detail: 'Information architecture and usability testing' },
        { label: 'BUILD', node: 'Case Study Portfolio', detail: '2 in-depth Behance / web interactive case studies' },
        { label: 'WORK', node: 'Product Design Internship', detail: 'Working with cross-functional product squads' }
      ],
      destination: 'HEAD OF PRODUCT / UX PRINCIPAL'
    }
  },
  {
    key: 'entrepreneur',
    title: 'THE ENTREPRENEUR',
    subtitle: 'Digital Venture Operator & Founder',
    description: 'You connect dots others miss. You turn ideas into sustainable revenue and community employment.',
    dna: { tech: 64, creative: 70, business: 94, leadership: 88, people: 82 },
    strengths: ['Opportunity Recognition', 'Resourcefulness', 'Storytelling & Pitching', 'Operational Resilience'],
    skillsNeeded: ['Financial Model Basics', 'Sales & Customer Acquisition', 'Digital Marketing & Growth', 'Agile Operations'],
    courses: [
      { name: 'Khayelitsha Creative Works — Freelancer Accelerator', url: 'opportunity.html?id=ubu-024' },
      { name: 'Eastern Cape Youth Venture Fund', url: 'opportunity.html?id=ubu-010' }
    ],
    projectIdeas: [
      'Launch a local on-demand laundry or delivery coordination service using simple SMS/WhatsApp links',
      'Start an agency building affordable e-commerce presence for township artisans'
    ],
    mapData: {
      origin: 'YOU (START HERE)',
      lanes: [
        { label: 'LEARN', node: 'Micro-Enterprise & Finance Basics', detail: 'Unit economics, compliance, and sales funnels' },
        { label: 'BUILD', node: 'MVP Launch & First 10 Customers', detail: 'Rapid validation with real payment receipts' },
        { label: 'WORK', node: 'Incubator & Scale Placements', detail: 'Seed grant access and supplier linkages' }
      ],
      destination: 'STARTUP FOUNDER / MANAGING DIRECTOR'
    }
  },
  {
    key: 'systems',
    title: 'THE SYSTEMS SPECIALIST',
    subtitle: 'Cloud Infrastructure & Security Architect',
    description: 'You are the guardian of reliability. You make sure networks stay resilient, fast, and unbreachable.',
    dna: { tech: 90, creative: 45, business: 65, leadership: 62, people: 44 },
    strengths: ['Diagnostic Precision', 'Risk Mitigation', 'Linux Scripting', 'Infrastructure Resilience'],
    skillsNeeded: ['AWS / Azure Cloud', 'Cybersecurity Protocols', 'Docker & Kubernetes', 'Network Topologies'],
    courses: [
      { name: 'Vakina Telecoms — Cloud Learnership', url: 'opportunity.html?id=ubu-003' },
      { name: 'SentryGuard — Cybersecurity Analyst Cohort', url: 'opportunity.html?id=ubu-007' }
    ],
    projectIdeas: [
      'Deploy an automated zero-trust backup solution for a community school computer lab',
      'Set up a self-hosted cloud server on a refurbished PC using Linux'
    ],
    mapData: {
      origin: 'YOU (START HERE)',
      lanes: [
        { label: 'LEARN', node: 'NQF 5 Systems Support & Cloud Certs', detail: 'Hands-on server provisioning and network security' },
        { label: 'BUILD', node: 'Homelab & Terraform Configs', detail: 'Automated infrastructure deployments' },
        { label: 'WORK', node: 'Cloud Support Residency', detail: 'Enterprise infrastructure management' }
      ],
      destination: 'CHIEF INFORMATION SECURITY OFFICER'
    }
  }
];

let currentBlueprintIndex = 0;
let activeMapStage = 0; // 0: Origin (You), 1: Learn, 2: Build, 3: Work, 4: Destination

const SITUATION_METADATA = {
  graduate: {
    key: 'graduate',
    shortLabel: 'TERTIARY GRADUATE',
    fullTitle: 'Starting Coordinates: Degree / Diploma Graduate',
    tagline: 'Foundational degree in hand. Closing the practical execution gap.',
    locationText: 'JHB TECH CORRIDOR · -26.2041, 28.0473',
    icon: '🧑🏾‍💻',
    learnLane: { node: 'Applied Cloud & AI Stack', detail: '16 weeks intensive production-grade Python & Cloud foundations' },
    buildLane: { node: 'Production Capstone on GitHub', detail: 'Deployed full-stack system with CI/CD and unit tests' },
    workLane: { node: 'Graduate Residency / Junior Dev', detail: 'Mentored placement in high-growth enterprise product squad' }
  },
  school_leaver: {
    key: 'school_leaver',
    shortLabel: 'MATRIC LEAVER',
    fullTitle: 'Starting Coordinates: Matriculant (Just Finished Grade 12)',
    tagline: 'Fresh start. Accessing funded SETA learnerships and tech academies.',
    locationText: 'CPT INNOVATION HUB · -33.9249, 18.4241',
    icon: '🎒',
    learnLane: { node: 'SETA NQF 5 Systems Certificate', detail: 'Fully funded tuition with monthly travel stipend' },
    buildLane: { node: 'First 3 Live Mini-Sites', detail: 'Personal portfolio showcasing foundational digital fluency' },
    workLane: { node: 'Paid 12-Month Youth Learnership', detail: 'Workplace residency with registered corporate partner' }
  },
  studying: {
    key: 'studying',
    shortLabel: 'STUDYING',
    fullTitle: 'Starting Coordinates: Active Student (TVET / University)',
    tagline: 'Balancing coursework with high-leverage industry credentials.',
    locationText: 'DBN DIGITAL CLUSTER · -29.8587, 31.0218',
    icon: '🎓',
    learnLane: { node: 'Industry Micro-Credentials', detail: 'High-signal AWS, Figma, or Python certifications alongside classes' },
    buildLane: { node: 'Campus Problem-Solver Tool', detail: 'A live tool solving an actual student or community bottleneck' },
    workLane: { node: 'Paid Vac-Work Fellowship', detail: 'Vacation residency securing early corporate employment references' }
  },
  experienced: {
    key: 'experienced',
    shortLabel: 'EXPERIENCED',
    fullTitle: 'Starting Coordinates: Early Professional (1-3 Yrs Work)',
    tagline: 'Workplace experience ready to level up into domain mastery.',
    locationText: 'PTA RESEARCH HUB · -25.7479, 28.2293',
    icon: '💼',
    learnLane: { node: 'Advanced Architecture Sprint', detail: 'System scalability, security compliance, and microservices' },
    buildLane: { node: 'Enterprise Optimization Project', detail: 'Production case study demonstrating measurable speed or cost gains' },
    workLane: { node: 'Mid-Level Specialist / Lead', detail: 'Full-time high-impact role with accelerated leadership track' }
  },
  career_change: {
    key: 'career_change',
    shortLabel: 'CAREER PIVOT',
    fullTitle: 'Starting Coordinates: Career Changer (Transitioning to Tech)',
    tagline: 'Translating rich prior experience into high-value digital roles.',
    locationText: 'GQEBERHA MARITIME & TECH · -33.9608, 25.6022',
    icon: '🔄',
    learnLane: { node: '12-Week Agile Pivot Bootcamp', detail: 'Laser-focused bridge translating existing domain expertise to tech' },
    buildLane: { node: 'Industry-Specific Tech Showcase', detail: 'Portfolio demonstrating hybrid skills in your chosen domain' },
    workLane: { node: 'Direct Contract / Tech Residency', detail: 'Immediate placement taking advantage of hybrid maturity' }
  },
  unsure: {
    key: 'unsure',
    shortLabel: 'OPEN EXPLORER',
    fullTitle: 'Starting Coordinates: Completely Open & Exploring',
    tagline: 'Judgement-free testing ground to discover what sparks energy.',
    locationText: 'NATIONAL SATELLITE · -28.4793, 24.6727',
    icon: '🧭',
    learnLane: { node: 'Multi-Discipline Digital Taster', detail: 'Sampling design, code, data, and digital marketing modules' },
    buildLane: { node: 'Weekend Micro-Experiments', detail: 'Low-stakes fun projects to identify where time flies fastest' },
    workLane: { node: 'Rotational Youth Internship', detail: 'Rotational placements across 3 different company departments' }
  }
};

let userOnboardingData = {
  situation: 'graduate',
  interests: [],
  assets: [],
  goals: []
};

/**
 * Initialize Discover page flows
 */
export function initDiscoverPage() {
  initOnboardingFlow();
  initNoIdeaFlow();
  initPossibilityMapControls();

  // If user already had stored DNA, show it immediately
  const existingDna = getPossibilityDna();
  if (existingDna) {
    userOnboardingData = existingDna;
    renderPossibilityResults(0);
  }
}

/**
 * Step-by-Step Onboarding Controller
 */
function initOnboardingFlow() {
  const stepContainer = document.getElementById('onboarding-steps-container');
  if (!stepContainer) return;

  const situationButtons = stepContainer.querySelectorAll('[data-situation-choice]');
  situationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      situationButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      userOnboardingData.situation = btn.getAttribute('data-situation-choice');
      goToOnboardingStep(2);
    });
  });

  // Step 2: What do you enjoy?
  const interestPills = stepContainer.querySelectorAll('[data-interest-choice]');
  interestPills.forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      const val = pill.getAttribute('data-interest-choice');
      if (userOnboardingData.interests.includes(val)) {
        userOnboardingData.interests = userOnboardingData.interests.filter(i => i !== val);
      } else {
        userOnboardingData.interests.push(val);
      }
    });
  });

  const step2Next = document.getElementById('step-2-next-btn');
  if (step2Next) {
    step2Next.addEventListener('click', () => {
      if (userOnboardingData.interests.length === 0) {
        // Default to a balanced set if not clicked
        userOnboardingData.interests = ['Solving puzzles', 'Building with code'];
      }
      goToOnboardingStep(3);
    });
  }

  // Step 3: What do you have right now?
  const assetPills = stepContainer.querySelectorAll('[data-asset-choice]');
  assetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      const val = pill.getAttribute('data-asset-choice');
      if (userOnboardingData.assets.includes(val)) {
        userOnboardingData.assets = userOnboardingData.assets.filter(a => a !== val);
      } else {
        userOnboardingData.assets.push(val);
      }
    });
  });

  const step3Next = document.getElementById('step-3-next-btn');
  if (step3Next) {
    step3Next.addEventListener('click', () => {
      if (userOnboardingData.assets.length === 0) {
        userOnboardingData.assets = ['Smartphone with data', 'Open curiosity'];
      }
      goToOnboardingStep(4);
    });
  }

  // Step 4: What do you want most?
  const goalPills = stepContainer.querySelectorAll('[data-goal-choice]');
  goalPills.forEach(pill => {
    pill.addEventListener('click', () => {
      goalPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      userOnboardingData.goals = [pill.getAttribute('data-goal-choice')];
    });
  });

  const generateMapBtn = document.getElementById('generate-map-btn');
  if (generateMapBtn) {
    generateMapBtn.addEventListener('click', () => {
      savePossibilityDna(userOnboardingData);
      renderPossibilityResults(0);
      
      // Smooth scroll to results
      const resultsSection = document.getElementById('possibility-results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

function goToOnboardingStep(stepNumber) {
  document.querySelectorAll('.onboarding-step-pane').forEach(pane => {
    pane.style.display = 'none';
  });
  const targetPane = document.getElementById(`onboarding-step-${stepNumber}`);
  if (targetPane) {
    targetPane.style.display = 'block';
  }
}

/**
 * Render Map, DNA, Futures & Matching Opportunities
 */
export function renderPossibilityResults(blueprintIndex = 0) {
  currentBlueprintIndex = blueprintIndex % FUTURE_BLUEPRINTS.length;
  const blueprint = FUTURE_BLUEPRINTS[currentBlueprintIndex];

  // 1. Render Possibility Map SVG
  renderPossibilityMapSvg(blueprint);

  // 2. Render Possibility DNA
  renderPossibilityDnaCard(blueprint);

  // 3. Render 3 Possible Futures
  renderPossibleFuturesGrid(currentBlueprintIndex);

  // 4. Render Matching Opportunities from JSON
  renderMatchingOpportunities(blueprint);

  // Make results container visible
  const resultsWrap = document.getElementById('possibility-results-section');
  if (resultsWrap) {
    resultsWrap.style.display = 'block';
  }
}

/**
 * SVG Possibility Map Generator with dynamic situation anchoring & live location tracking
 */
function renderPossibilityMapSvg(blueprint) {
  const mapSvgContainer = document.getElementById('possibility-map-container');
  if (!mapSvgContainer) return;

  const sitKey = userOnboardingData.situation || 'graduate';
  const sit = SITUATION_METADATA[sitKey] || SITUATION_METADATA.graduate;

  // Sync active pill state in Starting Point Switcher Bar
  document.querySelectorAll('#map-starting-point-bar [data-switch-situation]').forEach(pill => {
    const pKey = pill.getAttribute('data-switch-situation');
    if (pKey === sitKey) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // Blend lanes based on user starting coordinates + future archetype
  const lanes = [
    { label: 'LEARN', node: sit.learnLane.node, detail: sit.learnLane.detail },
    { label: 'BUILD', node: sit.buildLane.node, detail: sit.buildLane.detail },
    { label: 'WORK', node: sit.workLane.node, detail: sit.workLane.detail }
  ];

  const isOriginActive = activeMapStage === 0;
  const isLearnActive = activeMapStage === 1;
  const isBuildActive = activeMapStage === 2;
  const isWorkActive = activeMapStage === 3;
  const isDestActive = activeMapStage === 4;

  const svgContent = `
    <svg class="map-svg-element" viewBox="0 0 960 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mapBranch1" x1="120" y1="240" x2="480" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${isLearnActive ? '#00e5ff' : '#0099A3'}"/>
          <stop offset="100%" stop-color="${isLearnActive ? '#7ef9c6' : '#C8E7E9'}"/>
        </linearGradient>
        <linearGradient id="mapBranch2" x1="120" y1="240" x2="480" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${isBuildActive ? '#00e5ff' : '#0099A3'}"/>
          <stop offset="100%" stop-color="${isBuildActive ? '#00e5ff' : '#006269'}"/>
        </linearGradient>
        <linearGradient id="mapBranch3" x1="120" y1="240" x2="480" y2="360" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${isWorkActive ? '#00e5ff' : '#0099A3'}"/>
          <stop offset="100%" stop-color="${isWorkActive ? '#7ef9c6' : '#344E4E'}"/>
        </linearGradient>
        <linearGradient id="convergeGrad" x1="480" y1="240" x2="840" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${isDestActive ? '#ffb703' : '#0099A3'}"/>
          <stop offset="50%" stop-color="${isDestActive ? '#fbbf24' : '#C8E7E9'}"/>
          <stop offset="100%" stop-color="#FFFFFF"/>
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Background constellation micro-mesh & coordinates grid -->
      <g opacity="0.2" stroke="#C8E7E9">
        <line x1="0" y1="120" x2="960" y2="120" stroke-dasharray="4 8"/>
        <line x1="0" y1="240" x2="960" y2="240" stroke-dasharray="4 8"/>
        <line x1="0" y1="360" x2="960" y2="360" stroke-dasharray="4 8"/>
        <line x1="120" y1="0" x2="120" y2="480" stroke-dasharray="2 12" stroke-opacity="0.3"/>
        <line x1="480" y1="0" x2="480" y2="480" stroke-dasharray="2 12" stroke-opacity="0.3"/>
        <line x1="840" y1="0" x2="840" y2="480" stroke-dasharray="2 12" stroke-opacity="0.3"/>
      </g>

      <!-- Branching animated paths from Origin to Lanes -->
      <path class="map-svg-path" d="M 120 240 C 220 240, 260 120, 480 120" 
            stroke="url(#mapBranch1)" stroke-width="${isLearnActive ? '4.5' : '3'}" stroke-linecap="round"/>
      <path class="map-svg-path" d="M 120 240 L 480 240" 
            stroke="url(#mapBranch2)" stroke-width="${isBuildActive ? '4.5' : '3'}" stroke-linecap="round"/>
      <path class="map-svg-path" d="M 120 240 C 220 240, 260 360, 480 360" 
            stroke="url(#mapBranch3)" stroke-width="${isWorkActive ? '4.5' : '3'}" stroke-linecap="round"/>

      <!-- Convergence paths from Lanes to Destination -->
      <path class="map-svg-path" d="M 480 120 C 620 120, 680 240, 840 240" 
            stroke="url(#convergeGrad)" stroke-width="3" stroke-linecap="round"/>
      <path class="map-svg-path" d="M 480 240 L 840 240" 
            stroke="url(#convergeGrad)" stroke-width="${isDestActive ? '4' : '2.5'}" stroke-dasharray="${isDestActive ? 'none' : '6 6'}"/>
      <path class="map-svg-path" d="M 480 360 C 620 360, 680 240, 840 240" 
            stroke="url(#convergeGrad)" stroke-width="3" stroke-linecap="round"/>

      <!-- ========================================== -->
      <!-- ORIGIN NODE: YOU ARE HERE (DYNAMIC LOCATION) -->
      <!-- ========================================== -->
      <g class="map-node-interactive" data-node="you" style="cursor: pointer;">
        <!-- Pulsing radar ring indicating current position -->
        <circle cx="120" cy="240" r="34" class="radar-pulse-ring" stroke="#00e5ff" stroke-width="2" fill="none" />
        <circle cx="120" cy="240" r="44" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity="${isOriginActive ? '0.9' : '0.4'}"/>

        <circle cx="120" cy="240" r="28" fill="#071523" stroke="#00e5ff" stroke-width="${isOriginActive ? '4' : '3'}" filter="url(#neonGlow)"/>
        <circle cx="120" cy="240" r="14" fill="#00e5ff" fill-opacity="0.25"/>
        <circle cx="120" cy="240" r="6" fill="#00e5ff"/>

        <!-- High-visibility live badge -->
        <rect x="50" y="174" width="140" height="24" rx="12" fill="#0c2135" stroke="#00e5ff" stroke-width="1.5"/>
        <text x="120" y="190" fill="#00e5ff" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle" letter-spacing="1">📍 YOU ARE HERE</text>

        <text x="120" y="284" fill="#FFFFFF" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="0.5">${sit.shortLabel}</text>
        <text x="120" y="302" fill="#C8E7E9" font-family="'JetBrains Mono', monospace" font-size="9.5" text-anchor="middle">STAGE 0 · START</text>
      </g>

      <!-- ========================================== -->
      <!-- 01 LEARN NODE -->
      <!-- ========================================== -->
      <g class="map-node-interactive" data-node="learn" style="cursor: pointer;">
        ${isLearnActive ? `<circle cx="480" cy="120" r="34" class="radar-pulse-ring" stroke="#7ef9c6" stroke-width="2" fill="none" />` : ''}
        <circle cx="480" cy="120" r="24" fill="#071523" stroke="${isLearnActive ? '#7ef9c6' : '#C8E7E9'}" stroke-width="${isLearnActive ? '4' : '2.5'}"/>
        <circle cx="480" cy="120" r="7" fill="${isLearnActive ? '#7ef9c6' : '#C8E7E9'}"/>
        <text x="480" y="84" fill="${isLearnActive ? '#7ef9c6' : '#C8E7E9'}" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">01 · LEARN</text>
        <text x="480" y="162" fill="#FFFFFF" font-family="'Sora', sans-serif" font-size="13" font-weight="600" text-anchor="middle">${escapeHtml(lanes[0].node)}</text>
      </g>

      <!-- ========================================== -->
      <!-- 02 BUILD NODE -->
      <!-- ========================================== -->
      <g class="map-node-interactive" data-node="build" style="cursor: pointer;">
        ${isBuildActive ? `<circle cx="480" cy="240" r="34" class="radar-pulse-ring" stroke="#00e5ff" stroke-width="2" fill="none" />` : ''}
        <circle cx="480" cy="240" r="24" fill="#071523" stroke="${isBuildActive ? '#00e5ff' : '#0099A3'}" stroke-width="${isBuildActive ? '4' : '2.5'}"/>
        <circle cx="480" cy="240" r="7" fill="${isBuildActive ? '#00e5ff' : '#0099A3'}"/>
        <text x="480" y="204" fill="${isBuildActive ? '#00e5ff' : '#0099A3'}" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">02 · BUILD</text>
        <text x="480" y="282" fill="#FFFFFF" font-family="'Sora', sans-serif" font-size="13" font-weight="600" text-anchor="middle">${escapeHtml(lanes[1].node)}</text>
      </g>

      <!-- ========================================== -->
      <!-- 03 WORK NODE -->
      <!-- ========================================== -->
      <g class="map-node-interactive" data-node="work" style="cursor: pointer;">
        ${isWorkActive ? `<circle cx="480" cy="360" r="34" class="radar-pulse-ring" stroke="#7ef9c6" stroke-width="2" fill="none" />` : ''}
        <circle cx="480" cy="360" r="24" fill="#071523" stroke="${isWorkActive ? '#7ef9c6' : '#344E4E'}" stroke-width="${isWorkActive ? '4' : '2.5'}"/>
        <circle cx="480" cy="360" r="7" fill="${isWorkActive ? '#7ef9c6' : '#344E4E'}"/>
        <text x="480" y="324" fill="${isWorkActive ? '#7ef9c6' : '#C8E7E9'}" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" text-anchor="middle">03 · WORK</text>
        <text x="480" y="402" fill="#FFFFFF" font-family="'Sora', sans-serif" font-size="13" font-weight="600" text-anchor="middle">${escapeHtml(lanes[2].node)}</text>
      </g>

      <!-- ========================================== -->
      <!-- DESTINATION NODE: FUTURE HORIZON -->
      <!-- ========================================== -->
      <g class="map-node-interactive" data-node="destination" style="cursor: pointer;">
        ${isDestActive ? `<circle cx="840" cy="240" r="44" class="radar-pulse-ring" stroke="#ffb703" stroke-width="2.5" fill="none" />` : ''}
        <circle cx="840" cy="240" r="34" fill="#071523" stroke="${isDestActive ? '#ffb703' : '#0099A3'}" stroke-width="${isDestActive ? '4.5' : '3'}"/>
        <circle cx="840" cy="240" r="20" fill="${isDestActive ? '#ffb703' : '#0099A3'}" fill-opacity="0.2"/>
        <circle cx="840" cy="240" r="8" fill="${isDestActive ? '#ffb703' : '#C8E7E9'}"/>
        <text x="840" y="194" fill="${isDestActive ? '#ffb703' : '#FFFFFF'}" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1">${escapeHtml(blueprint.title)}</text>
        <text x="840" y="296" fill="#DBE9EE" font-family="'Sora', sans-serif" font-size="12" font-weight="600" text-anchor="middle">${escapeHtml(blueprint.subtitle)}</text>
      </g>
    </svg>
  `;

  mapSvgContainer.innerHTML = svgContent;

  // Sync Live Map Status Card Below
  updateMapLiveStatusCard(sit, lanes, blueprint);

  // Attach interactive node click modals/info
  mapSvgContainer.querySelectorAll('.map-node-interactive').forEach(node => {
    node.addEventListener('click', () => {
      const nodeType = node.getAttribute('data-node');
      if (nodeType === 'you') activeMapStage = 0;
      else if (nodeType === 'learn') activeMapStage = 1;
      else if (nodeType === 'build') activeMapStage = 2;
      else if (nodeType === 'work') activeMapStage = 3;
      else if (nodeType === 'destination') activeMapStage = 4;

      renderPossibilityMapSvg(blueprint);
      handleNodeClick(nodeType, blueprint, sit, lanes);
    });
  });
}

function updateMapLiveStatusCard(sit, lanes, blueprint) {
  const stageLabel = document.getElementById('map-status-stage-label');
  const titleEl = document.getElementById('map-status-title');
  const descEl = document.getElementById('map-status-desc');
  const actionBtn = document.getElementById('map-status-action-btn');

  if (!stageLabel || !titleEl || !descEl) return;

  if (activeMapStage === 0) {
    stageLabel.textContent = 'STAGE 0 · YOU ARE HERE';
    stageLabel.style.borderColor = 'var(--color-cyber-cyan)';
    stageLabel.style.color = 'var(--color-cyber-cyan)';
    titleEl.textContent = `Active Coordinates: ${sit.fullTitle}`;
    descEl.textContent = `${sit.tagline} Location anchor: ${sit.locationText}. Click nodes 01, 02, or 03 to trace your branching progression.`;
    if (actionBtn) {
      actionBtn.href = `opportunities.html?situation=${encodeURIComponent(sit.fullTitle)}`;
      actionBtn.querySelector('span').textContent = 'Explore Starting Opportunities →';
    }
  } else if (activeMapStage === 1) {
    stageLabel.textContent = 'STAGE 01 · LEARN';
    stageLabel.style.borderColor = 'var(--color-neon-mint)';
    stageLabel.style.color = 'var(--color-neon-mint)';
    titleEl.textContent = `Active Stage: ${lanes[0].node}`;
    descEl.textContent = `${lanes[0].detail}. Foundational upskilling calibrated specifically for your starting background.`;
    if (actionBtn) {
      actionBtn.href = 'opportunities.html?category=Courses';
      actionBtn.querySelector('span').textContent = 'View Accredited Learning & Bootcamps →';
    }
  } else if (activeMapStage === 2) {
    stageLabel.textContent = 'STAGE 02 · BUILD';
    stageLabel.style.borderColor = 'var(--color-cyber-cyan)';
    stageLabel.style.color = 'var(--color-cyber-cyan)';
    titleEl.textContent = `Active Stage: ${lanes[1].node}`;
    descEl.textContent = `${lanes[1].detail}. Employers hire tangible evidence over promises. Build proof that speaks for you.`;
    if (actionBtn) {
      actionBtn.href = 'resources.html';
      actionBtn.querySelector('span').textContent = 'See Portfolio Blueprint Guide →';
    }
  } else if (activeMapStage === 3) {
    stageLabel.textContent = 'STAGE 03 · WORK';
    stageLabel.style.borderColor = 'var(--color-neon-mint)';
    stageLabel.style.color = 'var(--color-neon-mint)';
    titleEl.textContent = `Active Stage: ${lanes[2].node}`;
    descEl.textContent = `${lanes[2].detail}. Paid workplace residency with senior industry mentorship and network access.`;
    if (actionBtn) {
      actionBtn.href = 'opportunities.html?category=Internships';
      actionBtn.querySelector('span').textContent = 'Browse Paid Residencies & Learnerships →';
    }
  } else {
    stageLabel.textContent = 'STAGE 04 · FUTURE HORIZON';
    stageLabel.style.borderColor = 'var(--color-solar-amber)';
    stageLabel.style.color = 'var(--color-solar-amber)';
    titleEl.textContent = `Horizon: ${blueprint.title} (${blueprint.subtitle})`;
    descEl.textContent = `${blueprint.description} Core capabilities: ${blueprint.skillsNeeded.slice(0, 3).join(' · ')}.`;
    if (actionBtn) {
      actionBtn.href = 'opportunities.html';
      actionBtn.querySelector('span').textContent = 'View All Matching Positions →';
    }
  }
}

function handleNodeClick(nodeType, blueprint, sit, lanes) {
  const modalOverlay = document.getElementById('node-detail-modal');
  const modalTitle = document.getElementById('node-modal-title');
  const modalContent = document.getElementById('node-modal-content');
  if (!modalOverlay || !modalTitle || !modalContent) return;

  const activeSit = sit || SITUATION_METADATA[userOnboardingData.situation || 'graduate'];
  const activeLanes = lanes || [
    { label: 'LEARN', node: activeSit.learnLane.node, detail: activeSit.learnLane.detail },
    { label: 'BUILD', node: activeSit.buildLane.node, detail: activeSit.buildLane.detail },
    { label: 'WORK', node: activeSit.workLane.node, detail: activeSit.workLane.detail }
  ];

  if (nodeType === 'you') {
    modalTitle.textContent = `Starting Point: ${activeSit.fullTitle}`;
    modalContent.innerHTML = `
      <div style="background: rgba(0, 229, 255, 0.1); border: 1px solid var(--color-cyber-cyan); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 16px; font-family: var(--font-mono); font-size: 12px; color: var(--color-cyber-cyan);">
        📍 ACTIVE MAP ANCHOR: ${activeSit.locationText}
      </div>
      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
        ${activeSit.tagline} Your current situation is not a barrier — it's the exact launchpad coordinate from which branching pathways open.
      </p>
      <div class="opp-meta-unboxed">
        <span>Curiosity First</span>
        <span class="opp-meta-sep">·</span>
        <span>Accredited SETA Pathways</span>
        <span class="opp-meta-sep">·</span>
        <span>Branching Routes Open</span>
      </div>
    `;
  } else if (nodeType === 'learn') {
    modalTitle.textContent = `01 · LEARN: ${activeLanes[0].node}`;
    modalContent.innerHTML = `
      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
        ${escapeHtml(activeLanes[0].detail)}
      </p>
      <h4 style="font-size: 14px; margin-bottom: 8px;">Recommended Subsidised Pathways:</h4>
      <ul style="padding-left: 20px; color: var(--text-secondary); font-size: 14px; display: flex; flex-direction: column; gap: 8px;">
        ${blueprint.courses.map(c => `<li><a href="${c.url}" style="color: var(--color-teal); text-decoration: underline;">${escapeHtml(c.name)}</a></li>`).join('')}
      </ul>
    `;
  } else if (nodeType === 'build') {
    modalTitle.textContent = `02 · BUILD: ${activeLanes[1].node}`;
    modalContent.innerHTML = `
      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
        ${escapeHtml(activeLanes[1].detail)}
      </p>
      <h4 style="font-size: 14px; margin-bottom: 8px;">Suggested Portfolio Missions:</h4>
      <ul style="padding-left: 20px; color: var(--text-secondary); font-size: 14px; display: flex; flex-direction: column; gap: 8px;">
        ${blueprint.projectIdeas.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
      </ul>
    `;
  } else if (nodeType === 'work') {
    modalTitle.textContent = `03 · WORK: ${activeLanes[2].node}`;
    modalContent.innerHTML = `
      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
        ${escapeHtml(activeLanes[2].detail)}
      </p>
      <a href="opportunities.html?category=Internships" class="btn btn-primary btn-sm" style="margin-top: 12px;">
        View Matching Internships &amp; Learnerships →
      </a>
    `;
  } else {
    modalTitle.textContent = `Destination: ${blueprint.title}`;
    modalContent.innerHTML = `
      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
        ${escapeHtml(blueprint.description)}
      </p>
      <div style="background: var(--bg-surface-subtle); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 13px;">
        <strong>Core Capabilities:</strong> ${blueprint.skillsNeeded.join(' · ')}
      </div>
    `;
  }

  modalOverlay.classList.add('open');
}

/**
 * Render "My Possibility DNA" Profile Card
 */
function renderPossibilityDnaCard(blueprint) {
  const dnaContainer = document.getElementById('possibility-dna-container');
  if (!dnaContainer) return;

  const { tech, creative, business, leadership, people } = blueprint.dna;

  dnaContainer.innerHTML = `
    <div class="possibility-dna-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div>
          <span class="section-kicker">PERSONALIZED PROFILE</span>
          <h3 class="text-h3">My Possibility DNA</h3>
        </div>
        <div class="floating-signal-badge">
          <span class="signal-dot"></span>
          <span>DISCOVERY ARCHETYPE: ${escapeHtml(blueprint.title)}</span>
        </div>
      </div>

      <div style="margin: 24px 0;">
        <div class="dna-bar-item">
          <div class="dna-bar-header">
            <span>TECH &amp; SYSTEMS</span>
            <span class="text-mono">${tech}%</span>
          </div>
          <div class="dna-bar-track"><div class="dna-bar-fill" style="width: ${tech}%;"></div></div>
        </div>

        <div class="dna-bar-item">
          <div class="dna-bar-header">
            <span>CREATIVE &amp; EXPRESSION</span>
            <span class="text-mono">${creative}%</span>
          </div>
          <div class="dna-bar-track"><div class="dna-bar-fill" style="width: ${creative}%;"></div></div>
        </div>

        <div class="dna-bar-item">
          <div class="dna-bar-header">
            <span>COMMERCIAL &amp; BUSINESS</span>
            <span class="text-mono">${business}%</span>
          </div>
          <div class="dna-bar-track"><div class="dna-bar-fill" style="width: ${business}%;"></div></div>
        </div>

        <div class="dna-bar-item">
          <div class="dna-bar-header">
            <span>LEADERSHIP &amp; VISION</span>
            <span class="text-mono">${leadership}%</span>
          </div>
          <div class="dna-bar-track"><div class="dna-bar-fill" style="width: ${leadership}%;"></div></div>
        </div>

        <div class="dna-bar-item">
          <div class="dna-bar-header">
            <span>PEOPLE &amp; COMMUNITY</span>
            <span class="text-mono">${people}%</span>
          </div>
          <div class="dna-bar-track"><div class="dna-bar-fill" style="width: ${people}%;"></div></div>
        </div>
      </div>

      <!-- Core Strengths -->
      <div style="margin-bottom: 20px;">
        <strong style="font-size: 12px; font-family: var(--font-mono); color: var(--text-muted); display: block; margin-bottom: 8px;">EMERGING STRENGTHS:</strong>
        <div class="opp-meta-unboxed">
          ${blueprint.strengths.map(s => `<span>${escapeHtml(s)}</span>`).join('<span class="opp-meta-sep" aria-hidden="true">·</span>')}
        </div>
      </div>

      <!-- Mandatory Exploratory Disclaimer -->
      <div style="padding-top: 14px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-muted); font-style: italic;">
        Exploratory career profile — designed to help you discover possibilities, not determine your future.
      </div>
    </div>
  `;
}

/**
 * Render "Meet Your Possible Futures" 3 Cards
 */
function renderPossibleFuturesGrid(activeIndex = 0) {
  const container = document.getElementById('possible-futures-grid');
  if (!container) return;

  container.innerHTML = FUTURE_BLUEPRINTS.slice(0, 3).map((future, idx) => {
    const isActive = idx === activeIndex;
    return `
      <div class="future-identity-card ${isActive ? 'active' : ''}" data-future-index="${idx}" style="cursor: pointer;">
        <div>
          <span class="section-kicker">FUTURE 0${idx + 1}</span>
          <h3 style="font-size: 1.35rem; margin-top: 4px;">${escapeHtml(future.title)}</h3>
          <span style="font-size: 13px; color: var(--color-teal); font-weight: 600;">${escapeHtml(future.subtitle)}</span>
        </div>

        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
          ${escapeHtml(future.description)}
        </p>

        <div style="font-size: 13px;">
          <strong style="display: block; margin-bottom: 6px; font-size: 12px; color: var(--text-muted);">TOP SKILLS:</strong>
          <div class="opp-meta-unboxed">
            ${future.skillsNeeded.slice(0, 3).map(s => `<span>${escapeHtml(s)}</span>`).join('<span class="opp-meta-sep" aria-hidden="true">·</span>')}
          </div>
        </div>

        <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; color: var(--color-teal);">
          <span>${isActive ? 'CURRENT MAP ACTIVE' : 'SWITCH TO THIS MAP'}</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-future-index]').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-future-index'), 10);
      renderPossibilityResults(idx);
    });
  });
}

/**
 * Render Matching Real Opportunities from JSON
 */
async function renderMatchingOpportunities(blueprint) {
  const container = document.getElementById('matching-opportunities-container');
  if (!container) return;

  const all = await fetchOpportunities();
  
  // Match by skill keywords or title
  const matches = all.filter(opp => {
    const combined = `${opp.title} ${opp.shortDescription} ${(opp.skillsTags || []).join(' ')}`.toLowerCase();
    return blueprint.skillsNeeded.some(s => combined.includes(s.toLowerCase()));
  }).slice(0, 3);

  if (matches.length > 0) {
    container.innerHTML = matches.map(renderOpportunityCard).join('');
    attachBookmarkListeners(container);
  } else {
    container.innerHTML = all.slice(0, 3).map(renderOpportunityCard).join('');
    attachBookmarkListeners(container);
  }
}

/**
 * Possibility Map Controls ("SHOW ME ANOTHER FUTURE →" & Live Starting Point Switcher)
 */
function initPossibilityMapControls() {
  const regenerateBtn = document.getElementById('regenerate-future-btn');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => {
      const nextIndex = (currentBlueprintIndex + 1) % FUTURE_BLUEPRINTS.length;
      renderPossibilityResults(nextIndex);
      
      const mapCanvas = document.getElementById('possibility-map-container');
      if (mapCanvas) {
        mapCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showToast('Alternate future pathway generated.');
    });
  }

  // Live Starting Point Switcher Bar listeners
  document.querySelectorAll('#map-starting-point-bar [data-switch-situation]').forEach(pill => {
    pill.addEventListener('click', () => {
      const targetSit = pill.getAttribute('data-switch-situation');
      userOnboardingData.situation = targetSit;
      activeMapStage = 0; // reset active stage to origin for new starting point
      
      const blueprint = FUTURE_BLUEPRINTS[currentBlueprintIndex];
      renderPossibilityMapSvg(blueprint);
      
      const sit = SITUATION_METADATA[targetSit] || SITUATION_METADATA.graduate;
      showToast(`Map recalibrated for ${sit.shortLabel} starting coordinates!`);
    });
  });
}

/**
 * "I Have No Idea" Mode Controller
 */
function initNoIdeaFlow() {
  const triggerBtn = document.getElementById('no-idea-mode-trigger');
  const flowContainer = document.getElementById('no-idea-flow-container');
  if (!triggerBtn || !flowContainer) return;

  triggerBtn.addEventListener('click', () => {
    flowContainer.style.display = 'block';
    flowContainer.scrollIntoView({ behavior: 'smooth' });
    initThisOrThatStep(1);
  });
}

const THIS_OR_THAT_STEPS = [
  {
    step: 1,
    question: 'When faced with a challenge, what pulls you in naturally?',
    optA: { text: 'MAKE SOMETHING NEW', subtitle: 'Crafting things from scratch with tools, code, or design', choice: 'create' },
    optB: { text: 'FIX SOMETHING BROKEN', subtitle: 'Diagnosing puzzles, repairing bugs, or untangling complex knots', choice: 'repair' }
  },
  {
    step: 2,
    question: 'Where does your energy thrive most?',
    optA: { text: 'WORK WITH PEOPLE', subtitle: 'Listening, guiding, rallying teams, and community impact', choice: 'people' },
    optB: { text: 'WORK WITH SYSTEMS', subtitle: 'Diving deep into models, software logic, and quiet deep-work flows', choice: 'systems' }
  },
  {
    step: 3,
    question: 'How do you prefer to experience progress?',
    optA: { text: 'HANDS-ON TANGIBLE CRAFT', subtitle: 'Seeing a screen, an object, or a live demo working right now', choice: 'tangible' },
    optB: { text: 'BIG IDEAS & STRATEGY', subtitle: 'Mapping out ecosystems, business opportunities, and future visions', choice: 'strategy' }
  }
];

let noIdeaResponses = {};

function initThisOrThatStep(stepIndex) {
  const container = document.getElementById('this-or-that-card-slot');
  if (!container) return;

  if (stepIndex > THIS_OR_THAT_STEPS.length) {
    // Show gentle finish
    renderNoIdeaFinish();
    return;
  }

  const current = THIS_OR_THAT_STEPS[stepIndex - 1];

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="section-kicker">STEP 0${stepIndex} OF 03 · NO JUDGEMENT DISCOVERY</span>
      <h3 class="text-h2">${escapeHtml(current.question)}</h3>
    </div>

    <div class="this-or-that-card-pair">
      <div class="this-or-that-option" data-choice="${current.optA.choice}">
        <span style="font-size: 32px; display: block; margin-bottom: 12px;">⚡</span>
        <h4 style="font-size: 1.4rem; margin-bottom: 8px;">${escapeHtml(current.optA.text)}</h4>
        <p style="font-size: 14px; color: var(--text-secondary);">${escapeHtml(current.optA.subtitle)}</p>
      </div>

      <div class="this-or-that-option" data-choice="${current.optB.choice}">
        <span style="font-size: 32px; display: block; margin-bottom: 12px;">🧩</span>
        <h4 style="font-size: 1.4rem; margin-bottom: 8px;">${escapeHtml(current.optB.text)}</h4>
        <p style="font-size: 14px; color: var(--text-secondary);">${escapeHtml(current.optB.subtitle)}</p>
      </div>
    </div>
  `;

  container.querySelectorAll('.this-or-that-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const choice = opt.getAttribute('data-choice');
      noIdeaResponses[`step_${stepIndex}`] = choice;
      opt.classList.add('selected');
      setTimeout(() => {
        initThisOrThatStep(stepIndex + 1);
      }, 350);
    });
  });
}

function renderNoIdeaFinish() {
  const container = document.getElementById('this-or-that-card-slot');
  if (!container) return;

  // Decide blueprint
  let recommendedIndex = 0;
  if (noIdeaResponses.step_2 === 'people') {
    recommendedIndex = 1; // The Creator
  } else if (noIdeaResponses.step_3 === 'strategy') {
    recommendedIndex = 2; // The Entrepreneur
  } else {
    recommendedIndex = 0; // The Builder
  }

  const rec = FUTURE_BLUEPRINTS[recommendedIndex];

  container.innerHTML = `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-accent); border-radius: var(--radius-lg); padding: 40px; text-align: center; max-width: 680px; margin: 0 auto;">
      <span class="section-kicker">HERE IS A GENTLE STARTING POINT</span>
      <h3 class="text-h2" style="margin-bottom: 12px;">You might truly enjoy: ${escapeHtml(rec.title)}</h3>
      <p class="text-lead" style="margin-bottom: 24px;">
        Based on your instincts, exploring ${escapeHtml(rec.subtitle.toLowerCase())} gives you the exact blend of curiosity and room to grow.
      </p>
      <button id="view-no-idea-map-btn" class="btn btn-primary btn-lg">
        SEE YOUR PERSONAL POSSIBILITY MAP →
      </button>
    </div>
  `;

  const viewBtn = document.getElementById('view-no-idea-map-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', () => {
      renderPossibilityResults(recommendedIndex);
      const resultsSection = document.getElementById('possibility-results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
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
