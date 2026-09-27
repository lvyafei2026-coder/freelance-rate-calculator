function t() { return (window.__i18n && window.__i18n.t) || {}; }

const INDUSTRY_HINTS = {
  generic:    { low: 40, high: 120 },
  design:     { low: 65, high: 150 },
  dev:        { low: 80, high: 180 },
  writing:    { low: 60, high: 130 },
  marketing:  { low: 75, high: 160 },
  consulting: { low: 100, high: 250 },
  video:      { low: 85, high: 180 },
  photo:      { low: 70, high: 150 }
};

function fmt(n) {
  if (!isFinite(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmt2(n) {
  if (!isFinite(n)) return '—';
  return '$' + n.toFixed(2);
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  ['targetIncome','billableHours','weeksOff'].forEach(id => {
    if (params.has(id)) {
      const el = document.getElementById(id);
      if (el) el.value = params.get(id);
    }
  });
  if (params.has('industry')) document.getElementById('industry').value = params.get('industry');
  if (params.has('targetIncome') || params.has('billableHours')) calculate();
}

function buildShareUrl() {
  const params = new URLSearchParams();
  params.set('targetIncome', document.getElementById('targetIncome').value);
  params.set('billableHours', document.getElementById('billableHours').value);
  params.set('weeksOff', document.getElementById('weeksOff').value);
  const ind = document.getElementById('industry').value;
  if (ind !== 'generic') params.set('industry', ind);
  const base = window.location.origin + window.location.pathname;
  return base + '?' + params.toString();
}

function copyShareLink() {
  const url = buildShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById('shareCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy this link:', url); });
}

function calculate() {
  const tr = t();
  const targetIncome = parseFloat(document.getElementById('targetIncome').value) || 0;
  const billableHours = parseFloat(document.getElementById('billableHours').value) || 25;
  const weeksOff = parseFloat(document.getElementById('weeksOff').value) || 0;
  const businessCosts = parseFloat(document.getElementById('businessCosts').value) || 0;
  const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
  const profitMargin = parseFloat(document.getElementById('profitMargin').value) || 0;
  const industry = document.getElementById('industry').value;

  if (targetIncome <= 0) {
    document.getElementById('result').classList.remove('show');
    return;
  }

  const workingWeeks = 52 - weeksOff;
  const billableHoursPerYear = billableHours * workingWeeks;

  // Gross needed: target income / (1 - tax rate) + business costs
  const grossedUpIncome = targetIncome / (1 - taxRate / 100);
  const grossWithCosts = grossedUpIncome + businessCosts;
  const grossWithMargin = grossWithCosts * (1 + profitMargin / 100);

  const hourlyRate = grossWithMargin / billableHoursPerYear;

  document.getElementById('rateMain').textContent = fmt2(hourlyRate) + ' / ' + (tr.perHour || 'hour');

  const ind = INDUSTRY_HINTS[industry] || INDUSTRY_HINTS.generic;
  let note;
  if (hourlyRate < ind.low) {
    note = (tr.noteBelow || 'Below typical range for this industry') + ' (' + fmt(ind.low) + '–' + fmt(ind.high) + '/hr)';
  } else if (hourlyRate > ind.high) {
    note = (tr.noteAbove || 'Above typical range for this industry') + ' (' + fmt(ind.low) + '–' + fmt(ind.high) + '/hr)';
  } else {
    note = (tr.noteWithin || 'Within typical range for this industry') + ' (' + fmt(ind.low) + '–' + fmt(ind.high) + '/hr)';
  }
  document.getElementById('rateNote').textContent = note;

  document.getElementById('bdBillable').textContent = Math.round(billableHoursPerYear).toLocaleString() + ' ' + (tr.hrs || 'hrs');
  document.getElementById('bdTarget').textContent = fmt(targetIncome);
  document.getElementById('bdTax').textContent = '+' + fmt(grossedUpIncome - targetIncome);
  document.getElementById('bdCosts').textContent = '+' + fmt(businessCosts);
  document.getElementById('bdMargin').textContent = '+' + fmt(grossWithMargin - grossWithCosts);
  document.getElementById('bdGross').textContent = fmt(grossWithMargin);

  document.getElementById('tierHourly').textContent = fmt2(hourlyRate);
  document.getElementById('tierDaily').textContent = fmt2(hourlyRate * 8);
  document.getElementById('tierWeekly').textContent = fmt2(hourlyRate * billableHours);
  document.getElementById('tierMonthly').textContent = fmt2(hourlyRate * billableHoursPerYear / 12);

  document.getElementById('result').classList.add('show');
}

window.calculate = calculate;
window.copyShareLink = copyShareLink;
window.readUrlParams = readUrlParams;

document.addEventListener('DOMContentLoaded', function() {
  ['targetIncome','billableHours','weeksOff','businessCosts','taxRate','profitMargin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });
  const ind = document.getElementById('industry');
  if (ind) ind.addEventListener('change', calculate);
});