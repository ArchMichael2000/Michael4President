from pathlib import Path

# Syntax-only follow-up for the v98.9 placement patch. Version intentionally unchanged.
path = Path('index.html')
text = path.read_text(encoding='utf-8')
version_count = text.count('98.9')
if version_count == 0:
    raise SystemExit('Expected Policybook v98.9 markers')

old = '      {title:"Retention Acknowledgement",sub:"Those who keep their people are honored. Those who churn them are named.",body:'
idx = text.find(old)
if idx < 0:
    raise SystemExit('Retention Acknowledgement policy not found')
line_end = text.find('\n', idx)
if line_end < 0:
    raise SystemExit('Retention Acknowledgement line ending not found')
line = text[idx:line_end]
if line.endswith('},'):
    pass
elif line.endswith('}'):
    text = text[:line_end-1] + '},' + text[line_end:]
else:
    raise SystemExit('Unexpected Retention Acknowledgement line ending')

# Validate the three patched policies remain in §1 and the old title is gone.
sec1_start = text.index('id:"sec-1"')
sec2_start = text.index('id:"sec-2"', sec1_start)
sec1 = text[sec1_start:sec2_start]
for title in ['Commercial Oligarchy Antitrust Clause', 'Cartel Restitution and Price-Fixing Penalty', 'Common Ownership Competition']:
    if sec1.count(f'title:"{title}"') != 1:
        raise SystemExit(f'{title} is not uniquely present in §1')
if 'Common Ownership Competition Act' in text:
    raise SystemExit('Old Common Ownership policy title remains')
if "<li>Common Ownership Competition <span class='act-ref'>§1</span></li>" not in text:
    raise SystemExit('Act reference for Common Ownership Competition is not §1')
if text.count('98.9') != version_count:
    raise SystemExit('Version markers changed')
if '98.10' in text or '99.0' in text:
    raise SystemExit('Unexpected version bump')

path.write_text(text, encoding='utf-8')
print('v98.9 syntax follow-up applied successfully')
