from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
version_count = text.count('98.9')
if version_count == 0:
    raise SystemExit('Expected Policybook v98.9 markers')

lines = text.splitlines(keepends=True)

def section_bounds(section_id):
    hits = [i for i, line in enumerate(lines) if f'id:"{section_id}"' in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected one {section_id}; found {len(hits)}')
    start = hits[0]
    ends = [i for i in range(start + 1, len(lines)) if '    id:"sec-' in lines[i]]
    return start, (ends[0] if ends else len(lines))

def pop_policy(title, section_id):
    needle = f'{{title:"{title}",'
    hits = [i for i, line in enumerate(lines) if needle in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected one {title}; found {len(hits)}')
    idx = hits[0]
    start, end = section_bounds(section_id)
    if not (start < idx < end):
        raise SystemExit(f'{title} not in expected section {section_id}')
    return lines.pop(idx)

commercial = pop_policy('Commercial Oligarchy Antitrust Clause', 'sec-9')
cartel = pop_policy('Cartel Restitution and Price-Fixing Penalty', 'sec-9')
common = pop_policy('Common Ownership Competition Act', 'sec-banking')
common = common.replace('title:"Common Ownership Competition Act"', 'title:"Common Ownership Competition"', 1)

sec1_start, sec1_end = section_bounds('sec-1')
closing = [i for i in range(sec1_start, sec1_end) if lines[i].strip() == ']']
if not closing:
    raise SystemExit('Could not find end of §1 policy list')
lines[closing[-1]:closing[-1]] = [commercial, cartel, common]
text = ''.join(lines)

text = text.replace('Common Ownership Competition Act', 'Common Ownership Competition')
old_ref = "<li>Common Ownership Competition <span class='act-ref'>§18</span></li>"
new_ref = "<li>Common Ownership Competition <span class='act-ref'>§1</span></li>"
if text.count(old_ref) != 1:
    raise SystemExit(f'Expected one §18 Act reference; found {text.count(old_ref)}')
text = text.replace(old_ref, new_ref, 1)

check = text.splitlines()
def check_bounds(section_id):
    hits = [i for i, line in enumerate(check) if f'id:"{section_id}"' in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected one {section_id} after patch')
    start = hits[0]
    ends = [i for i in range(start + 1, len(check)) if '    id:"sec-' in check[i]]
    return start, (ends[0] if ends else len(check))

s1, e1 = check_bounds('sec-1')
for title in ['Commercial Oligarchy Antitrust Clause', 'Cartel Restitution and Price-Fixing Penalty', 'Common Ownership Competition']:
    needle = f'{{title:"{title}",'
    hits = [i for i, line in enumerate(check) if needle in line]
    if len(hits) != 1 or not (s1 < hits[0] < e1):
        raise SystemExit(f'{title} is not uniquely located in §1')

for wrong_section in ['sec-9', 'sec-banking']:
    s, e = check_bounds(wrong_section)
    block = '\n'.join(check[s:e])
    for title in ['Commercial Oligarchy Antitrust Clause', 'Cartel Restitution and Price-Fixing Penalty', 'Common Ownership Competition']:
        if f'{{title:"{title}",' in block:
            raise SystemExit(f'{title} still appears as a policy in {wrong_section}')

if 'Common Ownership Competition Act' in text:
    raise SystemExit('Old policy title remains')
if text.count('98.9') != version_count:
    raise SystemExit('Version markers changed')
if '98.10' in text or '99.0' in text:
    raise SystemExit('Unexpected version bump')

path.write_text(text, encoding='utf-8')
print('v98.9 placement patch applied successfully')
