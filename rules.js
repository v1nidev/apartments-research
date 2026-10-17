function evaluateRule(id, row, criteria) {
  switch (id) {
    case 'budget': return row.rent <= criteria.max_rent || (row.id === criteria.budget_exception.id && row.rent <= criteria.budget_exception.max_rent);
    case 'area': return row.area == null ? null : row.area >= criteria.min_area;
    case 'neighbourhood': return row.neighbourhood ? criteria.neighbourhoods.includes(row.neighbourhood) : null;
    case 'condition': return row.condition === 'No info' ? null : ['New/renovated','Probably refurbished'].includes(row.condition);
    case 'commute': return row.drive_minutes == null ? null : row.drive_minutes <= criteria.max_drive_minutes;
    case 'move_in': return row.available_from == null ? null : row.available_from <= criteria.move_in_by;
    case 'long_term': return row.long_term ?? null;
    case 'basement': return row.floor == null ? null : row.floor >= 0;
    case 'lift': return row.floor == null ? null : row.floor < criteria.lift_from_floor ? true : row.lift ?? null;
    case 'building_year': return row.building_year == null ? null : row.building_year >= criteria.min_building_year;
    case 'rooms': return row.rooms == null ? null : row.rooms >= 2;
    case 'bedroom': return row.separate_bedroom ?? null;
    default: throw new Error(`Unknown criterion: ${id}`);
  }
}

function assessCriteria(row, criteria, enabledIds) {
  const failed = [];
  const unknown = [];
  for (const rule of criteria.rules.filter(rule => enabledIds.includes(rule.id))) {
    const result = evaluateRule(rule.id, row, criteria);
    if (result === false) failed.push(rule.label);
    if (result === null) unknown.push(rule.label);
  }
  return {failed, unknown, status: failed.length ? 'mismatch' : unknown.length ? 'pending' : 'matches'};
}

if (typeof module !== 'undefined') module.exports = {evaluateRule, assessCriteria};
