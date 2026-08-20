from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
version_count = text.count('98.9')
if version_count == 0:
    raise SystemExit('Expected Policybook v98.9 markers')

lines = text.splitlines(keepends=True)


def section_bounds(section_id):
    start_hits = [i for i, line in enumerate(lines) if f'id:"{section_id}"' in line]
    if len(start_hits) != 1:
        raise SystemExit(f'Expected one {section_id} section; found {len(start_hits)}')
    start = start_hits[0]
    next_starts = [i for i in range(start + 1, len(lines)) if '    id:"sec-' in lines[i] or '    id:"sec-' in lines[i]]
    end = next_starts[0] if next_starts else len(lines)
    return start, end


def pop_policy(title, expected_section):
    needle = f'{{title:"{title}",'
    hits = [i for i, line in enumerate(lines) if needle in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected one policy titled {title}; found {len(hits)}')
    idx = hits[0]
    start, end = section_bounds(expected_section)
    if not (start < idx < end):
        raise SystemExit(f'{title} not found in expected section {expected_section}')
    return lines.pop(idx)


commercial = pop_policy('Commercial Oligarchy Antitrust Clause', 'sec-9')
cartel = pop_policy('Cartel Restitution and Price-Fixing Penalty', 'sec-9')
common = pop_policy('Common Ownership Competition Act', 'sec-18')
common = common.replace('title:"Common Ownership Competition Act"', 'title:"Common Ownership Competition"', 1)

# Insert all three together at the end of §1 Economy & Labor.
sec1_start, sec1_end = section_bounds('sec-1')
closing_candidates = [i for i in range(sec1_start, sec1_end) if lines[i].strip() == ']']
if not closing_candidates:
    raise SystemExit('Could not locate §1 policy-list closing bracket')
insert_at = closing_candidates[-1]
lines[insert_at:insert_at] = [commercial, cartel, common]

text = ''.join(lines)

# Rename the policy everywhere it is referenced, and correct its Act-package section reference.
text = text.replace('Common Ownership Competition Act', 'Common Ownership Competition')
old_ref = "<li>Common Ownership Competition <span class='act-ref'>§18</span></li>"
new_ref = "<li>Common Ownership Competition <span class='act-ref'>§1</span></li>"
if text.count(old_ref) != 1:
    raise SystemExit(f'Expected one old Common Ownership Act reference; found {text.count(old_ref)}')
text = text.replace(old_ref, new_ref, 1)

# Validate placement after the move.
check_lines = text.splitlines()

def bounds_in(source_lines, section_id):
    starts = [i for i, line in enumerate(source_lines) if f'id:"{section_id}"' in line]
    if len(starts) != 1:
        raise SystemExit(f'Expected one {section_id} after patch')
    start = starts[0]
    ends = [i for i in range(start + 1, len(source_lines)) if '    id:"sec-' in source_lines[i]]
    return start, (ends[0] if ends else len(source_lines))

for title in ['Commercial Oligarchy Antitrust Clause', 'Cartel Restitution and Price-Fixing Penalty', 'Common Ownership Competition']:
    needle = f'{{title:"{title}",'
    hits = [i for i, line in enumerate(check_lines) if needle in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected one {title} after patch; found {len(hits)}')
    s1, e1 = bounds_in(check_lines, 'sec-1')
    if not (s1 < hits[0] < e1):
        raise SystemExit(f'{title} is not in §1 after patch')

for wrong_section in ['sec-9', 'sec-18']:
    s, e = bounds_in(check_lines, wrong_section)
    block = '\n'.join(check_lines[s:e])
    for title in ['Commercial Oligarchy Antitrust Clause', 'Cartel Restitution and Price-Fixing Penalty', 'Common Ownership Competition']:
        if f'{{title:"{title}",' in block:
            raise SystemExit(f'{title} still appears as a policy in {wrong_section}')

if 'Common Ownership Competition Act' in text:
    raise SystemExit('Old individual policy title still remains')

# This is a placement/title patch only. Version must remain exactly 98.9.
if text.count('98.9') != version_count:
    raise SystemExit('Version marker count changed during patch')
if '98.10' in text or '99.0' in text:
    raise SystemExit('Unexpected version bump detected')

path.write_text(text, encoding='utf-8')
print('Patched policy placement without changing v98.9.')
print('Commercial Oligarchy, Cartel Restitution, and Common Ownership are now in §1 Economy & Labor.')
