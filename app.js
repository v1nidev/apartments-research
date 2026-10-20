const data = JSON.parse(document.getElementById('listing-data').textContent);
const listings = data.listings;
const originals = listings.filter(row => row.cohort !== 'pending');
const pendingListings = listings.filter(row => row.cohort === 'pending');
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro = value => new Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(value);
const distanceOrder = {Close:0, Medium:1, Further:2, Unknown:3};
const criteria = data.criteria;
let view = 'all';
let visible = [];

function monthly(row, includeUtilities = false) {
  return row.rent + row.mandatory_parking + (includeUtilities ? row.utilities ?? 0 : 0);
}

function badge(text, tone = '') {
  return `<span class="badge ${tone}">${escapeHtml(text)}</span>`;
}

function links(row) {
  return `<div class="links">${row.links.map(link => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(link.label + ': ' + row.title + ' (opens in new tab)')}">${escapeHtml(link.label)} ↗</a>`).join('')}</div>`;
}

function evidence(row) {
  if (row.verification === 'inactive') return badge('Inactive', 'bad');
  if (row.verification === 'readable') return badge('Readable listing', 'good');
  return badge('Not reverified', 'warn');
}

function enabledCriteria() {
  return [...$('criteria-controls').querySelectorAll('input:checked')].map(input => input.value);
}

function fitFor(row) {
  return assessCriteria(row, criteria, enabledCriteria());
}

function fitHtml(row) {
  const fit = fitFor(row);
  const label = fit.status === 'mismatch' ? 'Criteria mismatch' : fit.status === 'pending' ? 'Needs checking' : row.cohort === 'pending' ? 'Enabled checks pass · still pending review' : 'Matches enabled criteria';
  const reasons = [...fit.failed.map(label => `Does not meet: ${label}`), ...fit.unknown.map(label => `Not confirmed: ${label}`)];
  return badge(label, fit.status === 'mismatch' ? 'bad' : fit.status === 'pending' ? 'warn' : 'good') + (reasons.length ? `<details class="fit-reasons"><summary>${fit.failed.length} mismatch(es) · ${fit.unknown.length} unchecked</summary><ul class="row-findings">${reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul></details>` : '');
}

function utilitiesHtml(row) {
  const text = row.utilities_included ? 'Utilities included in rent' : row.utilities === null ? '+ utilities: amount not established' : `+ ~${euro(row.utilities)} utilities ≈ ${euro(monthly(row, true))}/mo`;
  return `<span class="detail">${escapeHtml(text)}</span>${row.utilities_note ? `<span class="detail">${escapeHtml(row.utilities_note)}</span>` : ''}`;
}

function featuresHtml(row) {
  const dishwasher = row.dishwasher === true ? 'Dishwasher: yes' : row.dishwasher === false ? 'Dishwasher: no' : 'Dishwasher: unknown';
  return `<span class="feature-label badge ${row.dishwasher === true ? 'good' : ''}">${dishwasher}</span><span class="detail">Built: ${row.building_year ?? 'unknown'} · Floor: ${row.floor === 0.5 ? 'raised ground' : row.floor ?? 'unknown'} · Lift: ${row.lift === true ? 'yes' : row.lift === false ? 'no' : 'unknown'}</span>${row.facts_source ? `<span class="detail">${escapeHtml(row.facts_source)}</span>` : ''}`;
}

function rowHtml(row) {
  const total = monthly(row);
  const snapshot = row.snapshot;
  const checks = row.verification === 'unchecked' ? 'Snapshot only · Njuškalo blocked automated access on 17 Oct' : `Checked ${row.verified_at} · availability not landlord-confirmed`;
  const photo = `${apartmentPhotoHtml(row)}<span class="badge row-id">${escapeHtml(row.id)}</span><span class="detail">Added ${escapeHtml(row.added_at)}</span>`;
  return `<tr class="${row.verification === 'inactive' ? 'inactive' : ''}" id="${escapeHtml(row.id.replace(':', '-'))}">
    <td data-label="Apartment"><div class="area-label">${row.favourite ? '<span class="favourite" aria-label="Favourite">★</span>' : ''}${escapeHtml(row.neighbourhood)}</div><p class="listing-title">${escapeHtml(row.title)}</p>${row.cohort === 'pending' ? badge('PENDING REVIEW · not approved', 'warn') : ''}${evidence(row)}${fitHtml(row)}<span class="detail">${row.drive_minutes == null ? 'Drive to KB Dubrava: not measured' : `${row.drive_minutes} min typical drive${row.drive_minutes <= criteria.preferred_drive_minutes ? ' · preferred ≤30 min' : ''}`}</span>${row.cohort !== 'pending' ? `<span class="detail">Old distance estimate: ${escapeHtml(row.distance)} (not driving time)</span>` : ''}<span class="detail">${escapeHtml(checks)}</span><span class="detail">Posted ${escapeHtml(row.posted)}${snapshot && snapshot.posted !== row.posted ? ' · corrected from refresh date' : ''}${row.refreshed_at ? ` · Refreshed ${escapeHtml(row.refreshed_at)}` : ''}</span></td>
    <td data-label="Monthly cost"><div class="money">${euro(total)}</div><span class="detail">${row.mandatory_parking ? `${euro(row.rent)} rent + ${euro(row.mandatory_parking)} mandatory garage` : 'rent / month'}</span>${total > 800 ? badge('Over €800 budget', 'bad') : ''}${row.original_rent !== row.rent ? `<span class="detail price-change">Was ${euro(row.original_rent)} in snapshot</span>` : ''}${utilitiesHtml(row)}${row.deposit === null ? '<span class="detail">Deposit: ask</span>' : `<span class="detail">Deposit: ${euro(row.deposit)}</span>`}<span class="detail">${escapeHtml(row.agency_fee ?? 'Agency fee: not confirmed')}</span></td>
    <td data-label="Size / rooms"><div class="number">${escapeHtml(row.area)} m²</div><span class="detail">${row.rooms} rooms</span><span class="detail">${euro(Math.round(total / row.area))}/m² rent + parking</span></td>
    <td data-label="Condition / furnishing">${badge(row.condition, row.condition === 'New/renovated' ? 'good' : 'warn')}<span class="detail">${escapeHtml(row.condition_note)}</span><span class="detail"><strong>${escapeHtml(row.furnished)}</strong></span>${featuresHtml(row)}</td>
    <td data-label="Parking / move-in"><strong>${escapeHtml(row.parking)}</strong><span class="detail">${row.verification === 'inactive' ? 'Inactive · move-in no longer applicable' : escapeHtml(row.move_in === 'ask' ? 'Move-in / current vacancy: ask' : row.move_in)}</span><span class="detail">Long-term lease: ${row.long_term === true ? 'yes' : row.long_term === false ? 'no' : 'unknown — confirm duration'}</span></td>
    <td data-label="Findings / links">${row.findings.length ? `<p class="findings-summary">${escapeHtml(row.findings[0])}</p><details><summary>All ${row.findings.length} research notes</summary><ul class="row-findings">${row.findings.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></details>` : '<span class="detail">Original snapshot retained. Details have not been reverified.</span>'}${row.notes ? `<p>${escapeHtml(row.notes)}</p>` : ''}${links(row)}${snapshot ? `<details><summary>Original snapshot</summary><p>${escapeHtml(snapshot.title)}</p><p>${euro(snapshot.rent)} · ${snapshot.area} m² · ${snapshot.rooms} rooms · ${escapeHtml(snapshot.posted)}</p><p>${escapeHtml(snapshot.condition + ': ' + snapshot.condition_note)}</p><p>Furnishing: ${escapeHtml(snapshot.furnished)}. Parking: ${escapeHtml(snapshot.parking)}. Move-in: ${escapeHtml(snapshot.move_in)}.</p></details>` : '<span class="detail">New research candidate · not part of the imported snapshot.</span>'}</td>
  </tr>`.replace('<td data-label="Apartment">', () => `<td data-label="Apartment">${photo}`);
}

function viewListings() {
  return view === 'pending' ? pendingListings : view === 'favourites' ? originals.filter(row => row.favourite) : originals;
}

function getVisible() {
  const query = $('query').value.trim().toLocaleLowerCase();
  const includeUtilities = $('cost-basis').value === 'total';
  const max = $('max-price').value === '' ? null : Number($('max-price').value);
  const minArea = Number($('min-area').value || 0);
  const availability = $('verification').value;
  const parking = $('parking').value;
  const furnishing = $('furnished').value;
  const condition = $('condition').value;
  const fitFilter = $('brief-fit').value;
  const filtered = viewListings().filter(row => {
    const fit = fitFor(row);
    if (fitFilter === 'eligible' && fit.status === 'mismatch') return false;
    if (!['all','eligible'].includes(fitFilter) && fit.status !== fitFilter) return false;
    if (view === 'favourites' && !row.favourite) return false;
    if (!availability && row.verification === 'inactive') return false;
    if (availability && availability !== 'all' && row.verification !== availability) return false;
    if ($('neighbourhood').value && row.neighbourhood !== $('neighbourhood').value) return false;
    if ($('distance').value && row.distance !== $('distance').value) return false;
    if (max !== null && monthly(row, includeUtilities) > max) return false;
    if (row.area < minArea) return false;
    if (parking === 'confirmed' && !/Own space|Garage|Free public|Paid public/.test(row.parking)) return false;
    if (parking === 'own' && !/Own space|Garage/.test(row.parking)) return false;
    if (parking === 'free' && !row.parking.includes('Free public')) return false;
    if (furnishing === 'full' && row.furnished !== 'Fully') return false;
    if (furnishing === 'partial' && !/Kitchen|Partial/.test(row.furnished)) return false;
    if (furnishing === 'unknown' && row.furnished !== 'Not stated') return false;
    if (condition === 'confirmed' && row.condition !== 'New/renovated') return false;
    if (condition === 'probable' && row.condition !== 'Probably refurbished') return false;
    if (query && ![row.id, row.added_at, row.title, row.neighbourhood, row.condition_note, row.parking, row.furnished, row.notes, ...row.findings].join(' ').toLocaleLowerCase().includes(query)) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    switch ($('sort').value) {
      case 'added': return b.added_at.localeCompare(a.added_at) || a.id.localeCompare(b.id);
      case 'added-oldest': return a.added_at.localeCompare(b.added_at) || a.id.localeCompare(b.id);
      case 'price': return monthly(a, includeUtilities) - monthly(b, includeUtilities);
      case 'area': return b.area - a.area;
      case 'distance': return distanceOrder[a.distance] - distanceOrder[b.distance] || monthly(a) - monthly(b);
      case 'posted': return b.posted.localeCompare(a.posted);
      default: return Number(b.favourite) - Number(a.favourite) || distanceOrder[a.distance] - distanceOrder[b.distance] || monthly(a) - monthly(b);
    }
  });
}

function render() {
  visible = getVisible();
  $('rows').innerHTML = visible.map(rowHtml).join('');
  attachPhotoFallbacks($('rows'));
  $('empty').hidden = visible.length > 0;
  document.querySelector('.table-wrap').hidden = visible.length === 0;
  const unknown = visible.filter(row => row.utilities === null).length;
  const pending = visible.filter(row => fitFor(row).status === 'pending').length;
  $('result-count').textContent = `${visible.length} of ${viewListings().length} ${view === 'pending' ? 'pending-review candidates · none approved' : 'apartments'} · ${pending} need criteria checks${$('cost-basis').value === 'total' ? ` · ${unknown} with unknown / unresolved utilities (totals incomplete)` : ''}`;
  $('export').disabled = visible.length === 0;
}

function setView(next) {
  view = next;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  $('listings-view').hidden = !['all','favourites','pending'].includes(view);
  $('pending-notice').hidden = view !== 'pending';
  $('findings-view').hidden = view !== 'findings';
  $('brief-view').hidden = view !== 'brief';
  render();
}

function exportCsv() {
  const fields = ['Title','Favourite','Area','Distance estimate','Rent EUR','Mandatory parking EUR','Known utilities EUR','Monthly minimum EUR','Known monthly total EUR','Utilities complete','Deposit EUR','Agency fee','Size m²','Rooms','Condition','Condition evidence','Furnished','Parking','Move-in','Posted','Verification','Checked','Findings','Links','Dishwasher','Construction year','Floor','Lift','Typical drive minutes','Long-term lease','Criteria fit','Failed criteria','Unchecked criteria','Enabled criteria','Cohort','Utilities included','Utilities note'];
  const rows = visible.map(row => { const fit = fitFor(row); return [row.title,row.favourite,row.neighbourhood,row.distance,row.rent,row.mandatory_parking,row.utilities,monthly(row),row.utilities === null ? null : monthly(row,true),row.utilities !== null,row.deposit,row.agency_fee,row.area,row.rooms,row.condition,row.condition_note,row.furnished,row.parking,row.move_in,row.posted,row.verification,row.verified_at ?? '',row.findings.join(' | '),row.links.map(link => link.url).join(' | '),row.dishwasher ?? 'unknown',row.building_year,row.floor,row.lift ?? 'unknown',row.drive_minutes,row.long_term ?? 'unknown',fit.status,fit.failed.join(' | '),fit.unknown.join(' | '),enabledCriteria().join(' | '),row.cohort,row.utilities_included ?? false,row.utilities_note ?? '']; });
  fields.unshift('ID', 'Added to ledger');
  rows.forEach((row, index) => row.unshift(visible[index].id, visible[index].added_at));
  const cell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
  const csv = '\ufeff' + [fields,...rows].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'dubrava-apartments.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('counters').innerHTML = [[originals.length,'original apartments'],[pendingListings.length,'pending review'],[originals.filter(row => row.favourite).length,'favourites'],[originals.filter(row => row.verification !== 'unchecked').length,'originals checked'],[originals.filter(row => row.verification === 'inactive').length,'inactive']].map(([value,label]) => `<div class="counter"><b>${value}</b>${label}</div>`).join('');
$('criteria-controls').innerHTML = criteria.rules.map(rule => `<label><input type="checkbox" name="criterion" value="${escapeHtml(rule.id)}" ${rule.enabled ? 'checked' : ''}><span><strong>${escapeHtml(rule.label)}</strong><span class="detail">${escapeHtml(rule.description)}</span></span></label>`).join('');
$('brief-criteria').innerHTML = criteria.rules.map(rule => `<li>${rule.enabled ? '☑' : '☐'} ${escapeHtml(rule.label)} — ${escapeHtml(rule.description)}</li>`).join('');
$('edition').textContent = `Snapshot: ${data.snapshot_at} · Manual review: ${data.reviewed_at} · ${data.source_count} imported rows / ${data.source_link_count} original source links + ${pendingListings.length} new pending-review candidates / ${pendingListings.reduce((sum, row) => sum + row.links.length, 0)} links · Times as recorded in source`;
for (const name of [...new Set(listings.map(row => row.neighbourhood))].sort()) {
  const option = document.createElement('option');
  option.value = option.textContent = name;
  $('neighbourhood').append(option);
}
for (const [name, count] of [['all',originals.length],['pending',pendingListings.length],['favourites',originals.filter(row => row.favourite).length],['findings',listings.filter(row => row.findings.length).length]]) {
  document.querySelector(`[data-view="${name}"] span`).textContent = count;
}
$('findings-list').innerHTML = listings.filter(row => row.findings.length).map(row => `<article class="finding-card"><div class="area-label">${row.cohort === 'pending' ? 'PENDING REVIEW · not approved · ' : ''}${row.favourite ? '★ Favourite · ' : ''}${escapeHtml(row.neighbourhood)} · ${euro(monthly(row))}/month rent + mandatory parking</div><h3>${escapeHtml(row.title)}</h3>${evidence(row)}<ul>${row.findings.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>${links(row)}<span class="detail">Checked ${row.verified_at}</span></article>`).join('');
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('filters').addEventListener('submit', event => event.preventDefault());
$('filters').addEventListener('input', render);
$('filters').addEventListener('change', render);
$('filters').addEventListener('reset', () => { $('criteria-controls').reset(); setTimeout(render, 0); });
$('criteria-controls').addEventListener('change', render);
$('criteria-controls').addEventListener('submit', event => event.preventDefault());
$('empty-reset').addEventListener('click', () => $('filters').reset());
$('export').addEventListener('click', exportCsv);
render();
