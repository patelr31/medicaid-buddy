// Medicaid Renewal Buddy (New York): questionnaire -> exemption check -> hours check ->
// document checklist -> renewal dates and reminders. Runs in the browser; nothing is saved or sent.
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const src = (k) => `<a class="src" href="${SOURCES[k].url}" target="_blank" rel="noopener" title="${esc(SOURCES[k].name)}">source</a>`;
const num = (id) => Math.max(0, parseFloat($(id).value) || 0);
const fmtDate = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const iso = (d) => d.toISOString().slice(0, 10);

function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

function answers() {
  return {
    age: $("input[name=age]:checked")?.value || "",
    bronx: $("#county").value === "Bronx",
    county: $("#county").value,
    exceptions: EXCEPTIONS.filter((e) => $(`#ex-${e.id}`).checked),
    temporary: TEMPORARY.filter((e) => $(`#tmp-${e.id}`).checked),
    income: num("#income"),
    work: num("#h-work"), training: num("#h-training"), volunteer: num("#h-volunteer"),
    halftime: $("#halftime").checked, credits: num("#credits"),
    renewal: $("#renewal").value ? new Date($("#renewal").value + "T12:00:00") : null,
  };
}

function hoursFrom(a) {
  const incomeHours = a.income / NUMBERS.minimumWage;
  const school = a.halftime ? NUMBERS.hours : a.credits * NUMBERS.creditHours;
  const total = incomeHours + a.work + a.training + a.volunteer + school;
  return { incomeHours, school, total };
}

function evaluate(a) {
  // returns { status, title, lines[] }  status: none | exempt | meets | short | unknown
  if (!a.age) return { status: "unknown", title: "Start with your age", lines: [] };
  if (a.age !== "19-64") return { status: "none", title: "The work requirement doesn't apply to you",
    lines: [`It only applies to adults ages 19 to 64. ${src("nysoh")}`] };
  const med = a.exceptions.find((e) => e.id === "medicare");
  if (med) return { status: "none", title: "The work requirement doesn't apply to you",
    lines: [`People entitled to or enrolled in Medicare are not included. ${src("nysoh")}`] };
  if (a.exceptions.length) return { status: "exempt", title: "You probably qualify for an exception",
    lines: a.exceptions.map((e) => `<b>${esc(e.label)}.</b> ${esc(e.self)} ${src("nysoh")}`) };
  if (a.temporary.length) return { status: "exempt", title: "You may qualify for a temporary exception",
    lines: a.temporary.map((e) => `<b>${esc(e.label)}.</b> ${esc(e.self)} ${src("nysoh")}`) };
  if (a.bronx) return { status: "exempt", title: "Bronx residents: a temporary exception is planned",
    lines: [`New York has told the federal government it plans a temporary exception for the Bronx because of high unemployment. It can change if unemployment goes down, so keep your address correct. ${src("nysoh")}`] };
  const h = hoursFrom(a);
  if (a.income >= NUMBERS.monthlyIncome) return { status: "meets", title: "Your income meets the requirement",
    lines: [`Income of at least $${NUMBERS.monthlyIncome} a month counts on its own (that's ${NUMBERS.hours} hours at the $${NUMBERS.minimumWage} federal minimum wage). ${src("nysoh")}`] };
  if (h.total >= NUMBERS.hours) return { status: "meets", title: `You reach ${Math.floor(h.total)} hours a month`, lines: breakdown(a, h) };
  if (h.total === 0) return { status: "unknown", title: "Add your income or hours to check", lines: [] };
  const short = Math.ceil(NUMBERS.hours - h.total);
  return { status: "short", title: `About ${short} hour${short === 1 ? "" : "s"} a month short`, lines: [...breakdown(a, h),
    `You need ${NUMBERS.hours} hours (or $${NUMBERS.monthlyIncome} income) a month. Volunteering with an organized nonprofit or public group, a job training program, or school can make up the difference. ${src("nysoh")}`] };
}

function breakdown(a, h) {
  const out = [];
  if (a.income) out.push(`Income $${a.income.toFixed(0)} ÷ $${NUMBERS.minimumWage} = <b>${h.incomeHours.toFixed(0)} hours</b> ${src("nysoh")}`);
  if (a.work) out.push(`Work (paid, unpaid, internships, work for housing or goods): <b>${a.work} hours</b>`);
  if (a.training) out.push(`Job training or work program: <b>${a.training} hours</b>`);
  if (a.volunteer) out.push(`Volunteering with an organized nonprofit or public group: <b>${a.volunteer} hours</b>`);
  if (h.school) out.push(a.halftime ? `School at least half-time: <b>counts as the full ${NUMBERS.hours} hours</b> ${src("nysoh")}`
    : `${a.credits} credit hours × ${NUMBERS.creditHours} = <b>${h.school} hours</b> ${src("nysoh")}`);
  return out;
}

