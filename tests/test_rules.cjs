const assert = require('node:assert/strict');
const {evaluateRule, assessCriteria} = require('../rules.js');
const criteria = require('../data/criteria.json');
const enabled = criteria.rules.filter(rule => rule.enabled).map(rule => rule.id);
const row = {id:'test',rent:800,area:45,neighbourhood:'Dubrava',condition:'New/renovated',drive_minutes:45,available_from:'2026-11-08',long_term:true,floor:3,lift:true,building_year:1985};
assert.equal(assessCriteria(row, criteria, enabled).status, 'matches');
for (const [field,value,rule] of [['area',44.9,'area'],['rent',801,'budget'],['drive_minutes',46,'commute'],['available_from','2026-11-09','move_in'],['building_year',1984,'building_year'],['long_term',false,'long_term'],['floor',-0.5,'basement'],['lift',false,'lift']]) {
  assert.equal(evaluateRule(rule, {...row,[field]:value}, criteria), false, rule);
}
assert.equal(evaluateRule('lift', {...row,floor:2,lift:false}, criteria), true);
assert.equal(evaluateRule('lift', {...row,lift:null}, criteria), null);
assert.equal(evaluateRule('building_year', {...row,building_year:null}, criteria), null);
assert.equal(evaluateRule('commute', {...row,drive_minutes:null}, criteria), null);
assert.equal(evaluateRule('budget', {...row,id:'N:51292867',rent:850}, criteria), true);
assert.equal(assessCriteria({...row,area:40}, criteria, enabled.filter(id => id !== 'area')).status, 'matches');
assert.equal(assessCriteria({...row,drive_minutes:null}, criteria, enabled).status, 'pending');
assert(!enabled.includes('rooms') && !enabled.includes('bedroom'));
console.log('Criteria checks passed: boundaries, toggles, unknown evidence, exception, removed room requirements.');
