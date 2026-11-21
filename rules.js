// New York Medicaid rules used by the Renewal Buddy. Every rule cites its official source.
// Checked 2026-11-21. If a source changes, update here and in the "Last checked" line on the page.
const SOURCES = {
  nysoh: { name: "NY State of Health: Changes to Medicaid Coverage (published Nov 16, 2026)", url: "https://info.nystateofhealth.ny.gov/stay-covered" },
  gov: { name: "Governor Hochul: actions to protect Medicaid coverage (Nov 19, 2026)", url: "https://www.governor.ny.gov/news/governor-hochul-takes-actions-protect-medicaid-coverage-nearly-2-million-new-yorkers" },
  factsheet: { name: "NY State of Health fact sheet: Changes to Medicaid Coverage Starting January 2027 (April 2026)", url: "https://info.nystateofhealth.ny.gov/sites/default/files/Changes-to-Medicaid-Coverage-Fact-Sheet-English.pdf" },
  cms: { name: "CMS fact sheet: Community Engagement interim final rule (CMS-2454-IFC, June 2026)", url: "https://www.cms.gov/newsroom/fact-sheets/medicaid-community-engagement-requirement-certain-individuals-interim-final-rule-comment-period-cms" },
  docs: { name: "NY Medicaid documentation checklist (income and other proofs)", url: "https://www.health.ny.gov/health_care/medicaid/publications/docs/adm/6att1checklis.pdf" },
  help: { name: "NY State of Health: Find Local Help (free enrollment assistors)", url: "https://info.nystateofhealth.ny.gov/findassistor" },
};

const NUMBERS = {
  minimumWage: 7.25,       // federal minimum wage used for the income conversion (nysoh)
  monthlyIncome: 580,      // $7.25 x 80 hours (nysoh, cms)
  hours: 80,
  creditHours: 13,         // each credit hour = 13 hours of education per month (nysoh)
  holdHarmlessEnd: "2027-06-30",   // gov
  startDate: "2027-01-01",
  sixMonthFromApply: "2027-01-01", // apply on/after -> 6-month renewals (nysoh)
  sixMonthFromRenew: "2027-03-01", // renew on/after -> 6-month renewals (nysoh)
  phone: "1-855-355-5777", tty: "1-800-662-1220",
};

// Permanent exceptions, in New York's wording (nysoh). `self`: how you show it in 2027.
const EXCEPTIONS = [
  { id: "pregnant", label: "Pregnant, or were pregnant in the last 12 months (any birth outcome)", self: "You confirm it on the application. NY will not ask for medical documents." },
  { id: "disability", label: "Enrolled in Medicaid with a disability", self: "NY should already know this from your case." },
  { id: "condition", label: "A physical or mental health condition, intellectual or developmental disability, or substance use disorder that makes day-to-day activities hard", self: "For 2027, check yes to the question asking if a doctor determined you have a medical condition that keeps you from your usual activities. No documents unless asked." },
  { id: "medicare", label: "Entitled to or enrolled in Medicare Part A, or enrolled in Part B", self: "NY can usually see this in its data." },
  { id: "aian", label: "American Indian or Alaska Native", self: "You confirm it on the application. You also keep yearly (not 6-month) renewals." },
  { id: "caregiver", label: "Parent, guardian, caretaker relative or family caregiver of a child under 14, or of a disabled person", self: "If you aren't related to them and don't live with them, you must give at least 80 hours of care a month." },
  { id: "snap", label: "In a SNAP household and subject to a SNAP work requirement", self: "NY can match this with your SNAP case." },
  { id: "pa", label: "Receiving Public/Cash Assistance with a child on the case and meeting its work requirements", self: "NY can match this with your Public Assistance case." },
  { id: "sud", label: "Getting treatment for a drug or alcohol addiction or substance use disorder", self: "The program must be run by a nonprofit or a public community mental health center. Check yes to the medical-condition question." },
  { id: "jail", label: "In jail or prison now, or released in the last 3 months", self: "" },
  { id: "foster", label: "In foster care now, or under 26 and left NY foster care between ages 18 and 21 while on Medicaid", self: "" },
  { id: "veteran", label: "A veteran with a 100% disability rating, or total disability based on individual unemployability", self: "Keep your VA rating letter handy in case you're asked." },
];

// Temporary exceptions New York will offer (nysoh)
const TEMPORARY = [
  { id: "hospital", label: "I was in the hospital or a nursing facility", self: "You self-attest on the application." },
  { id: "travel", label: "I or a dependent had to travel for serious medical care not available in my community", self: "You self-attest on the application." },
];