function documents(a, r) {
  const d = [`Keep your address, phone and email up to date with NY State of Health, and open every notice. ${src("nysoh")}`];
  if (r.status === "exempt" || r.status === "none") {
    d.push(`Usually nothing to send: you answer questions on the application. Only send documents if NY asks. ${src("nysoh")}`);
    if (a.exceptions.some((e) => e.id === "veteran")) d.push("Have your VA disability rating letter ready in case it's requested.");
    if (a.exceptions.some((e) => e.id === "sud")) d.push("Ask your treatment program how it will confirm your participation if NY asks.");
    return d;
  }
  d.push(`When you apply or renew, say <b>yes</b> to the secure income match with IRS and state data. NY can then check your income without documents (your health data is not shared with the IRS). ${src("nysoh")}`);
  if (a.income) d.push(`Proof of income if asked: pay stubs, a W-2, a 1099 or a tax return (gig and self-employment income count). From February 2027 you can also share income through Truv, inside the application. ${src("nysoh")} ${src("docs")}`);
  if (a.work && !a.income) d.push("A note or schedule from your employer showing your hours (for unpaid work or work in exchange for housing or goods, NY will publish instructions).");
  if (a.training) d.push("A letter or attendance record from your job training program (TA/SNAP employment services, NYS Career Center or other approved program).");
  if (a.volunteer) d.push("A simple log of volunteer hours signed by the organization (food bank, tutoring, meal delivery, court-ordered service, park clean-up and similar).");
  if (a.halftime || a.credits) d.push("Proof of enrollment from your school showing half-time status or your credit hours.");
  return d;
}

function renewals(a) {
  if (!a.renewal) return null;
  const yearly = a.exceptions.some((e) => e.id === "aian" || e.id === "disability") || a.age !== "19-64";
  const dates = [a.renewal];
  const renewDate = a.renewal;
  // first new coverage period after this renewal
  let step = yearly || iso(renewDate) < NUMBERS.sixMonthFromRenew ? 12 : 6;
  let next = addMonths(renewDate, step);
  for (let i = 0; i < 3; i++) { dates.push(next); next = addMonths(next, yearly ? 12 : 6); }
  return { yearly, dates, firstStep: step };
}

function ics(dates) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const ev = [];
  dates.forEach((d, i) => {
    for (const [offset, title] of [[-30, "Medicaid renewal coming up: watch your mail and email"], [0, "Medicaid renewal date: respond to any NY State of Health notice today"]]) {
      const x = new Date(d); x.setDate(x.getDate() + offset);
      const day = iso(x).replace(/-/g, "");
      ev.push(["BEGIN:VEVENT", `UID:mrb-${i}-${offset}-${day}@renewal-buddy`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day}`,
        `SUMMARY:${title}`, `DESCRIPTION:Log in at nystateofhealth.ny.gov or call ${NUMBERS.phone}. Free help: info.nystateofhealth.ny.gov/findassistor`, "END:VEVENT"].join("\r\n"));
    }
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Medicaid Renewal Buddy//EN", ...ev, "END:VCALENDAR"].join("\r\n");
}

function render() {
  const a = answers(), r = evaluate(a);
  const today = iso(new Date());
  $("#who-block").hidden = !(a.age === "19-64");
  $("#hours-block").hidden = !(a.age === "19-64" && !a.exceptions.length && !a.temporary.length && !a.bronx);

  $("#result").className = `result ${r.status}`;
  $("#result").innerHTML = `<h2>${esc(r.title)}</h2>${r.lines.length ? `<ul>${r.lines.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}
    ${a.age === "19-64" && today <= NUMBERS.holdHarmlessEnd ? `<p class="note"><b>Until June 30, 2027:</b> New York is using a federal "hold harmless" period, so members will not lose Medicaid for not meeting the work requirement before then. Renewals still happen, so keep responding to notices. ${src("gov")}</p>` : ""}`;

  $("#docs").innerHTML = a.age ? documents(a, r).map((x) => `<li>${x}</li>`).join("") : `<li class="hint">Answer the questions above first.</li>`;

  const rn = renewals(a);
  if (!rn) {
    $("#dates").innerHTML = `<p class="hint">Enter your next renewal date (log in at nystateofhealth.ny.gov and open the <b>Plans</b> tab, or call ${NUMBERS.phone}).</p>`;
    $("#ics").hidden = true;
  } else {
    $("#dates").innerHTML = `<p>${rn.yearly ? "You renew once a year." : rn.firstStep === 12
        ? "Because this renewal is before March 1, 2027, you get 12 months of coverage. After that, you renew every 6 months."
        : "From this renewal on, you renew every 6 months."} ${src("nysoh")}</p>
      <ol class="timeline">${rn.dates.map((d, i) => `<li><b>${fmtDate(d)}</b> <span class="hint">${i === 0 ? "next renewal" : "then"}</span></li>`).join("")}</ol>
      <p class="hint">NY will try to renew you automatically using data it already has. If it needs something, you'll get a notice. You get a warning at least 15 days before coverage closes, and 90 days to get coverage back if it ends. ${src("nysoh")}</p>`;
    $("#ics").hidden = false;
    $("#ics").onclick = () => {
      const a2 = document.createElement("a");
      a2.href = URL.createObjectURL(new Blob([ics(rn.dates)], { type: "text/calendar" }));
      a2.download = "medicaid-renewal-reminders.ics"; a2.click();
    };
  }
}

function init() {
  $("#ex-list").innerHTML = EXCEPTIONS.map((e) => `<label class="opt"><input type="checkbox" id="ex-${e.id}"><span>${esc(e.label)}</span></label>`).join("");
  $("#tmp-list").innerHTML = TEMPORARY.map((e) => `<label class="opt"><input type="checkbox" id="tmp-${e.id}"><span>${esc(e.label)}</span></label>`).join("");
  $("#sources").innerHTML = Object.values(SOURCES).map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("");
  $("#phone").textContent = NUMBERS.phone; $("#tty").textContent = NUMBERS.tty;
  document.body.addEventListener("input", render);
  document.body.addEventListener("change", render);
  $("#print").onclick = () => window.print();
  $("#reset").onclick = () => { $$("input").forEach((i) => (i.type === "checkbox" || i.type === "radio" ? (i.checked = false) : (i.value = ""))); $("#county").value = ""; render(); };
  render();
}

init();
