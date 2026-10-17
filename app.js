const data = JSON.parse(document.getElementById('listing-data').textContent);
const listings = data.listings;
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro = value => new Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(value);
const distanceOrder = {Close:0, Medium:1, Further:2};
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

function rowHtml(row) {
  const total = monthly(row);
  const snapshot = row.snapshot;
  const checks = row.verification === 'unchecked' ? 'Snapshot only · Njuškalo blocked automated access on 17 Oct' : `Checked ${row.verified_at} · availability not landlord-confirmed`;
  return `<tr class="${row.verification === 'inactive' ? 'inactive' : ''}" id="${escapeHtml(row.id.replace(':', '-'))}">
    <td data-label="Apartment"><div class="area-label">${row.favourite ? '<span class="favourite" aria-label="Favourite">★</span>' : ''}${escapeHtml(row.neighbourhood)}</div><p class="listing-title">${escapeHtml(row.title)}</p>${badge(row.distance + ' to KB Dubrava', row.distance === 'Close' ? 'good' : '')}${evidence(row)}<span class="detail">${escapeHtml(checks)}</span><span class="detail">Posted ${escapeHtml(row.posted)}${snapshot.posted !== row.posted ? ' · corrected from refresh date' : ''}</span></td>
    <td data-label="Monthly cost"><div class="money">${euro(total)}</div><span class="detail">${row.mandatory_parking ? `${euro(row.rent)} rent + ${euro(row.mandatory_parking)} mandatory garage` : 'rent / month'}</span>${total > 800 ? badge('Over €800 budget', 'bad') : ''}${row.original_rent !== row.rent ? `<span class="detail price-change">Was ${euro(row.original_rent)} in snapshot</span>` : ''}<span class="detail">${row.utilities === null ? '+ utilities not stated' : `+ ~${euro(row.utilities)} utilities ≈ ${euro(monthly(row, true))}/mo`}</span>${row.deposit === null ? '<span class="detail">Deposit: ask</span>' : `<span class="detail">Deposit: ${euro(row.deposit)}</span>`}<span class="detail">${escapeHtml(row.agency_fee ?? 'Agency fee: not confirmed')}</span></td>
    <td data-label="Size / rooms"><div class="number">${escapeHtml(row.area)} m²</div><span class="detail">${row.rooms} rooms</span><span class="detail">${euro(Math.round(total / row.area))}/m² rent + parking</span></td>
    <td data-label="Condition / furnishing">${badge(row.condition, row.condition === 'New/renovated' ? 'good' : 'warn')}<span class="detail">${escapeHtml(row.condition_note)}</span><span class="detail"><strong>${escapeHtml(row.furnished)}</strong></span></td>
    <td data-label="Parking / move-in"><strong>${escapeHtml(row.parking)}</strong><span class="detail">${row.verification === 'inactive' ? 'Inactive · move-in no longer applicable' : escapeHtml(row.move_in === 'ask' ? 'Move-in: ask' : row.move_in)}</span></td>
    <td data-label="Findings / links">${row.findings.length ? `<p class="findings-summary">${escapeHtml(row.findings[0])}</p><details><summary>All ${row.findings.length} research notes</summary><ul class="row-findings">${row.findings.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></details>` : '<span class="detail">Original snapshot retained. Details have not been reverified.</span>'}${row.notes ? `<p>${escapeHtml(row.notes)}</p>` : ''}${links(row)}<details><summary>Original snapshot</summary><p>${escapeHtml(snapshot.title)}</p><p>${euro(snapshot.rent)} · ${snapshot.area} m² · ${snapshot.rooms} rooms · ${escapeHtml(snapshot.posted)}</p><p>${escapeHtml(snapshot.condition + ': ' + snapshot.condition_note)}</p><p>Furnishing: ${escapeHtml(snapshot.furnished)}. Parking: ${escapeHtml(snapshot.parking)}. Move-in: ${escapeHtml(snapshot.move_in)}.</p></details></td>
  </tr>`;
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
  const filtered = listings.filter(row => {
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
    if (query && ![row.title, row.neighbourhood, row.condition_note, row.parking, row.furnished, row.notes, ...row.findings].join(' ').toLocaleLowerCase().includes(query)) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    switch ($('sort').value) {
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
  $('empty').hidden = visible.length > 0;
  document.querySelector('.table-wrap').hidden = visible.length === 0;
  const unknown = visible.filter(row => row.utilities === null).length;
  $('result-count').textContent = `${visible.length} of ${view === 'favourites' ? listings.filter(row => row.favourite).length : listings.length} apartments${$('cost-basis').value === 'total' ? ` · ${unknown} with unknown utilities (totals incomplete)` : ''}`;
  $('export').disabled = visible.length === 0;
}

function setView(next) {
  view = next;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  $('listings-view').hidden = !['all','favourites'].includes(view);
  $('findings-view').hidden = view !== 'findings';
  $('brief-view').hidden = view !== 'brief';
  render();
}

function exportCsv() {
  const fields = ['Title','Favourite','Area','Distance estimate','Rent EUR','Mandatory parking EUR','Known utilities EUR','Monthly minimum EUR','Known monthly total EUR','Utilities complete','Deposit EUR','Agency fee','Size m²','Rooms','Condition','Condition evidence','Furnished','Parking','Move-in','Posted','Verification','Checked','Findings','Links'];
  const rows = visible.map(row => [row.title,row.favourite,row.neighbourhood,row.distance,row.rent,row.mandatory_parking,row.utilities,monthly(row),monthly(row,true),row.utilities !== null,row.deposit,row.agency_fee,row.area,row.rooms,row.condition,row.condition_note,row.furnished,row.parking,row.move_in,row.posted,row.verification,row.verified_at ?? '',row.findings.join(' | '),row.links.map(link => link.url).join(' | ')]);
  const cell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
  const csv = '\ufeff' + [fields,...rows].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'dubrava-apartments.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('counters').innerHTML = [[listings.length,'apartments'],[listings.filter(row => row.favourite).length,'favourites'],[listings.filter(row => row.verification !== 'unchecked').length,'pages checked'],[listings.filter(row => row.verification === 'inactive').length,'inactive']].map(([value,label]) => `<div class="counter"><b>${value}</b>${label}</div>`).join('');
$('edition').textContent = `Snapshot: ${data.snapshot_at} · Manual review: ${data.reviewed_at} · 24 imported rows / 29 source links · Times as recorded in source`;
for (const name of [...new Set(listings.map(row => row.neighbourhood))].sort()) {
  const option = document.createElement('option');
  option.value = option.textContent = name;
  $('neighbourhood').append(option);
}
for (const [name, count] of [['all',listings.length],['favourites',listings.filter(row => row.favourite).length],['findings',listings.filter(row => row.findings.length).length]]) {
  document.querySelector(`[data-view="${name}"] span`).textContent = count;
}
$('findings-list').innerHTML = listings.filter(row => row.findings.length).map(row => `<article class="finding-card"><div class="area-label">${row.favourite ? '★ Favourite · ' : ''}${escapeHtml(row.neighbourhood)} · ${euro(monthly(row))}/month minimum</div><h3>${escapeHtml(row.title)}</h3>${evidence(row)}<ul>${row.findings.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>${links(row)}<span class="detail">Checked ${row.verified_at}</span></article>`).join('');
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('filters').addEventListener('submit', event => event.preventDefault());
$('filters').addEventListener('input', render);
$('filters').addEventListener('change', render);
$('filters').addEventListener('reset', () => setTimeout(render, 0));
$('empty-reset').addEventListener('click', () => $('filters').reset());
$('export').addEventListener('click', exportCsv);
render();
