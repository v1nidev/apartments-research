function apartmentPhotoEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
}

function apartmentPhotoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function apartmentPhotoPlaceholder() {
  return '<span class="apartment-photo-placeholder" role="img" aria-label="Apartment photo unavailable">Photo unavailable</span>';
}

function apartmentPhotoHtml(row) {
  const photo = apartmentPhotoUrl(row.photo?.url);
  const link = (row.links || []).map(item => apartmentPhotoUrl(item.url)).find(Boolean) || apartmentPhotoUrl(row.photo?.source);
  const label = apartmentPhotoEscape(row.title || row.neighbourhood || 'Apartment');
  const content = photo ? `<img src="${apartmentPhotoEscape(photo)}" width="100" height="72" loading="lazy" decoding="async" alt="Listing photo: ${label}">` : apartmentPhotoPlaceholder();
  return link ? `<a class="apartment-photo" href="${apartmentPhotoEscape(link)}" target="_blank" rel="noopener noreferrer" aria-label="Open listing: ${label}">${content}</a>` : `<span class="apartment-photo">${content}</span>`;
}

function attachPhotoFallbacks(root) {
  root.querySelectorAll('.apartment-photo img').forEach(image => {
    const replace = () => {
      if (image.parentNode) image.outerHTML = apartmentPhotoPlaceholder();
    };
    image.addEventListener('error', replace, {once: true});
    if (image.complete && image.naturalWidth === 0) replace();
  });
}

if (typeof module !== 'undefined' && module.exports) module.exports = {apartmentPhotoHtml, attachPhotoFallbacks};
