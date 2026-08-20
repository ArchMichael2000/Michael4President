from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# 1) Henry Ford Act: enforce 14-policy cap by removing Profit-Sharing Preeminence,
# which is already bundled in the Valued Worker Act.
old = '''<strong>Bundled policies (15):</strong><ul><li>Federal Factory Foundations <span class='act-ref'>§1</span></li><li>Ban on Stock Buybacks <span class='act-ref'>§1</span></li><li>Productive Capital Priority <span class='act-ref'>§1</span></li><li>The Wage-Price Keystone Standard <span class='act-ref'>§1</span></li><li>The Right to Direct Sale <span class='act-ref'>§1</span></li><li>The Real Investment Tax Exemption <span class='act-ref'>§2</span></li><li>Profit-Sharing Preeminence <span class='act-ref'>§2</span></li><li>The Value-Add Transparency Rule <span class='act-ref'>§8</span></li>'''
new = '''<strong>Bundled policies (14):</strong><ul><li>Federal Factory Foundations <span class='act-ref'>§1</span></li><li>Ban on Stock Buybacks <span class='act-ref'>§1</span></li><li>Productive Capital Priority <span class='act-ref'>§1</span></li><li>The Wage-Price Keystone Standard <span class='act-ref'>§1</span></li><li>The Right to Direct Sale <span class='act-ref'>§1</span></li><li>The Real Investment Tax Exemption <span class='act-ref'>§2</span></li><li>The Value-Add Transparency Rule <span class='act-ref'>§8</span></li>'''
if old not in s: raise SystemExit('Henry Ford Act pattern not found')
s = s.replace(old, new, 1)

# 2) Education Renewal Act: move worker-compensation plank to Valued Worker Act.
old = '''<strong>Bundled policies (15):</strong><ul><li>God in Institutions <span class='act-ref'>§6</span></li><li>Polytechnic Standard <span class='act-ref'>§6</span></li><li>Apprenticeship Focus <span class='act-ref'>§6</span></li><li>Charter and Specialized Schools <span class='act-ref'>§6</span></li><li>State Public Academies <span class='act-ref'>§6</span></li><li>Art & Electives <span class='act-ref'>§6</span></li><li>Teacher Compensation and Service Benefits <span class='act-ref'>§6</span></li><li>Physical Readiness Standard: The La Sierra Model'''
new = '''<strong>Bundled policies (14):</strong><ul><li>God in Institutions <span class='act-ref'>§6</span></li><li>Polytechnic Standard <span class='act-ref'>§6</span></li><li>Apprenticeship Focus <span class='act-ref'>§6</span></li><li>Charter and Specialized Schools <span class='act-ref'>§6</span></li><li>State Public Academies <span class='act-ref'>§6</span></li><li>Art & Electives <span class='act-ref'>§6</span></li><li>Physical Readiness Standard: The La Sierra Model'''
if old not in s: raise SystemExit('Education Renewal Act pattern not found')
s = s.replace(old, new, 1)

# 3) Valued Worker Act: add Teacher Compensation and Right to Invent.
old = '''<strong>Bundled policies (3):</strong><ul><li>Pension Restoration <span class='act-ref'>§1</span></li><li>Profit-Sharing Preeminence <span class='act-ref'>§2</span></li><li>Retention Acknowledgement <span class='act-ref'>§1</span></li></ul>'''
new = '''<strong>Bundled policies (5):</strong><ul><li>Pension Restoration <span class='act-ref'>§1</span></li><li>Profit-Sharing Preeminence <span class='act-ref'>§2</span></li><li>Retention Acknowledgement <span class='act-ref'>§1</span></li><li>Teacher Compensation and Service Benefits <span class='act-ref'>§6</span></li><li>Right to Invent for Workers Act <span class='act-ref'>§1</span></li></ul>'''
if old not in s: raise SystemExit('Valued Worker Act pattern not found')
s = s.replace(old, new, 1)

# 4) Clean Government Act: add Constitutional Accountability as item 14.
old = '''<li>Contract Blacklisting <span class='act-ref'>§13</span></li><li>Corporate Personhood Abolition <span class='act-ref'>§12</span></li></ul>'''
new = '''<li>Contract Blacklisting <span class='act-ref'>§13</span></li><li>Corporate Personhood Abolition <span class='act-ref'>§12</span></li><li>Constitutional Accountability and Public Standing Amendment <span class='act-ref'>§13</span></li></ul>'''
# Update count only within Clean Government body.
idx = s.index('{title:"The Clean Government Act"')
end = s.index('tags:["governance","reform"]}', idx)
block = s[idx:end]
if '<strong>Bundled policies (13):</strong>' not in block or old not in block:
    raise SystemExit('Clean Government Act pattern not found')
