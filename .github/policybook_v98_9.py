from pathlib import Path
import json
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')


def policy(title, sub, body, tags, is_new=True):
    suffix = ',isNew:true' if is_new else ''
    return (
        '      {title:' + json.dumps(title, ensure_ascii=False) +
        ',sub:' + json.dumps(sub, ensure_ascii=False) +
        ',body:' + json.dumps(body, ensure_ascii=False) +
        ',tags:' + json.dumps(tags, ensure_ascii=False, separators=(',', ':')) +
        suffix + '},\n'
    )


def remove_line_containing(source, needle):
    lines = source.splitlines(keepends=True)
    hits = [i for i, line in enumerate(lines) if needle in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected exactly one line containing {needle!r}; found {len(hits)}')
    del lines[hits[0]]
    return ''.join(lines)


def insert_after_line_containing(source, needle, insertion):
    lines = source.splitlines(keepends=True)
    hits = [i for i, line in enumerate(lines) if needle in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected exactly one line containing {needle!r}; found {len(hits)}')
    lines.insert(hits[0] + 1, insertion)
    return ''.join(lines)


def transform_line_containing(source, needle, transform):
    lines = source.splitlines(keepends=True)
    hits = [i for i, line in enumerate(lines) if needle in line]
    if len(hits) != 1:
        raise SystemExit(f'Expected exactly one line containing {needle!r}; found {len(hits)}')
    lines[hits[0]] = transform(lines[hits[0]])
    return ''.join(lines)


# v98.9 is a decimal release: preserve every existing NEW tag.
old_version_count = text.count('98.8')
if old_version_count < 5:
    raise SystemExit(f'Expected at least five v98.8 references; found {old_version_count}')
text = text.replace('98.8', '98.9')

# Remove the old §12 Corporate Personhood entry; it is being rewritten and moved to §13.
text = remove_line_containing(text, 'title:"Corporate Personhood Abolition",sub:"Corporations are not people."')

corp_body = """Corporations are not natural persons and do not possess citizenship, suffrage, or independent constitutional political rights. <em>Citizens United v. FEC</em> is overturned and the prior precedent permitting restrictions on corporate election spending is restored. Corporate treasury funds may not be used to purchase influence over specific candidates or elections. Natural persons remain free to speak, organize, associate, and spend their own lawful funds politically.<br><br>A commercial corporation is an economic entity, not itself a political association of citizens. Its owners and employees retain all of their individual rights, but the company does not acquire an additional set of political rights inherited from the Constitution. Its powers and protections exist because the sovereign people grant legal privileges to businesses operating within and benefiting from the country's laws, markets, infrastructure, and institutions. Those protections are established separately under the Business Bill of Rights and do not constitute constitutional personhood."""

business_rights_body = """Every lawful business is guaranteed by statute the protections necessary to operate in a free economy: the ability to own and transfer property, enter and enforce contracts, sue and defend itself in court, protect trade secrets, receive equal application of commercial law, receive fair process before major government penalties, and receive compensation when government lawfully takes its property. Government may not arbitrarily seize, dissolve, discriminate against, or deprive a lawful business of its property or operations.<br><br>Government may not compel a business to adopt, endorse, display, fund, or repeat political, ideological, religious, or social speech. Required factual disclosures necessary to enforce law, prevent fraud, report finances, or protect health and safety are not compelled advocacy.<br><br>For-profit businesses shall remain neutral toward specific candidates and specific elections. They may freely advocate on legislation, regulation, taxation, economic policy, industry policy, and other public issues, but may not use corporate resources to endorse or oppose candidates, purchase candidate election advertising, coordinate campaign activity, or otherwise act as an electoral instrument.<br><br>Nonprofit organizations whose legitimate purpose includes political, civic, ideological, religious, or public advocacy may engage in political speech and election activity. A for-profit company may not evade its restrictions through a controlled nonprofit, shell organization, pass-through donation, earmarked grant, affiliate, or intermediary. Such evasion is treated as the originating company's own conduct and carries enhanced penalties.<br><br>These are statutory business rights, not citizenship, suffrage, constitutional personhood, or inherited constitutional political rights."""

voting_body = """Only qualified natural persons may vote in governmental elections. No corporation, LLC, partnership, trust, nonprofit, business association, property-holding entity, or other artificial legal entity may register to vote, receive a ballot, cast a vote, appoint a proxy vote, or receive voting power because it owns property, pays taxes, employs workers, invests capital, or conducts business.<br><br>The prohibition applies to federal, state, territorial, county, municipal, school-district, utility-district, improvement-district, special-district, bond, referendum, initiative, recall, and every other governmental election under United States jurisdiction. Business owners retain their ordinary individual votes as natural persons. <strong>Economic ownership shall never create political suffrage.</strong>"""

sec13_insert = ''.join([
    policy('Corporate Personhood Abolition', 'Corporations are legal entities, not people, citizens, or political persons.', corp_body, ['liberty','reform','governance']),
    policy('The Business Bill of Rights', 'Strong legal protections for business without corporate personhood.', business_rights_body, ['economy','liberty','reform','governance']),
    policy('Business Voting Prohibition', 'People vote. Property and corporations never do.', voting_body, ['liberty','reform','governance']),
])
text = insert_after_line_containing(text, 'title:"Major Selling Point: Servants, Not Rulers"', sec13_insert)

# Keep the existing precedent policy's internal cross-reference accurate after the move.
if text.count('Corporate Personhood Abolition (§12)') != 1:
    raise SystemExit('Expected exactly one old §12 Corporate Personhood cross-reference')
text = text.replace('Corporate Personhood Abolition (§12)', 'Corporate Personhood Abolition (§13)')

cartel_body = """A company found to have knowingly participated in price fixing, bid rigging, market allocation, artificial supply restriction, or another collusive scheme that inflated consumer prices shall surrender the full value extracted from consumers through the scheme. The consumer overcharge is the amount actually paid during the conspiracy above the estimated competitive price, accounting for legitimate changes in input costs, inflation, taxes, supply conditions, and other independent market factors.<br><br>The recovered overcharge is paid into the <strong>Citizen Wealth Fund</strong>, returning the proceeds to the public through its citizen dividend. <strong>Restitution is not the fine.</strong> After surrendering the unlawful overcharge, each offender remains liable for all applicable civil and criminal fines, which go separately to the <strong>General Fund</strong>. Direct restitution already returned to consumers may reduce the CWF restitution amount to prevent duplicate compensation, but never reduces punitive fines.<br><br>Executives who knowingly organized or concealed the conspiracy remain individually liable. Repeated or structurally entrenched collusion may additionally trigger breakup or divestiture under the Commercial Oligarchy Antitrust Clause."""

cartel_entry = policy('Cartel Restitution and Price-Fixing Penalty', 'Give back the cartel profit first. Pay the punishment second.', cartel_body, ['economy','finance','reform','governance'])
text = insert_after_line_containing(text, 'title:"Commercial Oligarchy Antitrust Clause"', cartel_entry)

# Remove Corporate Personhood from the already-full Clean Government Act and correct its count.
def clean_government(line):
    if '<strong>Bundled policies (14):</strong>' not in line:
        raise SystemExit('Clean Government Act was not at the expected count of 14')
    item = "<li>Corporate Personhood Abolition <span class='act-ref'>§12</span></li>"
    if item not in line:
        raise SystemExit('Clean Government Act is missing the expected Corporate Personhood item')
    line = line.replace('<strong>Bundled policies (14):</strong>', '<strong>Bundled policies (13):</strong>', 1)
    line = line.replace(item, '', 1)
    return line

text = transform_line_containing(text, 'title:"The Clean Government Act"', clean_government)

# Merge the Anti-Oligarchy package into the approved Corporations' Social Contract Reform.
contract_body = """<em>Purpose:</em> Define the social contract between the American people and the corporations permitted to operate within their economy: strong legal protections for lawful enterprise, no corporate personhood or electoral franchise, strict candidate-election neutrality, and severe remedies against cartelization, common-ownership concentration, and collusive extraction from the public.<br><strong>Bundled policies (6):</strong><ul><li>Corporate Personhood Abolition <span class='act-ref'>§13</span></li><li>The Business Bill of Rights <span class='act-ref'>§13</span></li><li>Business Voting Prohibition <span class='act-ref'>§13</span></li><li>Commercial Oligarchy Antitrust Clause <span class='act-ref'>§1</span></li><li>Cartel Restitution and Price-Fixing Penalty <span class='act-ref'>§1</span></li><li>Common Ownership Competition Act <span class='act-ref'>§18</span></li></ul>"""
contract_line = policy("Corporations' Social Contract Reform", 'Business is protected by the Republic, but never sovereign over it.', contract_body, ['economy','finance','liberty','reform','governance'])
text = transform_line_containing(text, 'title:"The Anti-Oligarchy Act"', lambda _line: contract_line)

# Release validation.
if '98.8' in text:
    raise SystemExit('Old v98.8 reference remains')
if text.count('98.9') < old_version_count:
    raise SystemExit('v98.9 reference count is lower than the prior version count')

for title in [
    'Corporate Personhood Abolition',
    'The Business Bill of Rights',
    'Business Voting Prohibition',
    'Cartel Restitution and Price-Fixing Penalty',
    "Corporations' Social Contract Reform",
]:
    if text.count(f'title:"{title}"') != 1:
        raise SystemExit(f'Expected exactly one policy/Act title entry for {title}')

if 'title:"The Anti-Oligarchy Act"' in text:
    raise SystemExit('Old Anti-Oligarchy Act still exists')

# Confirm the §13 sequence requested by the user.
sec13 = text.index('id:"sec-13"')
sec14 = text.index('id:"sec-14"', sec13)
positions = [
    text.index('title:"Corporate Personhood Abolition"', sec13, sec14),
    text.index('title:"The Business Bill of Rights"', sec13, sec14),
    text.index('title:"Business Voting Prohibition"', sec13, sec14),
]
if positions != sorted(positions):
    raise SystemExit('§13 corporate-policy ordering is incorrect')

# Confirm cartel placement in §1.
sec1 = text.index('id:"sec-1"')
sec10 = text.index('id:"sec-10"', sec1)
if not (sec1 < text.index('title:"Commercial Oligarchy Antitrust Clause"', sec1, sec10) < text.index('title:"Cartel Restitution and Price-Fixing Penalty"', sec1, sec10) < sec10):
    raise SystemExit('Cartel policy placement in §1 is incorrect')

# Enforce the hard 14-policy ceiling across every Act package.
counts = [int(n) for n in re.findall(r'Bundled policies \((\d+)\)', text)]
if not counts or max(counts) > 14:
    raise SystemExit(f'Act package limit violated; counts={counts}')

# Preserve older NEW tagging on decimal releases and require the new/revised entries to be NEW.
for title in [
    'Corporate Personhood Abolition',
    'The Business Bill of Rights',
    'Business Voting Prohibition',
    'Cartel Restitution and Price-Fixing Penalty',
    "Corporations' Social Contract Reform",
]:
    line = next(line for line in text.splitlines() if f'title:"{title}"' in line)
    if 'isNew:true' not in line:
        raise SystemExit(f'NEW tag missing from {title}')

path.write_text(text, encoding='utf-8')
print('Policybook updated to v98.9.')
print("Added/revised corporate social-contract policies and merged Anti-Oligarchy Act.")
print(f'Maximum Act package count: {max(counts)}')
