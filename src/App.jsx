import { useState, useMemo, useEffect, useRef } from "react";
import {
  Upload, FileText, Sparkles, Target, TrendingUp, Clock, CheckCircle2, XCircle,
  ChevronRight, ChevronLeft, Search, Bell, MessageSquare, Bookmark,
  ArrowRight, Zap, Award, Briefcase, GraduationCap, Rocket, Code2,
  MapPin, Calendar, X, Send, LayoutDashboard, ListChecks,
  AlertTriangle, ArrowUpRight, Compass, Layers, Wand2, ShieldCheck
} from "lucide-react";

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";

import { supabase } from "./lib/supabase.js";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

import "./App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/* =============================================================================
   DATA
============================================================================= */
const SKILL_POOL = [
  "Python","JavaScript","TypeScript","React","Node.js","Java","C++","Go","SQL",
  "MongoDB","PostgreSQL","Machine Learning","Deep Learning","TensorFlow","PyTorch",
  "NLP","Computer Vision","Data Analysis","Pandas","NumPy","FastAPI","Django",
  "Flask","AWS","Azure","GCP","Docker","Kubernetes","Git","Linux","REST APIs",
  "GraphQL","HTML/CSS","Tailwind CSS","Figma","UI/UX Design","Cybersecurity",
  "Blockchain","Solidity","DevOps","CI/CD","Excel","Tableau","Power BI","R",
  "Statistics","System Design","Agile/Scrum","Firebase","Redux"
];

const ROLE_POOL = [
  "AI/ML Engineer","Backend Developer","Frontend Developer","Full-Stack Developer",
  "Data Scientist","Data Analyst","Cloud Engineer","DevOps Engineer",
  "Product Designer","Security Engineer","Research Assistant","Software Engineer"
];