block = block.replace('<strong>Bundled policies (13):</strong>', '<strong>Bundled policies (14):</strong>', 1).replace(old, new, 1)
s = s[:idx] + block + s[end:]

# 5) Federal Efficiency Act: add taxpayer non-subsidization as a spending-integrity rule.
old = '''<strong>Bundled policies (4):</strong><ul><li>The Unified Federal Procurement Market <span class='act-ref'>§13</span></li><li>Grant Delivery and Pass-Through Control <span class='act-ref'>§13</span></li><li>Federal Workforce and Contractor Structure Reform <span class='act-ref'>§13</span></li><li>The Subsidy and Federal Credit Performance Act <span class='act-ref'>§18</span></li></ul>'''
new = '''<strong>Bundled policies (5):</strong><ul><li>The Unified Federal Procurement Market <span class='act-ref'>§13</span></li><li>Grant Delivery and Pass-Through Control <span class='act-ref'>§13</span></li><li>Federal Workforce and Contractor Structure Reform <span class='act-ref'>§13</span></li><li>The Subsidy and Federal Credit Performance Act <span class='act-ref'>§18</span></li><li>Taxpayer Non-Subsidization of Pornography Act <span class='act-ref'>§13</span></li></ul>'''
if old not in s: raise SystemExit('Federal Efficiency Act pattern not found')
s = s.replace(old, new, 1)

# 6) Add a coherent Anti-Oligarchy Act for the two new concentrated-power planks.
anchor = '''      {title:"The Federal Efficiency Act",sub:"Buy once at the best price. Trace every grant dollar. Cut the layers, not the frontline.",body:"<em>Purpose:</em> Wring the waste out of federal procurement, grant delivery, workforce structure, and credit programs through structural redesign rather than blunt across-the-board cuts, so every dollar spent actually buys what it was appropriated to buy.<br><strong>Bundled policies (5):</strong><ul><li>The Unified Federal Procurement Market <span class='act-ref'>§13</span></li><li>Grant Delivery and Pass-Through Control <span class='act-ref'>§13</span></li><li>Federal Workforce and Contractor Structure Reform <span class='act-ref'>§13</span></li><li>The Subsidy and Federal Credit Performance Act <span class='act-ref'>§18</span></li><li>Taxpayer Non-Subsidization of Pornography Act <span class='act-ref'>§13</span></li></ul>",tags:["governance","reform","finance"]},'''
if anchor not in s: raise SystemExit('Federal Efficiency anchor not found after update')
anti = '''\n      {title:"The Anti-Oligarchy Act",sub:"No monopoly by committee. No financial intermediary may quietly govern the whole market.",body:"<em>Purpose:</em> Extend antitrust law from single-firm monopoly to coordinated commercial oligarchy and concentrated common ownership, so a small group of corporations or financial intermediaries cannot exercise monopoly-like power merely by dividing it among themselves.<br><strong>Bundled policies (2):</strong><ul><li>Commercial Oligarchy Antitrust Clause <span class='act-ref'>§1</span></li><li>Common Ownership Competition Act <span class='act-ref'>§18</span></li></ul>",tags:["economy","finance","reform","governance"],isNew:true},'''
s = s.replace(anchor, anchor + anti, 1)

# Validation: all five new policies appear in at least one Act bundle.
acts_start = s.index('isActs: true')
acts_end = s.index('id:"sec-hyper"', acts_start)
acts = s[acts_start:acts_end]
for title in [
    'Right to Invent for Workers Act',
    'Taxpayer Non-Subsidization of Pornography Act',
    'Commercial Oligarchy Antitrust Clause',
    'Common Ownership Competition Act',
    'Constitutional Accountability and Public Standing Amendment',
]:
    if title not in acts:
        raise SystemExit(f'Missing from Acts section: {title}')

# Hard cap validation: no standard act advertises more than 14 policies.
if 'Bundled policies (15)' in acts or 'Bundled policies (16)' in acts:
    raise SystemExit('Act cap violation remains')

p.write_text(s, encoding='utf-8')
print('Acts audit complete: five new policies packaged; all acts <= 14.')