const DOMAIN_POOL = [
  "AI/ML","Data Science","Web Development","Cloud Computing","Cybersecurity",
  "FinTech","HealthTech","Climate Tech","Robotics","Design","Open Source","EdTech"
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 0, 0);
  return d;
}
function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysLeft(d) {
  const now = new Date();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

// requiredSkills carry the weight; preferredSkills are nice-to-have.
// eligibility: { minYear, degrees[] } — degrees=null means open to all.
const RAW_OPPORTUNITIES = [
  // ---------------- INTERNSHIPS ----------------
  { title: "AI/ML Internship", org: "Continuum AI Research", category: "Internship",
    desc: "Work alongside research engineers building applied ML pipelines for real production traffic — from data collection to model deployment.",
    required: ["Python","Machine Learning","SQL"], preferred: ["FastAPI","AWS","Pandas"],
    domains: ["AI/ML","Data Science"], roles: ["AI/ML Engineer","Data Scientist"],
    eligibility: { minYear: 3, degrees: ["B.Tech","B.E","M.Tech"] },
    location: "Bengaluru, IN", remote: false, deadlineDays: 3, stipend: "₹45,000/mo", duration: "6 months", difficulty: "Competitive" },
  { title: "Software Engineer Intern", org: "Quanta Cloud", category: "Internship",
    desc: "Ship features on Quanta's core platform team, pairing with senior engineers on distributed systems that run at real scale.",
    required: ["JavaScript","React","Node.js"], preferred: ["TypeScript","GraphQL","Docker"],
    domains: ["Web Development","Cloud Computing"], roles: ["Full-Stack Developer","Software Engineer"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 5, stipend: "$1,800/mo", duration: "3 months", difficulty: "Moderate" },
  { title: "Data Science Intern", org: "Sable Analytics", category: "Internship",
    desc: "Turn messy client data into dashboards and forecasts that shape actual business decisions, under a dedicated mentor.",
    required: ["Python","Pandas","Statistics"], preferred: ["Tableau","SQL","R"],
    domains: ["Data Science"], roles: ["Data Analyst","Data Scientist"],
    eligibility: { minYear: 2, degrees: null },
    location: "Pune, IN", remote: true, deadlineDays: 9, stipend: "₹30,000/mo", duration: "4 months", difficulty: "Moderate" },
  { title: "Cloud Infrastructure Intern", org: "Orbital Systems", category: "Internship",
    desc: "Help harden the infra that keeps Orbital's satellites' ground software online — provisioning, monitoring, and incident response.",
    required: ["AWS","Docker","Linux"], preferred: ["Kubernetes","CI/CD","Python"],
    domains: ["Cloud Computing"], roles: ["Cloud Engineer","DevOps Engineer"],
    eligibility: { minYear: 3, degrees: ["B.Tech","B.E"] },
    location: "Hyderabad, IN", remote: false, deadlineDays: 14, stipend: "₹40,000/mo", duration: "6 months", difficulty: "Competitive" },
  { title: "Product Design Intern", org: "Prism Design Collective", category: "Internship",
    desc: "Design end-to-end flows for a consumer app used by a few hundred thousand people, with weekly critiques from senior designers.",
    required: ["Figma","UI/UX Design"], preferred: ["HTML/CSS","React"],
    domains: ["Design"], roles: ["Product Designer"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 20, stipend: "$1,200/mo", duration: "3 months", difficulty: "Moderate" },
  { title: "Security Engineering Intern", org: "Meridian Security", category: "Internship",
    desc: "Rotate across red-team exercises and defensive tooling, reporting real findings into Meridian's client-facing audits.",
    required: ["Cybersecurity","Linux"], preferred: ["Python","Git"],
    domains: ["Cybersecurity"], roles: ["Security Engineer"],
    eligibility: { minYear: 3, degrees: null },
    location: "Remote", remote: true, deadlineDays: 6, stipend: "$1,500/mo", duration: "4 months", difficulty: "Competitive" },
  { title: "Backend Engineering Intern", org: "Northwind FinTech", category: "Internship",
    desc: "Build ledger and payments services where correctness matters more than speed — heavy focus on testing and system design.",
    required: ["Java","SQL","System Design"], preferred: ["Docker","AWS"],
    domains: ["FinTech"], roles: ["Backend Developer"],
    eligibility: { minYear: 3, degrees: ["B.Tech","B.E","M.Tech"] },
    location: "Mumbai, IN", remote: false, deadlineDays: 11, stipend: "₹50,000/mo", duration: "6 months", difficulty: "Competitive" },
  { title: "Computer Vision Intern", org: "Vantage Robotics", category: "Internship",
    desc: "Train and evaluate perception models running on real robots in a warehouse pilot — not a notebook exercise.",
    required: ["Python","Computer Vision","PyTorch"], preferred: ["Docker","Linux"],
    domains: ["AI/ML","Robotics"], roles: ["AI/ML Engineer","Research Assistant"],
    eligibility: { minYear: 3, degrees: ["B.Tech","M.Tech","B.E"] },
    location: "Remote", remote: true, deadlineDays: 8, stipend: "$1,600/mo", duration: "5 months", difficulty: "Competitive" },

  // ---------------- JOBS ----------------
  { title: "Junior Backend Developer", org: "Cascade Data Co", category: "Job",
    desc: "Own service-level features on Cascade's data-ingestion platform, from API design through on-call rotation.",
    required: ["Python","FastAPI","SQL"], preferred: ["Docker","AWS","REST APIs"],
    domains: ["Data Science","Cloud Computing"], roles: ["Backend Developer"],
    eligibility: { minYear: 4, degrees: null },
    location: "Remote", remote: true, deadlineDays: 18, stipend: "₹9,00,000/yr", duration: "Full-time", difficulty: "Competitive" },
  { title: "Frontend Engineer", org: "Driftwood Studios", category: "Job",
    desc: "Turn design-system components into pixel-accurate, accessible interfaces for a fast-moving product team.",
    required: ["React","TypeScript","HTML/CSS"], preferred: ["Tailwind CSS","Redux"],
    domains: ["Web Development","Design"], roles: ["Frontend Developer"],
    eligibility: { minYear: 4, degrees: null },
    location: "Remote", remote: true, deadlineDays: 25, stipend: "$68,000/yr", duration: "Full-time", difficulty: "Moderate" },
  { title: "ML Platform Engineer", org: "Continuum AI Research", category: "Job",
    desc: "Build the internal tooling researchers use to train, version, and ship models — infra work with real ML context.",
    required: ["Python","Docker","Kubernetes"], preferred: ["AWS","Machine Learning","CI/CD"],
    domains: ["AI/ML","Cloud Computing"], roles: ["AI/ML Engineer","DevOps Engineer"],
    eligibility: { minYear: 4, degrees: ["B.Tech","M.Tech"] },
    location: "Bengaluru, IN", remote: false, deadlineDays: 30, stipend: "₹14,00,000/yr", duration: "Full-time", difficulty: "Competitive" },
  { title: "Data Analyst", org: "Clearwater Data Trust", category: "Job",
    desc: "Partner with policy researchers to turn public datasets into clear, defensible analysis and visual reporting.",
    required: ["SQL","Excel","Data Analysis"], preferred: ["Python","Tableau","Power BI"],
    domains: ["Data Science"], roles: ["Data Analyst"],
    eligibility: { minYear: 3, degrees: null },
    location: "Remote", remote: true, deadlineDays: 22, stipend: "$55,000/yr", duration: "Full-time", difficulty: "Approachable" },
  { title: "Associate Security Analyst", org: "Ironclad Cyber", category: "Job",
    desc: "Triage alerts, write detection rules, and help small clients close their most exploitable gaps first.",
    required: ["Cybersecurity","Linux","Python"], preferred: ["Cloud Computing","Git"],
    domains: ["Cybersecurity"], roles: ["Security Engineer"],
    eligibility: { minYear: 4, degrees: null },
    location: "Remote", remote: true, deadlineDays: 16, stipend: "₹8,00,000/yr", duration: "Full-time", difficulty: "Moderate" },

  // ---------------- HACKATHONS ----------------
  { title: "Vertex Hackers League", org: "Vertex Hackers League", category: "Hackathon",
    desc: "48-hour build sprint judged on working demos only — no slideware. Prize pool plus fast-track interviews with sponsors.",
    required: ["JavaScript","React"], preferred: ["Python","Machine Learning","Node.js"],
    domains: ["Web Development","AI/ML"], roles: ["Full-Stack Developer","Software Engineer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Delhi, IN", remote: false, deadlineDays: 5, stipend: "₹3,00,000 prize pool", duration: "48 hours", difficulty: "Moderate" },
  { title: "ML Hackathon: Applied Health", org: "Lumen Health Tech", category: "Hackathon",
    desc: "Build a working ML prototype against a real, anonymized clinical dataset provided on day one.",
    required: ["Python","Machine Learning"], preferred: ["Deep Learning","Data Analysis","Pandas"],
    domains: ["AI/ML","HealthTech"], roles: ["AI/ML Engineer","Data Scientist"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 7, stipend: "$5,000 prize pool", duration: "36 hours", difficulty: "Competitive" },
  { title: "GreenGrid Climate Hack", org: "GreenGrid Energy", category: "Hackathon",
    desc: "Prototype tools that make energy-grid data usable by non-experts — judged by working utility-sector mentors.",
    required: ["Python","Data Analysis"], preferred: ["React","SQL"],
    domains: ["Climate Tech","Data Science"], roles: ["Data Analyst","Full-Stack Developer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 12, stipend: "$4,000 prize pool", duration: "24 hours", difficulty: "Approachable" },
  { title: "Loomis Robotics Cup", org: "Loomis Robotics Cup", category: "Hackathon",
    desc: "Teams build and demo an autonomous navigation stack on provided hardware kits over one intense weekend.",
    required: ["Python","Computer Vision"], preferred: ["C++","Machine Learning"],
    domains: ["Robotics","AI/ML"], roles: ["AI/ML Engineer","Research Assistant"],
    eligibility: { minYear: 2, degrees: ["B.Tech","B.E"] },
    location: "Chennai, IN", remote: false, deadlineDays: 15, stipend: "₹2,00,000 prize pool", duration: "48 hours", difficulty: "Competitive" },
  { title: "FinTech Builders Weekend", org: "Nova Fintech Foundation", category: "Hackathon",
    desc: "Design and ship a working prototype against a real payments sandbox API, with fintech founders judging.",
    required: ["JavaScript","REST APIs"], preferred: ["React","Node.js","SQL"],
    domains: ["FinTech","Web Development"], roles: ["Full-Stack Developer","Backend Developer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 9, stipend: "$3,500 prize pool", duration: "36 hours", difficulty: "Moderate" },
  { title: "Foundry DevOps Challenge", org: "Foundry DevOps Guild", category: "Hackathon",
    desc: "Automate a deliberately broken deployment pipeline against the clock, judged on reliability, not flash.",
    required: ["Docker","CI/CD"], preferred: ["Kubernetes","AWS","Linux"],
    domains: ["Cloud Computing"], roles: ["DevOps Engineer","Cloud Engineer"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 27, stipend: "$2,500 prize pool", duration: "24 hours", difficulty: "Moderate" },

  // ---------------- SCHOLARSHIPS ----------------
  { title: "Solstice Scholars Program", org: "Solstice Scholars Program", category: "Scholarship",
    desc: "Full-tuition support plus a summer research stipend for undergraduates pursuing computing-adjacent degrees.",
    required: [], preferred: ["Machine Learning","Data Analysis"],
    domains: ["AI/ML","Data Science"], roles: ["Research Assistant"],
    eligibility: { minYear: 1, degrees: ["B.Tech","B.E","B.Sc"] },
    location: "Remote", remote: true, deadlineDays: 21, stipend: "Full tuition + ₹1,00,000/yr", duration: "Annual award", difficulty: "Highly Competitive" },
  { title: "Pathlight Scholars", org: "Pathlight Scholars", category: "Scholarship",
    desc: "Need-based scholarship for students from underrepresented regions studying engineering or computer science.",
    required: [], preferred: [],
    domains: ["Web Development","Data Science","AI/ML"], roles: [],
    eligibility: { minYear: 1, degrees: ["B.Tech","B.E"] },
    location: "Remote", remote: true, deadlineDays: 34, stipend: "$4,000/yr", duration: "Annual award", difficulty: "Moderate" },
  { title: "Women in Cloud Scholarship", org: "Quanta Cloud", category: "Scholarship",
    desc: "Tuition support and a mentorship track for women pursuing cloud and infrastructure careers.",
    required: [], preferred: ["AWS","Docker"],
    domains: ["Cloud Computing"], roles: ["Cloud Engineer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 40, stipend: "$3,000/yr", duration: "Annual award", difficulty: "Moderate" },
  { title: "HelixBio Research Scholarship", org: "HelixBio Computing", category: "Scholarship",
    desc: "Supports students combining computing with life sciences, with priority for applied ML in biology.",
    required: [], preferred: ["Python","Machine Learning","Statistics"],
    domains: ["AI/ML","HealthTech"], roles: ["Research Assistant"],
    eligibility: { minYear: 2, degrees: ["B.Tech","B.Sc","M.Tech"] },
    location: "Remote", remote: true, deadlineDays: 28, stipend: "₹1,50,000/yr", duration: "Annual award", difficulty: "Competitive" },
  { title: "Skylark Aerospace STEM Award", org: "Skylark Aerospace", category: "Scholarship",
    desc: "Merit scholarship plus a guaranteed interview slot for students interested in aerospace software systems.",
    required: [], preferred: ["C++","Python","System Design"],
    domains: ["Robotics"], roles: ["Software Engineer"],
    eligibility: { minYear: 2, degrees: ["B.Tech","B.E"] },
    location: "Remote", remote: true, deadlineDays: 45, stipend: "₹80,000/yr", duration: "Annual award", difficulty: "Competitive" },

  // ---------------- FELLOWSHIPS ----------------
  { title: "Pinecrest AI Fellowship", org: "Pinecrest University AI Fellowship", category: "Fellowship",
    desc: "A 10-week paid research fellowship pairing students with faculty on published, peer-reviewed ML work.",
    required: ["Python","Machine Learning"], preferred: ["Deep Learning","NLP","PyTorch"],
    domains: ["AI/ML"], roles: ["Research Assistant","AI/ML Engineer"],
    eligibility: { minYear: 3, degrees: ["B.Tech","M.Tech","B.Sc"] },
    location: "Remote", remote: true, deadlineDays: 4, stipend: "$3,200 stipend", duration: "10 weeks", difficulty: "Highly Competitive" },
  { title: "Summit Founders Fellowship", org: "Summit Founders Fellowship", category: "Fellowship",
    desc: "Builds early founders: a stipend, mentorship, and a small grant for students prototyping a real startup idea.",
    required: [], preferred: ["Product Management","React","Figma"],
    domains: ["Web Development","Design"], roles: ["Product Designer","Full-Stack Developer"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 19, stipend: "$5,000 grant", duration: "3 months", difficulty: "Highly Competitive" },
  { title: "Fathom Ocean Data Fellowship", org: "Fathom Ocean Data", category: "Fellowship",
    desc: "Work with real oceanographic sensor data to build models supporting climate researchers.",
    required: ["Python","Data Analysis"], preferred: ["Machine Learning","R","Statistics"],
    domains: ["Climate Tech","Data Science"], roles: ["Data Scientist","Research Assistant"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 13, stipend: "$2,400 stipend", duration: "8 weeks", difficulty: "Competitive" },
  { title: "Trellis EdTech Fellowship", org: "Trellis EdTech", category: "Fellowship",
    desc: "Design and ship a real feature used by classrooms during the fellowship, with a teacher-facing user base.",
    required: ["JavaScript","React"], preferred: ["UI/UX Design","Node.js"],
    domains: ["EdTech","Web Development"], roles: ["Full-Stack Developer","Product Designer"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 24, stipend: "$2,000 stipend", duration: "8 weeks", difficulty: "Moderate" },
  { title: "Beacon Nonprofit Tech Fellowship", org: "Beacon Nonprofit Tech", category: "Fellowship",
    desc: "Embed with a nonprofit for a summer, building the internal tools they can't otherwise afford to build.",
    required: ["Python","SQL"], preferred: ["React","FastAPI"],
    domains: ["Web Development","Data Science"], roles: ["Backend Developer","Full-Stack Developer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 31, stipend: "$1,800 stipend", duration: "10 weeks", difficulty: "Moderate" },

  // ---------------- OPEN SOURCE ----------------
  { title: "Anchor Open Source Initiative", org: "Anchor Open Source Initiative", category: "Open Source",
    desc: "A funded summer-of-code style program: pick a real maintained project and ship merged contributions.",
    required: ["Git","Python"], preferred: ["Docker","REST APIs"],
    domains: ["Open Source","Web Development"], roles: ["Backend Developer","Software Engineer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 17, stipend: "$3,000 stipend", duration: "10 weeks", difficulty: "Competitive" },
  { title: "OpenForge Foundation Grant", org: "OpenForge Foundation", category: "Open Source",
    desc: "Small grants for students maintaining or significantly improving an open-source developer tool.",
    required: ["Git"], preferred: ["TypeScript","Python","Go"],
    domains: ["Open Source"], roles: ["Software Engineer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 36, stipend: "$1,500 grant", duration: "Flexible", difficulty: "Moderate" },
  { title: "CodeHarbor Docs Sprint", org: "CodeHarbor", category: "Open Source",
    desc: "Paid sprint improving documentation and onboarding for a widely-used open-source data library.",
    required: ["Git","Python"], preferred: ["Data Analysis"],
    domains: ["Open Source","Data Science"], roles: ["Software Engineer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 10, stipend: "$800 stipend", duration: "3 weeks", difficulty: "Approachable" },
  { title: "GraphQL Federation Contributor Program", org: "OpenForge Foundation", category: "Open Source",
    desc: "Contribute to a federated GraphQL gateway used by mid-size startups, with a maintainer reviewing every PR.",
    required: ["GraphQL","Node.js"], preferred: ["TypeScript","Docker"],
    domains: ["Web Development","Open Source"], roles: ["Backend Developer"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 23, stipend: "$1,200 stipend", duration: "6 weeks", difficulty: "Moderate" },

  // ---------------- COMPETITIONS ----------------
  { title: "Continuum Applied ML Competition", org: "Continuum AI Research", category: "Competition",
    desc: "Leaderboard-based competition on a held-out production-style dataset, with a real interview offer for top 10.",
    required: ["Python","Machine Learning"], preferred: ["Deep Learning","Pandas","NumPy"],
    domains: ["AI/ML"], roles: ["AI/ML Engineer","Data Scientist"],
    eligibility: { minYear: 2, degrees: null },
    location: "Remote", remote: true, deadlineDays: 26, stipend: "$6,000 prize pool", duration: "3 weeks", difficulty: "Highly Competitive" },
  { title: "Meridian Capture the Flag", org: "Meridian Security", category: "Competition",
    desc: "A weekend-long CTF spanning web, crypto, and reverse engineering challenges, scored live.",
    required: ["Cybersecurity"], preferred: ["Python","Linux"],
    domains: ["Cybersecurity"], roles: ["Security Engineer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 6, stipend: "$2,000 prize pool", duration: "48 hours", difficulty: "Competitive" },
  { title: "Arcline Design Sprint Cup", org: "Arcline Studios", category: "Competition",
    desc: "Solve a real client brief in 72 hours; the winning concept gets built and shipped by Arcline.",
    required: ["Figma","UI/UX Design"], preferred: ["HTML/CSS"],
    domains: ["Design"], roles: ["Product Designer"],
    eligibility: { minYear: 1, degrees: null },
    location: "Remote", remote: true, deadlineDays: 33, stipend: "$1,500 prize pool", duration: "72 hours", difficulty: "Moderate" },
];

const OPPORTUNITIES = RAW_OPPORTUNITIES.map((o, i) => ({
  id: `opp_${i + 1}`,
  applicationUrl: "#",
  ...o,
  deadline: daysFromNow(o.deadlineDays),
}));

const CATEGORY_ICON = {
  Internship: Briefcase, Job: Layers, Hackathon: Zap, Scholarship: GraduationCap,
  Fellowship: Compass, "Open Source": Code2, Competition: Award,
};

const DEMO_PROFILE = {
  name: "Ayushi",
  email: "ayushi@example.com",
  degree: "B.Tech",
  branch: "Computer Science",
  college: "Not specified",
  year: 3,
  skills: ["Python","Machine Learning","React","SQL","FastAPI","Pandas"],
  interests: ["AI/ML","Data Science","Software Development"],
  preferredRoles: ["ML Engineer","AI Engineer","Backend Developer"],
  preferredDomains: ["AI/ML","Data Science"],
  careerGoal: "AI/ML Internship",
  location: "Bengaluru, IN",
  remotePreference: "Either",
  resumeFileName: "ayushi_resume.pdf",
  experience: [{ title: "ML Research Assistant (part-time)", org: "College Lab", months: 4 }],
  projects: [
    { name: "AI Resume Analyzer", tech: ["Python","FastAPI","React"], impact: "Parses resumes and scores skill matches for 200+ test users." },
    { name: "Crop Yield Predictor", tech: ["Python","Machine Learning","Pandas"], impact: "Regression model used in a college research demo, 84% accuracy." },
  ],
  achievements: ["Runner-up, campus ML hackathon 2025", "AWS Cloud Practitioner (in progress)"],
};

const DEMO_PROFILE_2 = {
  name: "Deeksha",
  email: "deeksha@example.com",
  degree: "B.Tech",
  branch: "Information Technology",
  college: "Not specified",
  year: 2,
  skills: ["JavaScript","React","HTML/CSS","Figma","UI/UX Design","Git"],
  interests: ["Web Development","Design"],
  preferredRoles: ["Frontend Developer","Product Designer","Full-Stack Developer"],
  preferredDomains: ["Web Development","Design"],
  careerGoal: "Frontend Developer Internship",
  location: "Remote",
  remotePreference: "Remote",
  resumeFileName: "deeksha_resume.pdf",
  experience: [],
  projects: [
    { name: "Campus Events Redesign", tech: ["Figma","React","HTML/CSS"], impact: "Redesigned and rebuilt the college events site, used by ~1,200 students." },
    { name: "Personal Portfolio", tech: ["React","Tailwind CSS"], impact: "Deployed personal site showcasing 4 UI case studies." },
  ],
  achievements: ["Best UI award, campus design sprint 2025"],
};

const DEMO_PROFILES = [
  { key: "ayushi", label: "Ayushi", subtitle: "AI/ML · 3rd year B.Tech CSE", profile: DEMO_PROFILE },
  { key: "deeksha", label: "Deeksha", subtitle: "Frontend & Design · 2nd year B.Tech IT", profile: DEMO_PROFILE_2 },
];

/* =============================================================================
   AI ENGINE — rule-based + explainable. No live LLM dependency; this is the
   "graceful fallback" the demo runs on entirely.
============================================================================= */
const WEIGHTS = { skill: 0.35, goal: 0.20, eligibility: 0.15, education: 0.10, experience: 0.10, interest: 0.05, deadline: 0.05 };

function computeMatch(profile, opp) {
  const userSkills = new Set(profile.skills.map((s) => s.toLowerCase()));
  const required = opp.required || [];
  const preferred = opp.preferred || [];

  const matchedRequired = required.filter((s) => userSkills.has(s.toLowerCase()));
  const missingRequired = required.filter((s) => !userSkills.has(s.toLowerCase()));
  const matchedPreferred = preferred.filter((s) => userSkills.has(s.toLowerCase()));
  const niceToHave = preferred.filter((s) => !userSkills.has(s.toLowerCase()));

  const skillScore = required.length === 0
    ? (preferred.length ? matchedPreferred.length / preferred.length : 1)
    : (matchedRequired.length / required.length) * 0.85 + (preferred.length ? (matchedPreferred.length / preferred.length) * 0.15 : 0.15);

  const goalMatch = opp.domains.some((d) => profile.preferredDomains.includes(d)) ||
    opp.roles.some((r) => profile.preferredRoles.some((pr) => r.toLowerCase().includes(pr.toLowerCase().split(" ")[0])));
  const goalScore = goalMatch ? 1 : (opp.domains.some((d) => profile.interests.includes(d)) ? 0.55 : 0.2);

  let eligibilityOk = true;
  if (opp.eligibility?.minYear && profile.year < opp.eligibility.minYear) eligibilityOk = false;
  if (opp.eligibility?.degrees && !opp.eligibility.degrees.includes(profile.degree)) eligibilityOk = false;
  const eligibilityScore = eligibilityOk ? 1 : 0.25;

  const educationScore = !opp.eligibility?.degrees || opp.eligibility.degrees.includes(profile.degree) ? 1 : 0.4;

  const experienceMonths = (profile.experience || []).reduce((a, e) => a + e.months, 0) + (profile.projects || []).length * 2;
  const experienceScore = Math.min(1, 0.5 + experienceMonths / 24);

  const interestScore = opp.domains.some((d) => profile.interests.includes(d)) ? 1 : 0.3;

  const dl = daysLeft(opp.deadline);
  const deadlineScore = dl <= 3 ? 1 : dl <= 7 ? 0.85 : dl <= 14 ? 0.65 : dl <= 30 ? 0.45 : 0.3;

  const raw =
    skillScore * WEIGHTS.skill +
    goalScore * WEIGHTS.goal +
    eligibilityScore * WEIGHTS.eligibility +
    educationScore * WEIGHTS.education +
    experienceScore * WEIGHTS.experience +
    interestScore * WEIGHTS.interest +
    deadlineScore * WEIGHTS.deadline;

  const score = Math.round(Math.max(0, Math.min(1, raw)) * 100);

  const reasons = [];
  if (matchedRequired.length) reasons.push(`You match ${matchedRequired.length} of ${required.length || matchedRequired.length} core requirements.`);
  if (goalMatch) reasons.push(`Aligned with your career goal and preferred domains.`);
  if (!eligibilityOk) reasons.push(`Eligibility is a stretch — check year/degree requirements before applying.`);
  if (missingRequired.length) reasons.push(`${missingRequired.length} required skill${missingRequired.length > 1 ? "s" : ""} still missing: ${missingRequired.join(", ")}.`);

  return {
    score, matchedRequired, missingRequired, matchedPreferred, niceToHave,
    eligibilityOk, reasons,
    breakdown: [
      { label: "Skill Match", value: Math.round(skillScore * 100), weight: 35 },
      { label: "Career Goal", value: Math.round(goalScore * 100), weight: 20 },
      { label: "Eligibility", value: Math.round(eligibilityScore * 100), weight: 15 },
      { label: "Education", value: Math.round(educationScore * 100), weight: 10 },
      { label: "Experience", value: Math.round(experienceScore * 100), weight: 10 },
      { label: "Interest", value: Math.round(interestScore * 100), weight: 5 },
      { label: "Deadline Priority", value: Math.round(deadlineScore * 100), weight: 5 },
    ],
  };
}

function deadlineTone(days) {
  if (days <= 3) return { label: "CRITICAL", color: "var(--rose)", bg: "var(--rose-soft)" };
  if (days <= 7) return { label: "HIGH", color: "var(--amber)", bg: "var(--amber-soft)" };
  if (days <= 14) return { label: "MEDIUM", color: "var(--cobalt)", bg: "rgba(76,141,255,0.14)" };
  return { label: "LOW", color: "var(--text-muted)", bg: "var(--surface-2)" };
}

const SKILL_LEARNING_HINTS = {
  "AWS": "Learn AWS fundamentals (EC2, S3, IAM) and deploy one project to the cloud.",
  "Docker": "Containerize an existing project with Docker — one clean Dockerfile is enough.",
  "Kubernetes": "Learn Kubernetes basics by deploying a containerized app to a local cluster (minikube).",
  "Machine Learning": "Work through a applied ML course and rebuild one project's core logic from scratch.",
  "Deep Learning": "Complete a short deep learning course and train one small model end-to-end.",
  "SQL": "Practice writing joins and aggregations against a real dataset, not just tutorials.",
  "System Design": "Study 3–4 real system design case studies and sketch your own designs from memory.",
  "React": "Rebuild a small existing project's UI in React to internalize component patterns.",
  "TypeScript": "Convert one existing JavaScript project to TypeScript, one file at a time.",
  "Cybersecurity": "Complete a beginner CTF track to build hands-on security intuition.",
  "GraphQL": "Add a GraphQL layer in front of an existing REST API you've already built.",
  "CI/CD": "Set up a GitHub Actions pipeline that tests and deploys one of your projects automatically.",
  "Statistics": "Review core inferential statistics and apply it to a real dataset analysis.",
  "NLP": "Build a small text classification or summarization project using a pretrained model.",
  "Computer Vision": "Fine-tune a pretrained vision model on a small custom image dataset.",
  "Figma": "Redesign one screen of an app you use daily and document your design decisions.",
  "UI/UX Design": "Run a lightweight usability review on one of your own projects and fix the top 3 issues.",
};
function learningHint(skill) {
  return SKILL_LEARNING_HINTS[skill] || `Build a small focused project that forces you to use ${skill} in a real way.`;
}

function generateActionPlan(profile, opp, match) {
  const gaps = match.missingRequired.length ? match.missingRequired : match.niceToHave.slice(0, 2);
  const days = [];
  let dayNum = 1;
  gaps.slice(0, 3).forEach((skill) => {
    days.push({ day: dayNum++, title: `Learn ${skill} Fundamentals`, detail: learningHint(skill) });
  });
  if (gaps.length) {
    days.push({ day: dayNum++, title: "Apply New Skills to a Project", detail: `Extend "${(profile.projects?.[0]?.name) || "an existing project"}" to use ${gaps.slice(0,2).join(" and ")}, so it shows up in your portfolio, not just your notes.` });
    days.push({ day: dayNum++, title: "Deploy & Document", detail: "Deploy the updated project and write a short README explaining the decisions — reviewers skim, so make it easy to see the skill in five seconds." });
  }
  days.push({ day: dayNum++, title: "Tighten Your Resume", detail: `Move ${gaps[0] ? gaps[0] : "your strongest project"} near the top and quantify impact with real numbers where you can.` });
  days.push({ day: dayNum++, title: "Practice Technical Interview", detail: `Run through likely questions for a ${opp.roles[0] || opp.category} role, focused on ${(match.matchedRequired[0]) || opp.required[0] || "your core stack"}.` });
  days.push({ day: dayNum++, title: "Apply", detail: `Submit your application to ${opp.title} at ${opp.org} — don't wait for the plan to be "finished."` });
  return days.slice(0, 7).map((d, i) => ({ ...d, day: i + 1 }));
}

function aggregateSkillGaps(profile, opportunities) {
  const counts = {};
  opportunities.forEach((opp) => {
    const m = computeMatch(profile, opp);
    m.missingRequired.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([skill, count]) => ({ skill, count }));
}

function careerReadiness(profile, opportunities) {
  const matches = opportunities.map((o) => computeMatch(profile, o));
  const avgTop = matches.map((m) => m.score).sort((a, b) => b - a).slice(0, 8);
  const technical = Math.round(Math.min(100, profile.skills.length * 9));
  const experience = Math.round(Math.min(100, ((profile.experience || []).reduce((a, e) => a + e.months, 0)) * 12));
  const projects = Math.round(Math.min(100, (profile.projects || []).length * 32));
  const resumeQuality = Math.round(Math.min(100, 55 + (profile.achievements?.length || 0) * 12 + (profile.projects?.length || 0) * 6));
  const alignment = Math.round(avgTop.length ? avgTop.reduce((a, b) => a + b, 0) / avgTop.length : 50);
  const oppReadiness = Math.round((matches.filter((m) => m.score >= 75).length / Math.max(1, matches.length)) * 100 + 20);
  const overall = Math.round((technical + experience + projects + resumeQuality + alignment + Math.min(100, oppReadiness)) / 6);
  return {
    overall: Math.min(99, overall),
    breakdown: [
      { label: "Technical Skills", value: Math.min(100, technical) },
      { label: "Experience", value: Math.min(100, experience) },
      { label: "Projects", value: Math.min(100, projects) },
      { label: "Resume Quality", value: Math.min(100, resumeQuality) },
      { label: "Career Alignment", value: Math.min(100, alignment) },
      { label: "Opportunity Readiness", value: Math.min(100, oppReadiness) },
    ],
  };
}

function assistantAnswer(question, ctx) {
  const { profile, opportunities } = ctx;
  const matches = opportunities.map((o) => ({ opp: o, match: computeMatch(profile, o) })).sort((a, b) => b.match.score - a.match.score);
  const top = matches[0];
  const q = question.toLowerCase();

  if (q.includes("apply to first") || q.includes("which opportunity should")) {
    const dl = daysLeft(top.opp.deadline);
    return `Apply to **${top.opp.title}** first — it's your strongest match at **${top.match.score}%**, ${dl <= 7 ? `and the deadline is close (${dl} days left), so it's time-sensitive.` : `with a comfortable ${dl}-day runway.`} ${top.match.missingRequired.length ? `Only ${top.match.missingRequired.join(", ")} is missing from the core requirements — closeable before you apply.` : `You already meet every core requirement.`}`;
  }
  if (q.includes("highest match")) {
    return `Your highest match right now is **${top.opp.title}** at **${top.match.score}%**, from ${top.opp.org}.`;
  }
  if (q.includes("skills should i learn") || q.includes("what skills")) {
    const gaps = aggregateSkillGaps(profile, opportunities).slice(0, 3);
    return gaps.length
      ? `Based on the opportunities you're closest to, focus on: ${gaps.map((g) => `**${g.skill}** (blocks ${g.count} opportunit${g.count > 1 ? "ies" : "y"})`).join(", ")}. Closing these would raise your match score across the board.`
      : `Your skill set already covers the core requirements for most opportunities in your list — focus on deepening your strongest skills instead.`;
  }
  if (q.includes("improve my profile") || q.includes("improve")) {
    return `Three concrete moves: add measurable impact numbers to your top project, close your biggest recurring skill gap (${aggregateSkillGaps(profile, opportunities)[0]?.skill || "none currently"}), and apply to at least one opportunity above 85% match this week so you're building momentum, not just readiness.`;
  }
  if (q.includes("this week") || q.includes("what should i do")) {
    const closing = matches.filter((m) => daysLeft(m.opp.deadline) <= 7 && m.match.score >= 70);
    return closing.length
      ? `You have ${closing.length} strong match${closing.length > 1 ? "es" : ""} closing within a week: ${closing.slice(0,3).map((c) => `${c.opp.title} (${c.match.score}%, ${daysLeft(c.opp.deadline)}d left)`).join("; ")}. Prioritize those over anything with a distant deadline.`
      : `Nothing urgent is closing this week — good time to work on your top skill gap and strengthen an existing project instead.`;
  }
  if (q.includes("roadmap") || q.includes("30-day") || q.includes("30 day")) {
    const gaps = aggregateSkillGaps(profile, opportunities).slice(0, 4);
    return `A focused 30-day roadmap: **Week 1–2** — close ${gaps[0]?.skill || "your top skill gap"} and ${gaps[1]?.skill || "a second gap"} with a small project each. **Week 3** — extend an existing project to use both, and deploy it. **Week 4** — update your resume and career profile, then apply to your top 3–4 matches while momentum is highest.`;
  }
  if (q.includes("why is this") || q.includes("why this")) {
    return `Open any opportunity and check the "Why This Match" tab — it breaks down exactly which required and preferred skills you have, which are missing, and how your education and career goal weigh into the score.`;
  }
  return `Based on your profile, your strongest current match is **${top.opp.title}** (${top.match.score}%). Ask me things like "which opportunity should I apply to first", "what skills should I learn", or "what should I do this week" and I'll answer from your actual profile and opportunity list.`;
}

/* =============================================================================
   UI PRIMITIVES
============================================================================= */
function MatchRing({ score, size = 56, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 85 ? "var(--teal)" : score >= 65 ? "var(--amber)" : "var(--rose)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="f-mono" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.27, fontWeight: 700, color }}>
        {score}
      </div>
    </div>
  );
}

function Pill({ children, tone = "neutral", size = "sm" }) {
  const tones = {
    neutral: { bg: "var(--surface-2)", color: "var(--text-muted)" },
    violet: { bg: "var(--violet-soft)", color: "var(--violet)" },
    teal: { bg: "var(--teal-soft)", color: "var(--teal)" },
    rose: { bg: "var(--rose-soft)", color: "var(--rose)" },
    amber: { bg: "var(--amber-soft)", color: "var(--amber)" },
  };
  const t = tones[tone];
  return (
    <span style={{
      background: t.bg, color: t.color, borderRadius: 999,
      padding: size === "sm" ? "3px 10px" : "5px 12px",
      fontSize: size === "sm" ? 11.5 : 13, fontWeight: 600, whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>{children}</span>
  );
}

function ProgressBar({ value, tone = "violet", height = 6 }) {
  const colors = { violet: "var(--violet)", teal: "var(--teal)", amber: "var(--amber)", rose: "var(--rose)", cobalt: "var(--cobalt)" };
  return (
    <div style={{ width: "100%", height, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: colors[tone], borderRadius: 999, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
    </div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", icon: Icon, style, disabled, type = "button" }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 11, fontWeight: 600, letterSpacing: "-0.01em",
    padding: size === "sm" ? "8px 14px" : size === "lg" ? "14px 26px" : "11px 18px",
    fontSize: size === "sm" ? 13.5 : size === "lg" ? 15.5 : 14.5,
    opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer",
  };
  const variants = {
    primary: { background: "linear-gradient(135deg,var(--violet),var(--cobalt))", color: "#fff" },
    secondary: { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border-strong)" },
    ghost: { background: "transparent", color: "var(--text-muted)" },
    danger: { background: "var(--rose-soft)", color: "var(--rose)" },
  };
  return (
    <button type={type} className="oos-btn" disabled={disabled} onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {Icon && <Icon size={size === "sm" ? 15 : 17} />}
      {children}
    </button>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div className="f-mono" style={{ fontSize: 11.5, color: "var(--violet)", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>{eyebrow}</div>}
        <h2 className="f-display" style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* =============================================================================
   LANDING
============================================================================= */
function Landing({ onDemo, onStart }) {
  const [hover, setHover] = useState(null);
  const features = [
    { icon: FileText, title: "AI Resume Intelligence", desc: "Reads your resume like a recruiter would — skills, projects, and signal, not keywords." },
    { icon: Target, title: "Smart Opportunity Matching", desc: "Explainable match scores from a weighted engine, not a black box." },
    { icon: Layers, title: "Skill Gap Analysis", desc: "Exactly which skills are missing, and which are just nice to have." },
    { icon: Wand2, title: "Personalized Action Plans", desc: "A day-by-day plan built from your real gaps, not a generic checklist." },
    { icon: Clock, title: "Deadline Intelligence", desc: "Surfaces what's closing soon, weighted by how good a fit it is." },
    { icon: ListChecks, title: "Application Tracking", desc: "One pipeline from saved to selected, so nothing falls through." },
  ];
  const steps = [
    { n: "01", title: "Upload Resume", desc: "PDF or DOCX — parsed in seconds." },
    { n: "02", title: "AI Understands You", desc: "Skills, projects, and goals become a structured career profile." },
    { n: "03", title: "Discover Best Matches", desc: "Ranked, explainable matches — not a list of everything." },
    { n: "04", title: "Fix Skill Gaps", desc: "A concrete plan to close what's missing." },
    { n: "05", title: "Apply With Confidence", desc: "Know exactly why you're a fit before you hit submit." },
  ];

  return (
  <div
  className="oos-fade-in"
  style={{
    minHeight: "100vh",
    width: "100%",
    maxWidth: "none",
    height: "auto",
    overflowX: "hidden",
    overflowY: "visible",
    boxSizing: "border-box",
  }}
>
      {/* NAV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 6vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,var(--violet),var(--cobalt))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span className="f-display" style={{ fontWeight: 700, fontSize: 17 }}>OpportunityOS</span>
        </div>
        <Button variant="secondary" size="sm" onClick={onDemo}>Try Demo</Button>
      </div>

      

      


      {/* HERO */}

<div
  style={{
    minHeight: "520px",
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "60px 6vw 80px",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    justifyContent: "center",
    gap: "70px",
    position: "relative",
    overflow: "hidden",
  }}
>
  
  {/* AI Opportunity Preview */}
<div
  style={{
    position: "relative",
    width: 360,
    maxWidth: "100%",
    zIndex: 2,
    order: 2,
  }}
>
  <div
    className="oos-card"
    style={{
      padding: 18,
      background:
        "linear-gradient(145deg, rgba(19,24,38,0.96), rgba(15,19,28,0.94))",
      boxShadow:
        "0 30px 80px rgba(0,0,0,0.45), 0 0 60px rgba(124,108,242,0.10)",
      border: "1px solid rgba(255,255,255,0.12)",
    }}
  >
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "var(--violet-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={15} color="var(--violet)" />
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            AI MATCH ENGINE
          </div>

          <div
            style={{
              fontSize: 10.5,
              color: "var(--text-faint)",
              marginTop: 2,
            }}
          >
            Analyzing your career fit
          </div>
        </div>
      </div>

      <div
        className="f-mono"
        style={{
          fontSize: 11,
          color: "var(--teal)",
          background: "var(--teal-soft)",
          padding: "5px 8px",
          borderRadius: 999,
        }}
      >
        LIVE
      </div>
    </div>

    {/* Match score */}
    <div
      style={{
        padding: 16,
        borderRadius: 13,
        background: "rgba(124,108,242,0.07)",
        border: "1px solid rgba(124,108,242,0.15)",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-faint)",
              marginBottom: 5,
            }}
          >
            TOP CAREER MATCH
          </div>

          <div
            className="f-display"
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            AI / ML Engineer
          </div>
        </div>

        <div
          className="f-mono"
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--teal)",
          }}
        >
          92%
        </div>
      </div>

      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "var(--surface-2)",
          marginTop: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "92%",
            height: "100%",
            borderRadius: 999,
            background:
              "linear-gradient(90deg, var(--violet), var(--teal))",
          }}
        />
      </div>
    </div>

    {/* Skills */}
    <div style={{ marginBottom: 15 }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-faint)",
          marginBottom: 9,
        }}
      >
        SKILL ANALYSIS
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {["Python", "Machine Learning", "SQL", "React"].map((skill) => (
          <span
            key={skill}
            style={{
              fontSize: 11,
              padding: "6px 9px",
              borderRadius: 7,
              background: "var(--teal-soft)",
              color: "var(--teal)",
              border: "1px solid rgba(52,211,172,0.12)",
            }}
          >
            ✓ {skill}
          </span>
        ))}

        <span
          style={{
            fontSize: 11,
            padding: "6px 9px",
            borderRadius: 7,
            background: "var(--rose-soft)",
            color: "var(--rose)",
            border: "1px solid rgba(242,99,124,0.12)",
          }}
        >
          + PyTorch
        </span>
      </div>
    </div>

    {/* Bottom insight */}
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: 12,
        borderRadius: 10,
        background: "var(--surface-2)",
      }}
    >
      <Target
        size={15}
        color="var(--violet)"
        style={{ flexShrink: 0, marginTop: 2 }}
      />

      <div
        style={{
          fontSize: 11.5,
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: "var(--text)", fontWeight: 600 }}>
          AI insight:
        </span>{" "}
        Add PyTorch to strengthen your ML profile and unlock more
        opportunities.
      </div>
    </div>
  </div>
</div>


  {/* Background glow */}
  <div
    style={{
      position: "absolute",
      top: "-180px",
      right: "-120px",
      width: 620,
      height: 620,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(124,108,242,0.22), rgba(76,141,255,0.08) 35%, transparent 70%)",
      pointerEvents: "none",
    }}
  />

  {/* Secondary glow */}
  <div
    style={{
      position: "absolute",
      bottom: "-220px",
      left: "-180px",
      width: 500,
      height: 500,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(52,211,172,0.10), transparent 70%)",
      pointerEvents: "none",
    }}
  />

  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(135deg, rgba(124,108,242,0.025), transparent 45%, rgba(76,141,255,0.04))",
      pointerEvents: "none",
    }}
  />

  <div
    style={{
      maxWidth: 650,
      flex: "1 1 55%",
      position: "relative",
      zIndex: 3,
    }}
    className="oos-rise"
  >
    {/* Badge */}
    <Pill tone="violet">
      <Sparkles size={12} />
      AI CAREER OPPORTUNITY AGENT
    </Pill>

    {/* Main heading */}
    <h1
      className="f-display"
      style={{
        fontSize: "clamp(40px, 6vw, 72px)",
        fontWeight: 700,
        lineHeight: 1.02,
        margin: "22px 0 20px",
        letterSpacing: "-0.04em",
        maxWidth: 760,
      }}
    >
     Your career opportunities,
      <br />
      <span
        style={{
          background:
            "linear-gradient(90deg, #8B7CFF, #4C8DFF, #34D3AC)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        powered by AI.
      </span>
    </h1>

    {/* Description */}
    <p
      style={{
        fontSize: 17.5,
        color: "var(--text-muted)",
        maxWidth: 620,
        lineHeight: 1.65,
        margin: "0 0 32px",
      }}
    >
      Upload your resume. Discover opportunities that actually fit you.
      Know what you're missing. Get a personalized plan to become
      application-ready.
    </p>

    {/* Buttons */}
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button
        size="lg"
        icon={ArrowRight}
        onClick={onStart}
      >
        Build My Career Profile
      </Button>

      <Button
        size="lg"
        variant="secondary"
        onClick={onDemo}
      >
        Explore Opportunities
      </Button>
    </div>

    {/* Trust / feature line */}
    <div
      style={{
        display: "flex",
        gap: 22,
        flexWrap: "wrap",
        marginTop: 30,
        color: "var(--text-faint)",
        fontSize: 12.5,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ShieldCheck size={14} />
        Resume Intelligence
      </span>

      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Target size={14} />
        Smart Matching
      </span>

      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Rocket size={14} />
        Personalized Roadmap
      </span>
    </div>
  </div>


        {/* Signature element: career signal preview card */}
        <div className="oos-card oos-rise" style={{ marginTop: 56, padding: 22,  maxWidth: 640, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div className="f-mono" style={{ fontSize: 11.5, color: "var(--text-faint)", letterSpacing: "0.06em" }}>AI CAREER PROFILE — PREVIEW</div>
            <Pill tone="teal"><CheckCircle2 size={11} /> READY</Pill>
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
            <MatchRing score={87} size={72} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 17 }}>AI/ML Engineer</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13.5, marginTop: 2 }}>Career Readiness · Recommended role</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {["Python","Machine Learning","FastAPI","React","SQL"].map((s) => <Pill key={s}>{s}</Pill>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
<div
  style={{
    padding: "7vh 6vw 8vh",
    position: "relative",
  }}
>
  <SectionHeading
    eyebrow="CAPABILITIES"
    title="Everything a career agent should do"
  />

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 18,
      marginTop: 28,
    }}
  >
    {features.map((f, i) => (
      <div
        key={f.title}
        className="oos-card oos-card--hover"
        onMouseEnter={() => setHover(i)}
        onMouseLeave={() => setHover(null)}
        style={{
          padding: 24,
          minHeight: 165,
          position: "relative",
          overflow: "hidden",
          transition:
            "transform .2s ease, border-color .2s ease, box-shadow .2s ease",
          transform: hover === i ? "translateY(-5px)" : "translateY(0)",
          borderColor:
            hover === i
              ? "rgba(124,108,242,.55)"
              : "rgba(255,255,255,.10)",
          boxShadow:
            hover === i
              ? "0 18px 45px rgba(0,0,0,.25)"
              : "0 10px 30px rgba(0,0,0,.12)",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,108,242,.16), transparent 70%)",
            top: -60,
            right: -40,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(124,108,242,.10)",
            border: "1px solid rgba(124,108,242,.18)",
          }}
        >
          <f.icon
            size={20}
            color={hover === i ? "var(--violet)" : "var(--text-muted)"}
          />
        </div>

        <div
          className="f-display"
          style={{
            fontWeight: 700,
            fontSize: 16,
            marginTop: 16,
          }}
        >
          {f.title}
        </div>

        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 13.5,
            marginTop: 7,
            lineHeight: 1.6,
          }}
        >
          {f.desc}
        </div>
      </div>
    ))}
  </div>
</div>

      {/* HOW IT WORKS */}
      <div style={{ padding: "6vh 6vw" }}>
        <SectionHeading eyebrow="THE PATH" title="How OpportunityOS works" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 0, position: "relative" }}>
          {steps.map((s) => (
            <div key={s.n} style={{ padding: "18px 16px 18px 0", borderTop: "1px solid var(--border)", position: "relative" }}>
              <div className="f-mono" style={{ color: "var(--text-faint)", fontSize: 12, marginBottom: 8 }}>{s.n}</div>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>{s.title}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 5, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY */}
      <div style={{ padding: "6vh 6vw", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div className="f-mono" style={{ fontSize: 11.5, color: "var(--violet)", letterSpacing: "0.08em", marginBottom: 14, fontWeight: 600 }}>WHY OPPORTUNITYOS</div>
          <h2 className="f-display" style={{ fontSize: "clamp(24px,3.4vw,34px)", fontWeight: 700, lineHeight: 1.25, margin: "0 0 18px" }}>
            Students don't lack opportunities.<br />They lack opportunity intelligence.
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15.5, lineHeight: 1.65 }}>
            Every job board says "here are 100 internships." OpportunityOS says: here are the three you should care about, here's why you match, here's what you're missing, and here's exactly what to do next.
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ padding: "8vh 6vw", textAlign: "center" }}>
        <h2 className="f-display" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, margin: "0 0 20px" }}>Stop guessing. Start matching.</h2>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button size="lg" icon={ArrowRight} onClick={onStart}>Build My Career Profile</Button>
          <Button size="lg" variant="secondary" onClick={onDemo}>Try Demo</Button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   ONBOARDING
============================================================================= */
function ChipToggle({ label, active, onClick }) {
  return (
    <button className="oos-btn" onClick={onClick} style={{
      padding: "8px 14px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
      border: `1px solid ${active ? "var(--violet)" : "var(--border-strong)"}`,
      background: active ? "var(--violet-soft)" : "transparent",
      color: active ? "var(--violet)" : "var(--text-muted)",
    }}>{label}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "var(--surface-2)", border: "1px solid var(--border-strong)",
  borderRadius: 10, padding: "11px 13px", color: "var(--text)", fontSize: 14.5, outline: "none",
};

function Onboarding({ onComplete, onDemo }) {
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", degree: "B.Tech", branch: "", college: "", year: 3,
    skills: [], interests: [], preferredRoles: [], preferredDomains: [],
    careerGoal: "", location: "", remotePreference: "Either",
  });
  const fileRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const saveProfile = async () => {
  const { error } = await supabase
    .from("profiles")
    .insert([{
      name: form.name,
      email: form.email,
      degree: form.degree,
      branch: form.branch,
      college: form.college,
      year: Number(form.year),
      skills: form.skills,
      interests: form.interests,
      preferred_roles: form.preferredRoles,
      preferred_domains: form.preferredDomains,
      career_goal: form.careerGoal,
      location: form.location,
      remote_preference: form.remotePreference,
    }]);

  if (error) {
    console.error("Profile save error:", error);
    alert("Profile save nahi hua. Console check karo.");
    return false;
  }

  return true;
};
  const toggleArr = (k, v) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

 const handleFile = async (file) => {
  if (!file) return;

  setUploading(true);

  try {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF resume for now.");
      setUploading(false);
      return;
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    let text = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      text += content.items
        .map((item) => item.str)
        .join(" ") + "\n";
    }

    console.log("REAL RESUME TEXT:", text);

    const lowerText = text.toLowerCase();

    const skillKeywords = [
      "python",
      "java",
      "javascript",
      "react",
      "sql",
      "machine learning",
      "deep learning",
      "tensorflow",
      "pytorch",
      "numpy",
      "pandas",
      "c++",
      "html",
      "css",
      "git",
      "github",
      "data analysis",
      "power bi",
      "excel",
      "nlp",
      "computer vision",
    ];

    const extractedSkills = skillKeywords.filter((skill) =>
      lowerText.includes(skill.toLowerCase())
    );

    setForm((f) => ({
      ...f,
      skills: extractedSkills,
      resumeText: text,
      resumeFileName: file.name,
    }));

    setUploaded(true);

    console.log("EXTRACTED SKILLS:", extractedSkills);
  } catch (error) {
    console.error("Resume parsing failed:", error);
    alert("Resume could not be read. Please try another PDF.");
  } finally {
    setUploading(false);
  }
};
  const steps = ["Resume", "Profile", "Skills & Goals"];

  return (
    <div className="oos-fade-in" style={{ maxWidth: 640, margin: "0 auto", padding: "6vh 20px 10vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 36, justifyContent: "center" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,var(--violet),var(--cobalt))", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <span className="f-display" style={{ fontWeight: 700, fontSize: 15.5 }}>OpportunityOS</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 34 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= step ? "var(--violet)" : "var(--surface-2)", marginBottom: 8, transition: "background .3s" }} />
            <div className="f-mono" style={{ fontSize: 11, color: i <= step ? "var(--text)" : "var(--text-faint)" }}>{s}</div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="oos-rise">
          <h2 className="f-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Upload your resume</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14.5, marginBottom: 22 }}>PDF or DOCX. We'll extract your skills, education, and projects automatically.</p>
          <div
            onClick={() => fileRef.current?.click()}
            className="oos-card"
            style={{ padding: 40, textAlign: "center", cursor: "pointer", borderStyle: "dashed", borderColor: uploaded ? "var(--teal)" : "var(--border-strong)" }}>
            <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
            {uploading ? (
              <>
                <div style={{ width: 30, height: 30, border: "3px solid var(--surface-2)", borderTopColor: "var(--violet)", borderRadius: "50%", margin: "0 auto 14px", animation: "oosSpin .8s linear infinite" }} />
                <div style={{ fontWeight: 600 }}>Parsing resume…</div>
                <div style={{ color: "var(--text-faint)", fontSize: 13, marginTop: 4 }}>Extracting skills, education, and projects</div>
              </>
            ) : uploaded ? (
              <>
                <CheckCircle2 size={30} color="var(--teal)" style={{ margin: "0 auto 14px" }} />
                <div style={{ fontWeight: 600 }}>Resume parsed successfully</div>
                <div style={{ color: "var(--text-faint)", fontSize: 13, marginTop: 4 }}>Skills pre-filled in the next step — you can edit them</div>
              </>
            ) : (
              <>
                <Upload size={26} color="var(--text-muted)" style={{ margin: "0 auto 14px" }} />
                <div style={{ fontWeight: 600 }}>Click to upload, or drag a file here</div>
                <div style={{ color: "var(--text-faint)", fontSize: 13, marginTop: 4 }}>Max 10MB · PDF or DOCX</div>
              </>
            )}
          </div>
          <div style={{ textAlign: "center", margin: "18px 0", color: "var(--text-faint)", fontSize: 13 }}>or</div>
          <Button variant="secondary" style={{ width: "100%" }} onClick={() => { setUploaded(true); }}>Skip and fill manually</Button>
          <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between" }}>
            <button className="oos-btn" onClick={onDemo} style={{ background: "none", color: "var(--text-faint)", fontSize: 13.5 }}>Just show me the demo →</button>
            <Button onClick={() => setStep(1)} icon={ChevronRight} disabled={!uploaded && !uploading}>Continue</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="oos-rise">
          <h2 className="f-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 22 }}>Tell us about you</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Full name"><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" /></Field>
            <Field label="Email"><input style={inputStyle} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@college.edu" /></Field>
            <Field label="Degree">
              <select style={inputStyle} value={form.degree} onChange={(e) => set("degree", e.target.value)}>
                {["B.Tech","B.E","B.Sc","M.Tech","M.Sc","Other"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Branch"><input style={inputStyle} value={form.branch} onChange={(e) => set("branch", e.target.value)} placeholder="Computer Science" /></Field>
            <Field label="College"><input style={inputStyle} value={form.college} onChange={(e) => set("college", e.target.value)} placeholder="Your college" /></Field>
            <Field label="Year">
              <select style={inputStyle} value={form.year} onChange={(e) => set("year", Number(e.target.value))}>
                {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </Field>
            <Field label="Preferred location"><input style={inputStyle} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, or Remote" /></Field>
            <Field label="Remote preference">
              <select style={inputStyle} value={form.remotePreference} onChange={(e) => set("remotePreference", e.target.value)}>
                {["Remote","On-site","Either"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
            <Button variant="ghost" icon={ChevronLeft} onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)} icon={ChevronRight}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="oos-rise">
          <h2 className="f-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 22 }}>Skills & career goals</h2>
          <Field label="Skills">
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {SKILL_POOL.slice(0, 24).map((s) => {
      const isActive = form.skills.some(
        (skill) => skill.toLowerCase().trim() === s.toLowerCase().trim()
      );

      return (
        <ChipToggle
          key={s}
          label={s}
          active={isActive}
          onClick={() => toggleArr("skills", s)}
        />
      );
    })}
  </div>
</Field>
          <Field label="Interests">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DOMAIN_POOL.map((s) => <ChipToggle key={s} label={s} active={form.interests.includes(s)} onClick={() => toggleArr("interests", s)} />)}
            </div>
          </Field>
          <Field label="Preferred roles">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ROLE_POOL.map((s) => <ChipToggle key={s} label={s} active={form.preferredRoles.includes(s)} onClick={() => toggleArr("preferredRoles", s)} />)}
            </div>
          </Field>
          <Field label="Preferred domains">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DOMAIN_POOL.map((s) => <ChipToggle key={s} label={s} active={form.preferredDomains.includes(s)} onClick={() => toggleArr("preferredDomains", s)} />)}
            </div>
          </Field>
          <Field label="Career goal"><input style={inputStyle} value={form.careerGoal} onChange={(e) => set("careerGoal", e.target.value)} placeholder="e.g. AI/ML Internship" /></Field>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
            <Button variant="ghost" icon={ChevronLeft} onClick={() => setStep(1)}>Back</Button>
            <Button
  icon={Sparkles}
  onClick={async () => {
    const profileData = {
      ...form,
      skills:form.skills,
      interests: form.interests.length ? form.interests : ["Software Development"],
      preferredDomains: form.preferredDomains.length
        ? form.preferredDomains
        : ["Web Development"],
      preferredRoles: form.preferredRoles.length
        ? form.preferredRoles
        : ["Software Engineer"],
      careerGoal: form.careerGoal || "Software Engineering Role",
      name: form.name || "Student",
      resumeFileName: uploaded ? "resume.pdf" : null,
      experience: [],
      projects: [],
      achievements: [],
    };

    const saved = await saveProfile();

    if (saved) {
      onComplete(profileData);
    }
  }}
>
  Build My Career Profile
</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   SHELL / NAV
============================================================================= */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "opportunities", label: "Opportunities", icon: Compass },
  { key: "tracker", label: "Tracker", icon: ListChecks },
];

function Shell({ view, setView, profile, children, notifCount, onOpenNotif, onOpenAssistant }) {
  return (
    <div
  className="oos-shell"
  style={{
    display: "flex",
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 80% 0%, rgba(124,108,242,.10), transparent 28%), #080B12",
  }}
>
        <div
      className="oos-shell__sidebar"
  style={{
    width: 240,
    minHeight: "100vh",
    borderRight: "1px solid rgba(255,255,255,.08)",
    background: "rgba(12,16,26,.88)",
    backdropFilter: "blur(20px)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    position: "sticky",
    top: 0,
  }}
>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px", marginBottom: 30 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,var(--violet),var(--cobalt))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={14} color="#fff" />
          </div>
          <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>OpportunityOS</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.key} className="oos-btn" onClick={() => setView(item.key)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9,
              background: view === item.key ? "var(--violet-soft)" : "transparent",
              color: view === item.key ? "var(--violet)" : "var(--text-muted)",
              fontSize: 14, fontWeight: 600, textAlign: "left",
            }}>
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          <button className="oos-btn" onClick={onOpenNotif} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 9, background: "transparent", color: "var(--text-muted)", fontSize: 14, fontWeight: 600, textAlign: "left" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Bell size={16} /> Notifications</span>
            {notifCount > 0 && <span className="f-mono" style={{ background: "var(--rose)", color: "#fff", borderRadius: 999, fontSize: 10.5, padding: "1px 6px" }}>{notifCount}</span>}
          </button>
          <button className="oos-btn" onClick={onOpenAssistant} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: "transparent", color: "var(--text-muted)", fontSize: 14, fontWeight: 600, textAlign: "left" }}>
            <MessageSquare size={16} /> AI Assistant
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px 4px", marginTop: 6, borderTop: "1px solid var(--border)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
              {profile.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{profile.degree} · Year {profile.year}</div>
            </div>
          </div>
        </div>
      </div>
        <div
      className="oos-shell__content"
  style={{
    flex: 1,
    minWidth: 0,
    padding: "32px 42px 70px",
    overflowY: "auto",
    maxWidth: 1500,
    margin: "0 auto",
    width: "100%",
  }}
>
  {children}</div>
    </div>
  );
}

/* =============================================================================
   DASHBOARD
============================================================================= */
function Dashboard({ profile, opportunities, matches, applications, setView, openOpp }) {
  const readiness = useMemo(() => careerReadiness(profile, opportunities), [profile, opportunities]);
  const sorted = useMemo(() => [...matches].sort((a, b) => b.match.score - a.match.score), [matches]);
  const strong = sorted.filter((m) => m.match.score >= 80);
  const closingSoon = sorted.filter((m) => daysLeft(m.opp.deadline) <= 7).sort((a,b) => daysLeft(a.opp.deadline) - daysLeft(b.opp.deadline));
  const gaps = useMemo(() => aggregateSkillGaps(profile, opportunities).slice(0, 5), [profile, opportunities]);
  const topGapSkill = gaps[0]?.skill;
  const trackedCount = Object.keys(applications).length;
  const topMatch = sorted[0];

  const radarData = readiness.breakdown.map((b) => ({ subject: b.label.split(" ")[0], value: b.value }));

  const stats = [
    { label: "Career readiness", value: `${readiness.overall}%`, icon: TrendingUp, tone: "violet", detail: "overall signal" },
    { label: "Opportunities", value: opportunities.length, icon: Compass, tone: "cobalt", detail: "matched to you" },
    { label: "Strong matches", value: strong.length, icon: Target, tone: "teal", detail: "80%+ fit" },
    { label: "Closing soon", value: closingSoon.length, icon: Clock, tone: "amber", detail: "next 7 days" },
    { label: "In your pipeline", value: trackedCount, icon: ListChecks, tone: "rose", detail: "saved or active" },
  ];

  return (
    <div className="oos-fade-in oos-dashboard">
      <div className="oos-dashboard__header">
        <div>
          <div className="f-mono oos-kicker">CAREER COMMAND CENTER</div>
          <h1 className="f-display oos-dashboard__title">Good to see you, {profile.name}.</h1>
          <p className="oos-dashboard__subtitle">Your strongest next move is already waiting in the data.</p>
        </div>
        <Button size="sm" icon={Compass} onClick={() => setView("opportunities")}>Explore matches</Button>
      </div>

      <div className="oos-dashboard__hero oos-card">
        <div className="oos-dashboard__hero-copy">
          <Pill tone="teal"><CheckCircle2 size={12} /> PROFILE SIGNAL: STRONG</Pill>
          <div className="f-display oos-dashboard__hero-title">Turn your profile into your next opportunity.</div>
          <p>OpportunityOS is ranking the roles where your current skills can make the biggest impact.</p>
          <div className="oos-dashboard__hero-actions">
            <Button icon={ArrowRight} onClick={() => topMatch && openOpp(topMatch.opp.id)}>View top match</Button>
            <button className="oos-btn oos-dashboard__text-action" onClick={() => setView("tracker")}>Open application tracker <ArrowUpRight size={14} /></button>
          </div>
        </div>
        <div className="oos-dashboard__hero-score">
          <div className="oos-dashboard__score-label f-mono">READINESS INDEX</div>
          <MatchRing score={readiness.overall} size={112} stroke={7} />
          <div className="oos-dashboard__score-note">Based on skills, projects, goals, and fit.</div>
        </div>
      </div>

      <div className="oos-dashboard__stats">
        {stats.map((s) => (
          <div key={s.label} className="oos-card oos-stat-card">
            <div className="oos-stat-card__top"><s.icon size={16} color={`var(--${s.tone})`} /><span className="f-mono">{s.detail}</span></div>
            <div className="f-mono oos-stat-card__value">{s.value}</div>
            <div className="oos-stat-card__label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="oos-dashboard__primary-grid">
        {/* Top opportunities */}
        <div className="oos-card oos-dashboard-panel oos-dashboard-panel--matches">
          <SectionHeading eyebrow="RECOMMENDED FOR YOU" title="Top opportunities" action={<button className="oos-btn oos-panel-action" onClick={() => setView("opportunities")}>View all <ArrowUpRight size={13} /></button>} />
          <div className="oos-match-list">
            {sorted.slice(0, 4).map(({ opp, match }) => (
              <button key={opp.id} className="oos-btn oos-match-row" onClick={() => openOpp(opp.id)}>
                <MatchRing score={match.score} size={40} stroke={4} />
                <div className="oos-match-row__copy">
                  <div className="oos-match-row__title">{opp.title}</div>
                  <div className="oos-match-row__meta">{opp.org} <span>·</span> {opp.category}</div>
                </div>
                <div className="oos-match-row__deadline f-mono">{daysLeft(opp.deadline)}d <ChevronRight size={15} /></div>
              </button>
            ))}
          </div>
        </div>

        {/* Radar */}
        <div className="oos-card oos-dashboard-panel oos-dashboard-panel--readiness">
          <SectionHeading eyebrow="WHERE TO FOCUS" title="Readiness breakdown" />
          <div className="oos-radar-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#9BA3B7", fontSize: 10.5 }} />
                <Radar dataKey="value" stroke="#7C6CF2" fill="#7C6CF2" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="oos-readiness-note"><TrendingUp size={14} color="var(--teal)" /> {readiness.breakdown.sort((a, b) => b.value - a.value)[0]?.label} is currently your strongest signal.</div>
        </div>
      </div>

      <div className="oos-dashboard__secondary-grid">
        {/* Skill gap */}
        <div className="oos-card oos-dashboard-panel">
          <SectionHeading eyebrow="NEXT LEVER" title="Skill gap analysis" />
          <div className="oos-gap-list">
            {gaps.map((g) => (
              <div key={g.skill} className="oos-gap-row">
                <div className="oos-gap-row__heading">
                  <span>{g.skill}</span>
                  <span className="f-mono">blocks {g.count}</span>
                </div>
                <ProgressBar value={Math.min(100, g.count * 14)} tone="rose" />
              </div>
            ))}
            {!gaps.length && <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>No recurring skill gaps — you're well aligned.</div>}
          </div>
        </div>

        {/* Deadlines */}
        <div className="oos-card oos-dashboard-panel">
          <SectionHeading eyebrow="TIME SENSITIVE" title="Deadline alerts" />
          {closingSoon.length > 0 && (
            <div className="oos-deadline-summary">
              {closingSoon.filter(c => c.match.score >= 75).length} high-match opportunit{closingSoon.filter(c => c.match.score >= 75).length === 1 ? "y is" : "ies are"} closing this week.
            </div>
          )}
          <div className="oos-deadline-list">
            {closingSoon.slice(0, 4).map(({ opp, match }) => {
              const dl = daysLeft(opp.deadline); const t = deadlineTone(dl);
              return (
                <button key={opp.id} className="oos-btn oos-deadline-row" onClick={() => openOpp(opp.id)}>
                  <div className="oos-deadline-row__copy">
                    <div className="oos-deadline-row__title">{opp.title}</div>
                    <div className="f-mono oos-deadline-row__meta">{match.score}% match <span>·</span> {dl}d left</div>
                  </div>
                  <Pill tone={dl <= 3 ? "rose" : dl <= 7 ? "amber" : "neutral"}>{t.label}</Pill>
                </button>
              );
            })}
            {!closingSoon.length && <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>Nothing urgent right now.</div>}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="oos-card oos-dashboard-insight">
        <div className="oos-dashboard-insight__icon">
            <Sparkles size={16} color="var(--violet)" />
        </div>
        <div className="oos-dashboard-insight__copy">
            <div className="f-mono oos-kicker">AI CAREER INSIGHT</div>
            <div className="oos-dashboard-insight__text">
              You're {strong.length >= 3 ? "highly competitive" : strong.length >= 1 ? "reasonably competitive" : "still building competitiveness"} for {profile.preferredDomains[0] || "your target"} roles.
              {topGapSkill ? ` ${topGapSkill} is currently your biggest recurring skill gap — closing it would raise your match score across ${gaps[0]?.count || 0} opportunities.` : " No major recurring skill gaps detected."}
            </div>
            <div className="oos-dashboard-insight__action">
              <Button size="sm" icon={ArrowRight} onClick={() => sorted[0] && openOpp(sorted[0].opp.id)}>Recommended next step: view your top match</Button>
            </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   OPPORTUNITY LIST
============================================================================= */
function OpportunityCard({ opp, match, onOpen, saved, onToggleSave }) {
  const dl = daysLeft(opp.deadline);
  const Icon = CATEGORY_ICON[opp.category] || Briefcase;
  return (
    <div className="oos-card oos-card--hover" style={{ padding: 18, cursor: "pointer", position: "relative" }} onClick={() => onOpen(opp.id)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
          <MatchRing score={match.score} size={46} stroke={4} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <Icon size={12.5} color="var(--text-faint)" />
              <span className="f-mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.03em" }}>{opp.category.toUpperCase()}</span>
            </div>
            <div className="f-display" style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.3 }}>{opp.title}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{opp.org}</div>
          </div>
        </div>
        <button className="oos-btn" onClick={(e) => { e.stopPropagation(); onToggleSave(opp.id); }} style={{ background: "none", padding: 4, flexShrink: 0 }}>
          <Bookmark size={17} color={saved ? "var(--amber)" : "var(--text-faint)"} fill={saved ? "var(--amber)" : "none"} />
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "14px 0" }}>
        {opp.required.slice(0, 4).map((s) => {
          const has = match.matchedRequired.includes(s);
          return <Pill key={s} tone={has ? "teal" : "rose"}>{has ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {s}</Pill>;
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-faint)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} /> {opp.remote ? "Remote" : opp.location}</span>
        <Pill tone={dl <= 3 ? "rose" : dl <= 7 ? "amber" : "neutral"}><Clock size={11} /> {dl}d left</Pill>
      </div>
    </div>
  );
}

const CATEGORIES = ["All", "Internship", "Job", "Hackathon", "Scholarship", "Fellowship", "Open Source", "Competition"];
const SORTS = ["Best Match", "Deadline", "Highest Match"];

function OpportunityList({ opportunities, matches, savedIds, onToggleSave, openOpp }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState("Best Match");

  const matchById = useMemo(() => Object.fromEntries(matches.map((m) => [m.opp.id, m.match])), [matches]);

  const filtered = useMemo(() => {
    let list = opportunities.filter((o) => {
      if (category !== "All" && o.category !== category) return false;
      if (remoteOnly && !o.remote) return false;
      if (matchById[o.id].score < minScore) return false;
      if (query && !(`${o.title} ${o.org} ${o.required.join(" ")}`.toLowerCase().includes(query.toLowerCase()))) return false;
      return true;
    });
    if (sort === "Best Match" || sort === "Highest Match") list = [...list].sort((a, b) => matchById[b.id].score - matchById[a.id].score);
    if (sort === "Deadline") list = [...list].sort((a, b) => a.deadline - b.deadline);
    return list;
  }, [opportunities, category, remoteOnly, minScore, query, sort, matchById]);

  return (
    <div className="oos-fade-in">
      <SectionHeading title="Opportunities" eyebrow={`${filtered.length} MATCHED`} />
      <div className="oos-card" style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "var(--surface-2)", borderRadius: 9, padding: "9px 12px" }}>
            <Search size={15} color="var(--text-faint)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, org, or skill…" style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 13.5, width: "100%" }} />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            {SORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <ChipToggle label="Remote only" active={remoteOnly} onClick={() => setRemoteOnly((r) => !r)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {CATEGORIES.map((c) => <ChipToggle key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>Min match {minScore}%</span>
            <input type="range" min={0} max={95} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 14 }}>
        {filtered.map((o) => (
          <OpportunityCard key={o.id} opp={o} match={matchById[o.id]} onOpen={openOpp} saved={savedIds.has(o.id)} onToggleSave={onToggleSave} />
        ))}
      </div>
      {!filtered.length && <div className="oos-card" style={{ padding: 40, textAlign: "center", color: "var(--text-faint)" }}>No opportunities match these filters. Try widening your search.</div>}
    </div>
  );
}

/* =============================================================================
   OPPORTUNITY DETAIL
============================================================================= */
const DETAIL_TABS = ["Overview", "Why This Match", "Skill Gap", "Action Plan", "About Organization"];

function OpportunityDetail({ opp, profile, match, onBack, onApply, onSave, saved, appStatus }) {
  const [tab, setTab] = useState("Overview");
  const [plan, setPlan] = useState(null);
  const dl = daysLeft(opp.deadline);
  const t = deadlineTone(dl);
  const Icon = CATEGORY_ICON[opp.category] || Briefcase;

  const genPlan = () => setPlan(generateActionPlan(profile, opp, match));

  return (
    <div className="oos-fade-in">
      <button className="oos-btn" onClick={onBack} style={{ background: "none", color: "var(--text-muted)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}>
        <ChevronLeft size={15} /> Back to opportunities
      </button>

      <div className="oos-card" style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", gap: 18 }}>
            <MatchRing score={match.score} size={64} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Icon size={13} color="var(--text-faint)" />
                <span className="f-mono" style={{ fontSize: 11.5, color: "var(--text-faint)", letterSpacing: "0.04em" }}>{opp.category.toUpperCase()}</span>
              </div>
              <h1 className="f-display" style={{ fontSize: 23, fontWeight: 700, margin: 0 }}>{opp.title}</h1>
              <div style={{ color: "var(--text-muted)", fontSize: 14.5, marginTop: 4 }}>{opp.org}</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12, fontSize: 12.5, color: "var(--text-faint)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12.5} /> {opp.remote ? "Remote" : opp.location}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={12.5} /> {fmtDate(opp.deadline)}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Layers size={12.5} /> {opp.duration}</span>
                {opp.stipend && <span style={{ display: "flex", alignItems: "center", gap: 5 }}>💰 {opp.stipend}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <Pill tone={dl <= 3 ? "rose" : dl <= 7 ? "amber" : "neutral"}><Clock size={11} /> {t.label} · {dl}d left</Pill>
            {appStatus && <Pill tone="violet">{appStatus}</Pill>}
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" icon={Bookmark} onClick={() => onSave(opp.id)}>{saved ? "Saved" : "Save"}</Button>
              <Button size="sm" icon={ArrowUpRight} onClick={() => onApply(opp.id)}>{appStatus ? "Update Status" : "Apply Now"}</Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid var(--border)", overflowX: "auto" }} className="oos-scrollbar-none">
        {DETAIL_TABS.map((tb) => (
          <button key={tb} className="oos-btn" onClick={() => setTab(tb)} style={{
            background: "none", padding: "10px 14px", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
            color: tab === tb ? "var(--text)" : "var(--text-faint)",
            borderBottom: tab === tb ? "2px solid var(--violet)" : "2px solid transparent",
          }}>{tb}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="oos-card oos-rise" style={{ padding: 22 }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text)", marginTop: 0 }}>{opp.desc}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginTop: 20 }}>
            <div><div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 4 }}>Difficulty</div><div style={{ fontWeight: 600, fontSize: 14 }}>{opp.difficulty}</div></div>
            <div><div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 4 }}>Eligibility</div><div style={{ fontWeight: 600, fontSize: 14 }}>{opp.eligibility.minYear ? `Year ${opp.eligibility.minYear}+` : "Open"}{opp.eligibility.degrees ? ` · ${opp.eligibility.degrees.join("/")}` : ""}</div></div>
            <div><div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 4 }}>Roles</div><div style={{ fontWeight: 600, fontSize: 14 }}>{opp.roles.join(", ") || "—"}</div></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 8 }}>Required skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{opp.required.map((s) => <Pill key={s}>{s}</Pill>)}</div>
          </div>
          {!!opp.preferred.length && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 8 }}>Preferred skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{opp.preferred.map((s) => <Pill key={s} tone="violet">{s}</Pill>)}</div>
            </div>
          )}
        </div>
      )}

      {tab === "Why This Match" && (
        <div className="oos-card oos-rise" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, marginBottom: 18 }}>
            You match <b>{match.matchedRequired.length} of {opp.required.length || match.matchedRequired.length}</b> core requirements.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--teal)", marginBottom: 10 }}>STRENGTHS</div>
              {[...match.matchedRequired, ...match.matchedPreferred].map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8 }}><CheckCircle2 size={15} color="var(--teal)" /> {s}</div>
              ))}
              {match.eligibilityOk && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}><CheckCircle2 size={15} color="var(--teal)" /> {profile.degree} eligibility met</div>}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--rose)", marginBottom: 10 }}>MISSING</div>
              {match.missingRequired.length ? match.missingRequired.map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8 }}><AlertTriangle size={15} color="var(--rose)" /> {s}</div>
              )) : <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>Nothing — you meet every required skill.</div>}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>SCORE BREAKDOWN</div>
            {match.breakdown.map((b) => (
              <div key={b.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                  <span>{b.label} <span style={{ color: "var(--text-faint)" }}>({b.weight}%)</span></span>
                  <span className="f-mono">{b.value}%</span>
                </div>
                <ProgressBar value={b.value} tone={b.value >= 70 ? "teal" : b.value >= 40 ? "amber" : "rose"} />
              </div>
            ))}
          </div>
          {match.missingRequired.length > 0 && (
            <div style={{ background: "var(--violet-soft)", borderRadius: 12, padding: 16, display: "flex", gap: 10 }}>
              <Sparkles size={16} color="var(--violet)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13.5, lineHeight: 1.6 }}><b>AI Recommendation:</b> {learningHint(match.missingRequired[0])}</div>
            </div>
          )}
        </div>
      )}

      {tab === "Skill Gap" && (
        <div className="oos-card oos-rise" style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--teal)", marginBottom: 10 }}>MATCHED</div>
              {[...match.matchedRequired, ...match.matchedPreferred].map((s) => <div key={s} style={{ fontSize: 14, marginBottom: 8 }}>✓ {s}</div>)}
              {!match.matchedRequired.length && !match.matchedPreferred.length && <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>None yet</div>}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--rose)", marginBottom: 10 }}>MISSING <Pill tone="rose" size="sm">HIGH PRIORITY</Pill></div>
              {match.missingRequired.map((s) => <div key={s} style={{ fontSize: 14, marginBottom: 8 }}>✕ {s}</div>)}
              {!match.missingRequired.length && <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>None</div>}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>NICE TO HAVE <Pill size="sm">LOW PRIORITY</Pill></div>
              {match.niceToHave.map((s) => <div key={s} style={{ fontSize: 14, marginBottom: 8, color: "var(--text-muted)" }}>○ {s}</div>)}
              {!match.niceToHave.length && <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>None</div>}
            </div>
          </div>
        </div>
      )}

      {tab === "Action Plan" && (
        <div className="oos-card oos-rise" style={{ padding: 22 }}>
          {!plan ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <Wand2 size={26} color="var(--violet)" style={{ marginBottom: 12 }} />
              <div className="f-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Become Application Ready</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 18, maxWidth: 380, margin: "0 auto 18px" }}>
                Generate a personalized day-by-day plan based on your missing skills, your existing projects, and this opportunity's requirements.
              </div>
              <Button icon={Wand2} onClick={genPlan}>Generate {Math.min(7, match.missingRequired.length + 4)}-Day Action Plan</Button>
            </div>
          ) : (
            <div>
              <div className="f-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{plan.length}-Day Action Plan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {plan.map((d) => (
                  <div key={d.day} style={{ display: "flex", gap: 14, padding: "14px 0", borderTop: "1px solid var(--border)" }}>
                    <div className="f-mono" style={{ width: 32, height: 32, borderRadius: 9, background: "var(--violet-soft)", color: "var(--violet)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{d.day}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>{d.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "About Organization" && (
        <div className="oos-card oos-rise" style={{ padding: 22 }}>
          <div className="f-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{opp.org}</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>
            {opp.org} runs the {opp.title} program in {opp.domains.join(" and ")}. Detailed organization profiles are populated when this opportunity source is connected in production — for this dataset, refer to the opportunity's application link for full organizational details.
          </p>
          <Button variant="secondary" size="sm" style={{ marginTop: 8 }}>Visit Application Page</Button>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   TRACKER
============================================================================= */
const PIPELINE = ["Saved","Preparing","Applied","Interview","Selected","Rejected"];
const PIPELINE_TONE = { Saved: "neutral", Preparing: "amber", Applied: "cobalt", Interview: "violet", Selected: "teal", Rejected: "rose" };

function Tracker({ applications, opportunities, matches, setStatus, openOpp }) {
  const oppById = useMemo(() => Object.fromEntries(opportunities.map((o) => [o.id, o])), [opportunities]);
  const matchById = useMemo(() => Object.fromEntries(matches.map((m) => [m.opp.id, m.match])), [matches]);
  const entries = Object.entries(applications);

  if (!entries.length) {
    return (
      <div className="oos-fade-in">
        <SectionHeading title="Application Tracker" />
        <div className="oos-card" style={{ padding: 50, textAlign: "center" }}>
          <ListChecks size={26} color="var(--text-faint)" style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No applications tracked yet</div>
          <div style={{ color: "var(--text-faint)", fontSize: 13.5 }}>Save or apply to an opportunity to start tracking it here.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="oos-fade-in">
      <SectionHeading title="Application Tracker" />
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {PIPELINE.map((stage) => {
          const count = entries.filter(([, s]) => s === stage).length;
          return (
            <div key={stage} className="oos-card" style={{ padding: "12px 16px", flex: "1 1 120px" }}>
              <div className="f-mono" style={{ fontSize: 22, fontWeight: 700, color: `var(--${PIPELINE_TONE[stage] === "neutral" ? "text" : PIPELINE_TONE[stage]})` }}>{count}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{stage}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        {PIPELINE.map((stage) => (
          <div key={stage}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--${PIPELINE_TONE[stage] === "neutral" ? "text-faint" : PIPELINE_TONE[stage]})` }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)" }}>{stage.toUpperCase()}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.filter(([, s]) => s === stage).map(([id]) => {
                const opp = oppById[id]; if (!opp) return null;
                const match = matchById[id];
                return (
                  <div key={id} className="oos-card" style={{ padding: 12, cursor: "pointer" }} onClick={() => openOpp(id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.title}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{opp.org}</div>
                      </div>
                      <span className="f-mono" style={{ fontSize: 11.5, color: "var(--text-faint)", flexShrink: 0 }}>{match?.score}%</span>
                    </div>
                    <select value={stage} onClick={(e) => e.stopPropagation()} onChange={(e) => setStatus(id, e.target.value)} style={{ ...inputStyle, marginTop: 10, padding: "6px 8px", fontSize: 12 }}>
                      {PIPELINE.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                );
              })}
              {!entries.filter(([, s]) => s === stage).length && <div style={{ color: "var(--text-faint)", fontSize: 12.5, padding: "8px 2px" }}>Empty</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================================================================
   ASSISTANT DRAWER
============================================================================= */
const SUGGESTED_QUESTIONS = [
  "Which opportunity should I apply to first?",
  "What skills should I learn?",
  "Which opportunity has the highest match?",
  "What should I do this week?",
  "How can I improve my profile?",
  "Create a 30-day AI/ML career roadmap.",
];

function AssistantDrawer({ open, onClose, ctx }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Hi ${ctx.profile.name}, I'm your AI career assistant. I can see your profile, skills, and opportunity matches — ask me anything, like "which opportunity should I apply to first?"` },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, open]);

  const send = (text) => {
    const q = text ?? input;
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: assistantAnswer(q, ctx) }]);
    }, 450);
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(5,7,12,0.5)" }} />
      <div className="oos-rise" style={{ position: "relative", width: 400, maxWidth: "92vw", background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--violet-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={13} color="var(--violet)" /></div>
            <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>AI Career Assistant</span>
          </div>
          <button className="oos-btn" onClick={onClose} style={{ background: "none", color: "var(--text-faint)" }}><X size={18} /></button>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
              <div style={{
                background: m.role === "user" ? "linear-gradient(135deg,var(--violet),var(--cobalt))" : "var(--surface)",
                color: m.role === "user" ? "#fff" : "var(--text)",
                border: m.role === "user" ? "none" : "1px solid var(--border)",
                borderRadius: 14, padding: "10px 13px", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
              }} dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
            </div>
          ))}
        </div>
        {messages.length <= 2 && (
          <div style={{ padding: "0 18px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
              <button key={q} className="oos-btn" onClick={() => send(q)} style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, color: "var(--text-muted)" }}>{q}</button>
            ))}
          </div>
        )}
        <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about your career…" style={{ ...inputStyle, flex: 1 }} />
          <Button size="sm" icon={Send} onClick={() => send()} />
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   NOTIFICATION PANEL
============================================================================= */
function NotificationPanel({ open, onClose, notifications }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(5,7,12,0.5)" }} />
      <div className="oos-rise" style={{ position: "relative", width: 380, maxWidth: "92vw", background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--bg-elevated)" }}>
          <span className="f-display" style={{ fontWeight: 700, fontSize: 14.5 }}>Notifications</span>
          <button className="oos-btn" onClick={onClose} style={{ background: "none", color: "var(--text-faint)" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n, i) => (
            <div key={i} className="oos-card" style={{ padding: 13 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{n.text}</div>
              <div className="f-mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>{n.tag}</div>
            </div>
          ))}
          {!notifications.length && <div style={{ color: "var(--text-faint)", fontSize: 13.5, padding: 20, textAlign: "center" }}>You're all caught up.</div>}
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   DEMO PICKER
============================================================================= */
function DemoPicker({ open, onClose, onPick }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(5,7,12,0.6)" }} />
      <div className="oos-rise" style={{ position: "relative", background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 18, padding: 26, maxWidth: 460, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span className="f-display" style={{ fontWeight: 700, fontSize: 17 }}>Choose a demo profile</span>
          <button className="oos-btn" onClick={onClose} style={{ background: "none", color: "var(--text-faint)" }}><X size={18} /></button>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: "0 0 18px" }}>Two sample students, two different career paths — see how matching adapts.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DEMO_PROFILES.map((d) => (
            <button key={d.key} className="oos-btn" onClick={() => onPick(d.profile)} style={{
              display: "flex", alignItems: "center", gap: 14, textAlign: "left", padding: 16,
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 13,
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--violet)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--violet-soft)", color: "var(--violet)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {d.label[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{d.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{d.subtitle}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                  {d.profile.skills.slice(0, 4).map((s) => <Pill key={s}>{s}</Pill>)}
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-faint)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   ROOT APP
============================================================================= */
export default function OpportunityOSApp() {
  const [stage, setStage] = useState("landing"); // landing | onboarding | app
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [applications, setApplications] = useState({});
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [demoPickerOpen, setDemoPickerOpen] = useState(false);

  const opportunities = OPPORTUNITIES;
  const matches = useMemo(() => profile ? opportunities.map((o) => ({ opp: o, match: computeMatch(profile, o) })) : [], [profile, opportunities]);

  const startDemo = () => setDemoPickerOpen(true);
  const pickDemoProfile = (demoProfile) => { setProfile(demoProfile); setStage("app"); setView("dashboard"); setDemoPickerOpen(false); };
  const startOnboarding = () => setStage("onboarding");
  const completeOnboarding = (form) => { setProfile(form); setStage("app"); setView("dashboard"); };

  const openOpp = (id) => { setSelectedOppId(id); setView("detail"); };
  const backFromDetail = () => { setSelectedOppId(null); setView("opportunities"); };

  const toggleSave = (id) => {
    setSavedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setApplications((a) => a[id] ? a : { ...a, [id]: "Saved" });
  };
  const applyTo = (id) => setApplications((a) => ({ ...a, [id]: a[id] === "Applied" ? "Applied" : "Applied" }));
  const setStatus = (id, status) => setApplications((a) => ({ ...a, [id]: status }));

  const notifications = useMemo(() => {
    if (!profile) return [];
    const sorted = [...matches].sort((a, b) => b.match.score - a.match.score);
    const list = [];
    sorted.filter((m) => daysLeft(m.opp.deadline) <= 3).slice(0, 3).forEach((m) => list.push({ text: `🔥 ${m.opp.title} closes in ${daysLeft(m.opp.deadline)} day${daysLeft(m.opp.deadline) === 1 ? "" : "s"}.`, tag: m.opp.org }));
    sorted.filter((m) => m.match.score >= 90).slice(0, 2).forEach((m) => list.push({ text: `🎯 You are a ${m.match.score}% match for ${m.opp.title}.`, tag: "Match alert" }));
    const gaps = aggregateSkillGaps(profile, opportunities);
    if (gaps[0]) list.push({ text: `🧩 ${gaps[0].skill} is your highest-priority skill gap.`, tag: `Blocks ${gaps[0].count} opportunities` });
    list.push({ text: `🚀 Your career profile and action plans are ready to explore.`, tag: "System" });
    return list;
  }, [profile, matches, opportunities]);

  const selectedOpp = selectedOppId ? opportunities.find((o) => o.id === selectedOppId) : null;
  const selectedMatch = selectedOpp && profile ? computeMatch(profile, selectedOpp) : null;

  const ctx = profile ? { profile, opportunities, applications } : null;

  return (
    <div
  className="oos-root"
  style={{
    width: "100vw",
    maxWidth: "100vw",
    minWidth: 0,
    minHeight: "100vh",
    height: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  }}
>
      <div
  style={{
    flex: 1,
    width: "100%",
    minWidth: 0,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  }}
>
        {stage === "landing" && <Landing onDemo={startDemo} onStart={startOnboarding} />}
        {stage === "onboarding" && <Onboarding onComplete={completeOnboarding} onDemo={startDemo} />}
        {stage === "app" && profile && (
          <div style={{ flex: 1, minHeight: 0 }}>
            <Shell view={view === "detail" ? "opportunities" : view} setView={setView} profile={profile}
              notifCount={notifications.length} onOpenNotif={() => setNotifOpen(true)} onOpenAssistant={() => setAssistantOpen(true)}>
              {view === "dashboard" && (
                <Dashboard profile={profile} opportunities={opportunities} matches={matches} applications={applications} setView={setView} openOpp={openOpp} />
              )}
              {view === "opportunities" && (
                <OpportunityList opportunities={opportunities} matches={matches} savedIds={savedIds} onToggleSave={toggleSave} openOpp={openOpp} />
              )}
              {view === "detail" && selectedOpp && selectedMatch && (
                <OpportunityDetail opp={selectedOpp} profile={profile} match={selectedMatch} onBack={backFromDetail}
                  onApply={applyTo} onSave={toggleSave} saved={savedIds.has(selectedOpp.id)} appStatus={applications[selectedOpp.id]} />
              )}
              {view === "tracker" && (
                <Tracker applications={applications} opportunities={opportunities} matches={matches} setStatus={setStatus} openOpp={openOpp} />
              )}
            </Shell>
          </div>
        )}
      </div>
      {ctx && <AssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} ctx={ctx} />}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} />
      <DemoPicker open={demoPickerOpen} onClose={() => setDemoPickerOpen(false)} onPick={pickDemoProfile} />
    </div>
  );
}
