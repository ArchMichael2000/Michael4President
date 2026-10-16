(() => {
  'use strict';
  const formatMoney = value => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(value);
  document.querySelectorAll('[data-explorer]').forEach(group => {
    const controls = group.querySelector('[data-explorer-controls]');
    const tabs = [...controls.querySelectorAll('button')];
    const panels = [...group.querySelectorAll('[data-explorer-panel]')];
    if (!tabs.length || tabs.length !== panels.length) return;
    controls.hidden = false;
    controls.setAttribute('role','tablist');
    const activate = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        tab.setAttribute('role','tab');
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].setAttribute('role','tabpanel');
        panels[i].setAttribute('aria-labelledby', tab.id);
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
    };
    const target = document.getElementById(location.hash.slice(1));
    const initial = panels.findIndex(panel => panel === target || (target && panel.contains(target)));
    activate(initial < 0 ? 0 : initial);
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(next, true);
      });
    });
    window.addEventListener('hashchange', () => {
      const target = document.getElementById(location.hash.slice(1));
      const index = panels.findIndex(panel => panel === target || (target && panel.contains(target)));
      if (index >= 0) activate(index);
    });
  });
  document.querySelectorAll('[data-faq]').forEach(section => {
    const button = section.querySelector('[data-faq-toggle]');
    const entries = [...section.querySelectorAll('details')];
    if (!button || !entries.length) return;
    button.hidden = false;
    const sync = () => {
      const open = entries.every(entry => entry.open);
      button.textContent = open ? 'Close all answers' : 'Open all answers';
      button.setAttribute('aria-expanded', String(open));
    };
    button.addEventListener('click', () => {
      const open = !entries.every(entry => entry.open);
      entries.forEach(entry => { entry.open = open; });
      sync();
    });
    entries.forEach(entry => entry.addEventListener('toggle', sync));
    sync();
  });
  const calculator = document.querySelector('[data-contribution-calculator]');
  if (calculator) {
    const income = calculator.querySelector('[name=income]');
    const tier = calculator.querySelector('[name=hsaTier]');
    const results = calculator.querySelector('[data-calculator-results]');
    const error = calculator.querySelector('[data-calculator-error]');
    const calculate = () => {
      const value = Number(income.value);
      const rate = Number(tier.value);
      const valid = income.value.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= 1000000000 && [0.02,0.03,0.05].includes(rate);
      error.textContent = valid ? '' : 'Enter an annual liquid-income amount from $0 to $1,000,000,000.';
      income.setAttribute('aria-invalid', String(!valid));
      results.hidden = !valid;
      if (!valid) return;
      const amounts = {personal:value*0.10, retirement:value*0.03, hsa:value*rate, supplement:value*(0.05-rate), total:value*(0.13+rate)};
      Object.entries(amounts).forEach(([key, amount]) => {
        calculator.querySelector('[data-amount="'+key+'"]').textContent = formatMoney(amount);
      });
      calculator.querySelector('[data-combined-rate]').textContent = (13 + rate*100).toFixed(0)+'%';
      calculator.querySelector('[data-tier-label]').textContent = (rate*100).toFixed(0)+'%';
    };
    income.addEventListener('input', calculate);
    tier.addEventListener('change', calculate);
    calculator.addEventListener('submit', event => {event.preventDefault();calculate();});
    calculator.querySelectorAll('[data-income-preset]').forEach(button => button.addEventListener('click', () => {
      income.value = button.dataset.incomePreset;
      tier.value = button.dataset.tierPreset;
      calculate();
    }));
    calculator.querySelector('[data-calculator-controls]').hidden = false;
    calculate();
  }
  const progress = document.querySelector('[data-reading-progress]');
  if (progress) {
    const update = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      progress.value = distance > 0 ? Math.max(0, Math.min(100, window.scrollY/distance*100)) : 100;
    };
    let pending = false;
    window.addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {update();pending = false;});
    }, {passive:true});
    window.addEventListener('resize', update);
    new ResizeObserver(update).observe(document.body);
    update();
  }
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.contents a[href^="#"]')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          if (link.hash === '#'+entry.target.id) link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin:'-10% 0px -70% 0px'});
    links.forEach(link => {const target=document.getElementById(link.hash.slice(1));if(target)observer.observe(target);});
  }
  let printStates = [];
  window.addEventListener('beforeprint', () => {
    printStates = [...document.querySelectorAll('details')].map(entry => [entry,entry.open]);
    printStates.forEach(([entry]) => {entry.open=true;});
  });
  window.addEventListener('afterprint', () => {printStates.forEach(([entry,open])=>{entry.open=open;});});
  document.querySelectorAll('.fiscal-comparison').forEach(section => {
  const years = ['Year 0', 'Year 1', 'Year 4', 'Year 10'];
    const measures = {
      balance: {
        control: 'Net fiscal balance',
        question: 'What happens to the annual deficit?',
        chartTitle: 'Annual net fiscal balance',
        current: [-1833, -1833, -1833, -1833],
        reborn: [-1833, 992.186, 1004.230, 1079.531],
        currentValue: value => `${formatBillion(value)} deficit`,
        rebornValue: (value, index) => index === 0 ? `${formatBillion(value)} deficit` : `${formatBillion(value)} surplus`,
        improvement: (value, index) => index === 0 ? 'Same FY2024 baseline' : `${formatBillion(value + 1833)} stronger than the FY2024 reference`,
        summary: 'Both systems begin at the FY2024 $1.833T federal deficit in Year 0. America Reborn reaches the modeled $992B consolidated surplus in Year 1, rising to $1.080T at Year 10.',
        scope: 'Comparison basis: Year 0 is the shared FY2024 baseline: $4.919T in federal receipts, $6.752T in outlays, and a $1.833T unified deficit. America Reborn’s V35 Year 0 operating-stage result is shown at Year 1, when implementation begins; later V35 Year 4 and Year 10 values retain their original stages.',
        includeZero: true
      },
      revenue: {
        control: 'Revenue and receipts',
        question: 'How much public revenue does each system collect?',
        chartTitle: 'Revenue and receipts',
        current: [4919, 4919, 4919, 4919],
        reborn: [4919, 8907.138, 8977.639, 9102.693],
        currentValue: value => formatBillion(value),
        rebornValue: value => formatBillion(value),
        improvement: value => `${formatBillion(value - 4919)} above the FY2024 reference`,
        summary: 'Both systems begin at the FY2024 $4.919T receipts baseline in Year 0. America Reborn reaches $8.907T in modeled public revenue at Year 1, then $9.103T at Year 10.',
        scope: 'Scope: Current System is FY2024 federal receipts only. America Reborn is V35 total government revenue: General Treasury revenue plus dedicated public receipts and public earnings. The two measures cover different governmental ledgers, and the distinction is deliberate.',
        includeZero: false
      },
      outlays: {
        control: 'Outlays and obligations',
        question: 'What level of public obligations does each system carry?',
        chartTitle: 'Outlays and modeled operating obligations',
        current: [6752, 6752, 6752, 6752],
        reborn: [6752, 7914.952, 7973.408, 8023.162],
        currentValue: value => formatBillion(value),
        rebornValue: value => formatBillion(value),
        improvement: (_value, index) => `Paired with a ${formatBillion([992.186, 1004.230, 1079.531][index])} consolidated surplus`,
        summary: 'America Reborn’s modeled system-wide operating obligations rise with its funding base, while retaining a positive consolidated balance in every modeled stage.',
        scope: 'Scope: Current System is FY2024 federal outlays. America Reborn shows V35 modeled system-wide operating obligations, calculated as total government revenue less the consolidated replacement balance. It includes several dedicated ledgers, so it is not a federal-outlays forecast.',
        includeZero: false
      },
      socialSecurity: {
        control: 'Social Security balance',
        question: 'Does Social Security close its annual funding gap?',
        chartTitle: 'Social Security annual balance',
        current: [-67, -67, -67, -67],
        reborn: [-67, 0, 0, 0],
        currentValue: value => `${formatBillion(value)} gap`,
        rebornValue: (value, index) => index === 0 ? `${formatBillion(value)} gap` : '$0B balanced',
        improvement: () => '$67B annual gap closed',
        summary: 'America Reborn’s V35 Social Security ledger reaches annual balance at each modeled stage after its designated funding waterfall; the fixed current reference has a $67B annual OASDI gap.',
        scope: 'Scope: Current System uses FY2024 OASDI income of $1.418T less $1.485T in cost. America Reborn shows the V35 dedicated Social Security ledger after designated contributions, trust income, and National Continuity Contribution support. It is a dedicated-ledger comparison, not the federal unified budget.',
        includeZero: true
      },
      healthcare: {
        control: 'Healthcare cost and balance',
        question: 'What does the healthcare system cost, and does it cover that cost?',
        chartTitle: 'Annual national healthcare cost',
        current: [5300, 5300, 5300, 5300],
        reborn: [5300, 4240, 4240, 4240],
        currentValue: value => `${formatBillion(value)} cost`,
        rebornValue: value => `${formatBillion(value)} cost`,
        improvement: () => '$1.060T lower cost · $365B modeled margin',
        summary: 'America Reborn applies V35’s 20 percent structural-savings case, lowering annual national healthcare cost from the FY2024 $5.300T benchmark to $4.240T while producing a modeled $364.5B healthcare balance.',
        scope: 'Scope: both lines show annual national healthcare cost, not federal outlays. The Current System line is the FY2024 CMS national-health-expenditure benchmark. America Reborn is V35’s $4.240T 20-percent-savings cost target; its separate healthcare ledger has a $364.5B modeled balance.',
        includeZero: false
      }
    };
    const formatBillion = value => {
      const prefix = value < 0 ? '−' : '';
      const absolute = Math.abs(value);
      return absolute >= 1000 ? `${prefix}$${(absolute / 1000).toFixed(3)}T` : `${prefix}$${Math.round(absolute)}B`;
    };
    const makeTrendSvg = measure => {
      const current = measure.current;
      const reborn = measure.reborn;
      const values = [...current, ...reborn];
      const dataMinimum = Math.min(...values);
      const dataMaximum = Math.max(...values);
      const range = dataMaximum - dataMinimum || Math.max(Math.abs(dataMaximum), 1);
      const minimum = (measure.includeZero ? Math.min(0, dataMinimum) : dataMinimum) - range * 0.14;
      const maximum = (measure.includeZero ? Math.max(0, dataMaximum) : dataMaximum) + range * 0.14;
      const x = [125, 310, 500, 675];
      const finalIndex = years.length - 1;
      const y = value => 38 + (maximum - value) / (maximum - minimum) * 194;
      const path = values => values.map((value, index) => `${index ? 'L' : 'M'}${x[index]} ${y(value).toFixed(1)}`).join(' ');
      const dots = (values, className) => values.slice(1).map((value, index) => `<circle class="${className}" cx="${x[index + 1]}" cy="${y(value).toFixed(1)}" r="6"/>`).join('');
      const axisMaximum = Math.ceil(maximum / 100) * 100;
      const axisMinimum = Math.floor(minimum / 100) * 100;
      const currentY = Math.max(28, y(current[finalIndex]) - 13).toFixed(1);
      const rebornY = Math.min(242, Math.max(28, y(reborn[finalIndex]) + (Math.abs(current[finalIndex] - reborn[finalIndex]) < range * 0.08 ? 20 : -13))).toFixed(1);
      const zeroLine = measure.includeZero ? `<line x1="95" y1="${y(0).toFixed(1)}" x2="710" y2="${y(0).toFixed(1)}" class="fiscal-zero-line"/><text x="78" y="${(y(0) + 4).toFixed(1)}" text-anchor="end" class="fiscal-trend-tick">$0</text>` : '';
      return `<svg viewBox="0 0 760 286" role="img" aria-labelledby="fiscal-trend-title fiscal-trend-desc"><desc id="fiscal-trend-desc">${measure.summary} The vertical scale is in actual billions of dollars, and both paths begin at the shared Year 0 baseline.</desc><line x1="95" y1="234" x2="710" y2="234" class="fiscal-trend-axis"/>${zeroLine}<text x="78" y="42" text-anchor="end" class="fiscal-trend-tick">${formatBillion(axisMaximum)}</text><text x="78" y="230" text-anchor="end" class="fiscal-trend-tick">${formatBillion(axisMinimum)}</text><path d="${path(current)}" class="fiscal-trend-line-current"/><path d="${path(reborn)}" class="fiscal-trend-line-reborn"/>${dots(current, 'fiscal-trend-dot-current')}${dots(reborn, 'fiscal-trend-dot-reborn')}<circle class="fiscal-trend-dot-shared" cx="${x[0]}" cy="${y(current[0]).toFixed(1)}" r="8"/><text x="${x[0]}" y="${Math.min(248, y(current[0]) + 23).toFixed(1)}" text-anchor="middle" class="fiscal-shared-caption">Shared baseline</text><text x="710" y="${currentY}" text-anchor="end" class="fiscal-trend-label fiscal-trend-label-current">Current System · ${measure.currentValue(current[finalIndex])}</text><text x="710" y="${rebornY}" text-anchor="end" class="fiscal-trend-label fiscal-trend-label-reborn">America Reborn · ${measure.rebornValue(reborn[finalIndex], finalIndex)}</text>${years.map((year, index) => `<text x="${x[index]}" y="262" text-anchor="middle" class="fiscal-year-label">${year}</text>`).join('')}</svg>`;
    };
    const makeOutcomeSvg = () => {
      const current = measures.balance.current;
      const reborn = measures.balance.reborn;
      const centers = [135, 330, 505, 675];
      const zeroY = 164;
      const scale = 124 / 1900;
      const bar = (center, value, className, label) => {
        const endY = zeroY - value * scale;
        const top = Math.min(zeroY, endY);
        const height = Math.abs(endY - zeroY);
        const labelY = value >= 0 ? Math.max(30, endY - 10) : Math.min(290, endY - 11);
        return `<rect x="${center - 24}" y="${top.toFixed(1)}" width="48" height="${height.toFixed(1)}" class="${className}"/><text x="${center}" y="${labelY.toFixed(1)}" text-anchor="middle" class="fiscal-value-label">${label}</text>`;
      };
      const baseline = bar(centers[0], current[0], 'fiscal-baseline-bar', formatBillion(current[0]));
      const comparisons = centers.slice(1).map((center, index) => {
        const valueIndex = index + 1;
        return `${bar(center - 31, current[valueIndex], 'fiscal-current-bar', formatBillion(current[valueIndex]))}${bar(center + 31, reborn[valueIndex], 'fiscal-policy-bar', formatBillion(reborn[valueIndex]))}`;
      }).join('');
      return `<svg viewBox="0 0 760 350" role="img" aria-labelledby="fiscal-comparison-chart-title fiscal-comparison-chart-desc"><desc id="fiscal-comparison-chart-desc">One shared Year 0 baseline deficit is followed by grouped Current System deficit bars and America Reborn surplus bars at Year 1, Year 4, and Year 10.</desc><line x1="86" y1="${zeroY}" x2="720" y2="${zeroY}" class="fiscal-zero-line"/><text x="74" y="43" text-anchor="end" class="fiscal-axis-label">+$1.2T</text><text x="74" y="${zeroY + 4}" text-anchor="end" class="fiscal-axis-label">$0</text><text x="74" y="292" text-anchor="end" class="fiscal-axis-label">−$1.8T</text>${baseline}${comparisons}${years.map((year, index) => `<text x="${centers[index]}" y="318" text-anchor="middle" class="fiscal-year-label">${year}</text>${index === 0 ? `<text x="${centers[index]}" y="336" text-anchor="middle" class="fiscal-shared-caption">shared baseline</text>` : ''}`).join('')}</svg>`;
    };
    section.innerHTML = `<h2 id="fiscal-comparison-title">The fiscal picture beside the current baseline</h2><p>Year 0 is the shared current-system baseline. Year 1 is the first implementation point, followed by the V35 Year 4 and Year 10 operating stages.</p><p class="fiscal-question" data-fiscal-question></p><div class="table-scroll" role="region" tabindex="0" aria-label="Fiscal outcomes compared by year and system"><table><colgroup><col><col><col></colgroup><caption data-fiscal-table-caption></caption><thead><tr><th scope="col" class="comparison-year">Year</th><th scope="col" class="comparison-current-head">Current System</th><th scope="col" class="comparison-reborn-head">America Reborn</th></tr></thead><tbody data-fiscal-table-body></tbody></table></div><figure class="fiscal-comparison-chart" aria-labelledby="fiscal-comparison-chart-title"><figcaption id="fiscal-comparison-chart-title"><strong>Annual fiscal outcome</strong><span>Billions of dollars. Year 0 is the shared baseline; Year 1 onward shows the system split.</span></figcaption><div class="fiscal-chart-legend" aria-label="Chart legend"><span class="fiscal-legend-current">Current System</span><span class="fiscal-legend-reborn">America Reborn</span></div><div class="fiscal-chart-scroll">${makeOutcomeSvg()}</div></figure><figure class="fiscal-trend-chart" aria-labelledby="fiscal-trend-title"><figcaption><strong id="fiscal-trend-title" data-fiscal-trend-title></strong><span>Billions of dollars. Both systems begin at the shared Year 0 baseline.</span></figcaption><div class="fiscal-measure-controls" role="group" aria-label="Choose a fiscal measure">${Object.entries(measures).map(([key, measure]) => `<button type="button" data-fiscal-measure="${key}" aria-pressed="false">${measure.control}</button>`).join('')}</div><div class="fiscal-chart-legend" aria-label="Chart legend"><span class="fiscal-legend-current">Current System</span><span class="fiscal-legend-reborn">America Reborn</span></div><div class="fiscal-chart-scroll" data-fiscal-trend></div><p class="fiscal-trend-summary" data-fiscal-summary aria-live="polite"></p><p class="fiscal-trend-scope" data-fiscal-scope></p></figure></section>`;
    const question = section.querySelector('[data-fiscal-question]');
    const caption = section.querySelector('[data-fiscal-table-caption]');
    const body = section.querySelector('[data-fiscal-table-body]');
    const title = section.querySelector('[data-fiscal-trend-title]');
    const trend = section.querySelector('[data-fiscal-trend]');
    const summary = section.querySelector('[data-fiscal-summary]');
    const scope = section.querySelector('[data-fiscal-scope]');
    const buttons = [...section.querySelectorAll('[data-fiscal-measure]')];
    const render = key => {
      const measure = measures[key];
      question.textContent = measure.question;
      caption.textContent = `${measure.control}, billions of dollars`;
      body.innerHTML = years.map((year, index) => `<tr><th scope="row" class="comparison-year">${year}</th><td class="comparison-current"><span class="comparison-value ${measure.current[index] < 0 ? 'comparison-deficit' : ''}">${measure.currentValue(measure.current[index])}</span><small class="comparison-improvement">FY2024 reference held fixed</small></td><td class="comparison-reborn"><span class="comparison-value ${measure.reborn[index] < 0 ? 'comparison-deficit' : (index > 0 && (key === 'balance' || key === 'socialSecurity') ? 'comparison-surplus' : '')}">${measure.rebornValue(measure.reborn[index], index)}</span><small class="comparison-improvement">${index === 0 ? 'Shared FY2024 baseline' : measure.improvement(measure.reborn[index], index)}</small></td></tr>`).join('');
      title.textContent = measure.chartTitle;
      trend.innerHTML = makeTrendSvg(measure);
      summary.textContent = measure.summary;
      scope.textContent = `${measure.scope} The trend uses actual dollars on a scale tailored to this measure; the table keeps the unadjusted V35 values visible.`;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fiscalMeasure === key)));
    };
    buttons.forEach(button => button.addEventListener('click', () => render(button.dataset.fiscalMeasure)));
    render('balance');
  });
})();

// Annualized comparison model: preserve the shared FY2024 control, then show
// the full annual path behind the Year 0/1/4/10 table view.
document.querySelectorAll('.fiscal-comparison').forEach(section => {
  const fy = Array.from({ length: 11 }, (_, year) => 2024 + year);
  const displayYears = [0, 1, 4, 10];
  const currentRevenue = [4918.106, 5234.617, 5403.617, 5885, 6071, 6320, 6595, 6869, 7130, 7391, 7669];
  const currentOutlays = [6734.896, 7009.992, 7395.992, 7772, 8028, 8463, 8796, 9155, 9569, 10006, 10487];
  const currentBalance = currentRevenue.map((value, year) => value - currentOutlays[year]);
  const policyRevenueAnchors = [[1, 8907.138], [4, 8977.639], [10, 9102.693]];
  const policyBalanceAnchors = [[1, 992.186], [4, 1004.230], [10, 1079.531]];
  const policyOutlayAnchors = policyRevenueAnchors.map(([year, revenue], index) => [year, revenue - policyBalanceAnchors[index][1]]);
  const interpolate = (anchors, year) => {
    const right = anchors.findIndex(([anchorYear]) => anchorYear >= year);
    if (right <= 0) return anchors[Math.max(0, right)][1];
    const [leftYear, leftValue] = anchors[right - 1];
    const [rightYear, rightValue] = anchors[right];
    return leftValue + (rightValue - leftValue) * (year - leftYear) / (rightYear - leftYear);
  };
  const adoption = fy.map((_, year) => Math.min(1, year / 4));
  const currentHealth = fy.map((_, year) => 5300 * Math.pow(9000 / 5300, year / 10));
  const currentSocial = fy.map((_, year) => -67 - 381 * year / 10);
  const policyRevenueFull = fy.map((_, year) => year === 0 ? currentRevenue[0] : interpolate(policyRevenueAnchors, year) * currentRevenue[year] / currentRevenue[0]);
  const policyOutlaysFull = fy.map((_, year) => year === 0 ? currentOutlays[0] : interpolate(policyOutlayAnchors, year) * currentOutlays[year] / currentOutlays[0]);
  const blend = (baseline, policy) => baseline.map((value, year) => value + (policy[year] - value) * adoption[year]);
  const policyRevenue = blend(currentRevenue, policyRevenueFull);
  const policyOutlays = blend(currentOutlays, policyOutlaysFull);
  const policyBalance = policyRevenue.map((value, year) => value - policyOutlays[year]);
  const policySocial = currentSocial.map((value, year) => value * (1 - adoption[year]));
  const policyHealth = currentHealth.map((value, year) => value * (1 - 0.2 * adoption[year]));
  const taxFlow = (currentBase, policyBase) => {
    const current = fy.map(() => currentBase);
    const target = fy.map((_, year) => year === 0 ? currentBase : policyBase * currentRevenue[year] / currentRevenue[0]);
    return { current, reborn: blend(current, target) };
  };
  const personalIncomeFlow = taxFlow(2426, 2047.0757841);
  const corporateIncomeFlow = taxFlow(530, 390.416);
  const landTaxFlow = taxFlow(797, 2232.929);
  const otherTreasuryFlow = taxFlow(1963, 5710.93123619 - 2047.0757841 - 390.416 - 2232.929);
  const selectedPublicPurposeCurrent = fy.map(() => 1418 + 1643 + 848);
  const selectedPublicPurposeAnchors = [[1, 8907.13809715438 - 5710.93123619], [4, 8977.63882416453 - 5710.93123619], [10, 9102.69343170247 - 5710.93123619]];
  const selectedPublicPurposeTarget = fy.map((_, year) => year === 0 ? selectedPublicPurposeCurrent[0] : interpolate(selectedPublicPurposeAnchors, year) * currentRevenue[year] / currentRevenue[0]);
  const selectedPublicPurposePolicy = blend(selectedPublicPurposeCurrent, selectedPublicPurposeTarget);
  const format = value => {
    const sign = value < 0 ? '−' : '';
    const amount = Math.abs(value);
    return amount >= 1000 ? `${sign}$${(amount / 1000).toFixed(2)}T` : `${sign}$${Math.round(amount)}B`;
  };
  const measures = {
    balance: {
      control: 'Net fiscal balance', question: 'What happens to the annual deficit?', title: 'Annual net fiscal balance',
      current: currentBalance, reborn: policyBalance,
      currentValue: value => `${format(value)} ${value < 0 ? 'deficit' : 'surplus'}`,
      rebornValue: value => `${format(value)} ${value < 0 ? 'deficit' : 'surplus'}`,
      summary: 'Both lines start at the same FY2024 deficit. America Reborn then phases toward the V35 consolidated balance over four years, with receipts and outlays normalized separately.',
      scope: 'Current System is federal receipts less outlays. America Reborn is V35’s consolidated replacement balance. FY2024 Treasury actuals ($4.918T receipts; $6.735T outlays) replace the rounded V35 reference. V35 includes state/local healthcare sponsorship; the current federal-only line is not a like-for-like all-government total. This is a model estimate, not a CBO score.'
    },
    revenue: {
      control: 'Revenue and receipts', question: 'How much money flows into the public system?', title: 'Annual receipts and government revenue',
      current: currentRevenue, reborn: policyRevenue, currentValue: format, rebornValue: format,
      summary: 'The America Reborn path begins at the shared control, then blends toward V35 total government revenue normalized to the current federal receipts index.',
      scope: 'Current System is federal budget receipts. America Reborn is V35 total government revenue, including dedicated ledgers and selected public-enterprise receipts; its workbook total also includes $658B of state/local healthcare sponsor funding. Since the current baseline is federal-only, these totals are not like-for-like. A full all-level comparison must add current state/local budgets and align their funding responsibilities.'
    },
    individualIncome: {
      control: 'Personal income tax', question: 'How does the personal-income tax flow compare?', title: 'Personal income tax receipts',
      current: personalIncomeFlow.current, reborn: personalIncomeFlow.reborn, currentValue: format, rebornValue: format,
      summary: 'The current line holds FY2024 receipts fixed. America Reborn phases toward V35’s 10% liquid-income tax estimate, scaled by aggregate current federal receipt growth.',
      scope: 'Current benchmark: $2.426T in FY2024 federal individual income-tax receipts (2024_Basis_Control). America Reborn: $2.047T V35 liquid-income tax estimate (Tax_Revenue_2024), normalized by aggregate receipts growth. V35 does not provide annual growth for this tax base, so the policy path is a proxy, not a tax-base forecast.'
    },
    corporateIncome: {
      control: 'Corporate income tax', question: 'How does the corporate-tax flow compare?', title: 'Corporate income-tax receipts',
      current: corporateIncomeFlow.current, reborn: corporateIncomeFlow.reborn, currentValue: format, rebornValue: format,
      summary: 'The current line holds FY2024 corporate receipts fixed. America Reborn phases toward V35’s central effective-rate estimate, normalized by aggregate receipts growth.',
      scope: 'Current benchmark: about $530B of FY2024 corporate receipts (2024_Basis_Control). America Reborn: $390.416B central effective-rate estimate (Tax_Revenue_2024). The current line is fixed; the policy line uses total receipts as a proxy because neither source supplies comparable annual corporate-profit bases through FY2034.'
    },
    landTax: {
      control: 'Property and land tax', question: 'How does the land/property revenue flow compare?', title: 'State/local property tax and federalized land-value tax',
      current: landTaxFlow.current, reborn: landTaxFlow.reborn, currentValue: format, rebornValue: format,
      summary: 'The current line holds the FY2024 state/local property-tax reference fixed. America Reborn phases toward V35’s federalized land-value-tax scenario, scaled by the current receipts index.',
      scope: 'Current benchmark: $797B in FY2024 state/local property taxes. America Reborn: $2.233T V35 federalized land-value-tax scenario. These are not identical tax bases or levels of government; this view shows the proposed replacement scale, not a like-for-like tax bill.'
    },
    otherTreasury: {
      control: 'Other General Treasury receipts', question: 'What remains in General Treasury receipts after the named tax flows?', title: 'Other General Treasury receipts',
      current: otherTreasuryFlow.current, reborn: otherTreasuryFlow.reborn, currentValue: format, rebornValue: format,
      summary: 'Residual receipts are calculated after individual and corporate income taxes in Current System, and after personal income, corporate income, and land-value taxes in America Reborn.',
      scope: 'Current residual is FY2024 federal receipts less individual and corporate receipts. America Reborn residual is V35 unrestricted General Treasury revenue less the three named V35 revenue lines. It includes other taxes, fees, duties, and public-enterprise/investment earnings; the current residual is held fixed at FY2024.'
    },
    publicPurposeReceipts: {
      control: 'Selected public-purpose receipts', question: 'How do dedicated Social Security and healthcare funding flows compare?', title: 'Selected public-purpose receipts',
      current: selectedPublicPurposeCurrent, reborn: selectedPublicPurposePolicy, currentValue: format, rebornValue: format,
      summary: 'The current reference combines FY2024 OASDI income and federal/state-local healthcare sponsor funding. America Reborn follows V35 dedicated public receipts, normalized by current federal receipts growth.',
      scope: 'Current reference: $1.418T OASDI income + $1.643T federal healthcare sponsor pool + $848B state/local healthcare funding, from 2024_Basis_Control. America Reborn: V35 total government revenue less unrestricted General Treasury revenue (Budget_0_4_10). These are selected purpose-bound flows, not the full revenue totals; internal transfers and private HSA deposits are excluded.'
    },
    outlays: {
      control: 'Outlays and obligations', question: 'What outflows and operating obligations does each system carry?', title: 'Annual outlays and modeled operating obligations',
      current: currentOutlays, reborn: policyOutlays, currentValue: format, rebornValue: format,
      summary: 'America Reborn outflows scale V35’s implied consolidated outlays by the current federal outlay index, separately from receipts; balance is receipts minus outlays.',
      scope: 'Current System is federal cash outlays. America Reborn is consolidated V35 outflows implied by V35 revenue minus its consolidated balance, normalized to CBO’s current outlay path. Its scope includes state/local healthcare funding. V35 does not cost transition construction, startup administration, or every proposed service; those costs remain unscored, not assumed to be zero.'
    },
    socialSecurity: {
      control: 'Social Security balance', question: 'Does Social Security close its annual funding gap?', title: 'Annual Social Security balance',
      current: currentSocial, reborn: policySocial,
      currentValue: value => `${format(value)} gap`, rebornValue: value => value < -0.5 ? `${format(value)} gap` : '$0 balanced',
      summary: 'America Reborn phases toward the V35 dedicated ledger’s modeled balance; the current line connects the published OASDI endpoints.',
      scope: 'Current System uses the FY2024 OASDI balance (−$67B) and FY2034 Trustees projection (−$448B), with intervening years linearly interpolated for display. America Reborn phases to the V35 Social Security ledger after designated contributions and NCC. Intermediate current values are not annual SSA forecasts.'
    },
    healthcare: {
      control: 'Healthcare cost and balance', question: 'How does healthcare cost change, and what does the dedicated ledger retain?', title: 'National healthcare spending and America Reborn cost path',
      current: currentHealth, reborn: policyHealth, currentValue: format, rebornValue: format,
      summary: 'America Reborn applies V35’s 20% savings assumption to the same national spending path, phased in over four years. V35 separately reports a $376.5B healthcare-ledger balance.',
      scope: 'Both lines are national health expenditures (public and private), not government-only outlays. CMS projects $5.3T in 2024 and about $9.0T in 2034; annual points are interpolated. America Reborn applies V35’s 20% savings assumption. Its dedicated ledger balance is separate, not netted against all-payer spending.'
    }
  };
  const makeTrend = measure => {
    const values = [...measure.current, ...measure.reborn];
    const includesZero = measure === measures.balance || measure === measures.socialSecurity;
    const low = Math.min(...values, ...(includesZero ? [0] : []));
    const high = Math.max(...values, ...(includesZero ? [0] : []));
    const spread = high - low || 1;
    const min = low - spread * 0.12;
    const max = high + spread * 0.16;
    const x = fy.map((_, year) => 100 + year * 57);
    const y = value => 34 + (max - value) / (max - min) * 188;
    const path = data => data.map((value, year) => `${year ? 'L' : 'M'}${x[year]} ${y(value).toFixed(1)}`).join(' ');
    const dots = data => data.map((value, year) => `<circle cx="${x[year]}" cy="${y(value).toFixed(1)}" r="${displayYears.includes(year) ? 4.5 : 2.5}"/>`).join('');
    const zero = includesZero ? `<line x1="88" y1="${y(0).toFixed(1)}" x2="680" y2="${y(0).toFixed(1)}" class="fiscal-zero-line"/><text x="78" y="${(y(0) + 4).toFixed(1)}" text-anchor="end" class="fiscal-trend-tick">$0</text>` : '';
    const lastCurrentY = Math.max(26, y(measure.current[10]) - 12);
    const lastRebornY = Math.min(246, Math.max(26, y(measure.reborn[10]) + (Math.abs(y(measure.current[10]) - y(measure.reborn[10])) < 20 ? 18 : -8)));
    return `<svg viewBox="0 0 900 280" role="img" aria-labelledby="fiscal-trend-title fiscal-trend-desc"><desc id="fiscal-trend-desc">${measure.summary} Annual estimates from FY2024 through FY2034.</desc><line x1="88" y1="226" x2="710" y2="226" class="fiscal-trend-axis"/>${zero}<text x="78" y="39" text-anchor="end" class="fiscal-trend-tick">${format(max)}</text><text x="78" y="223" text-anchor="end" class="fiscal-trend-tick">${format(min)}</text><path d="${path(measure.current)}" class="fiscal-trend-line-current"/><path d="${path(measure.reborn)}" class="fiscal-trend-line-reborn"/><g class="fiscal-trend-dot-current">${dots(measure.current)}</g><g class="fiscal-trend-dot-reborn">${dots(measure.reborn)}</g><circle class="fiscal-trend-dot-shared" cx="${x[0]}" cy="${y(measure.current[0]).toFixed(1)}" r="7"/><text x="${x[0]}" y="${Math.min(252, y(measure.current[0]) + 22).toFixed(1)}" text-anchor="middle" class="fiscal-shared-caption">Shared Year 0</text><text x="890" y="${lastCurrentY.toFixed(1)}" text-anchor="end" class="fiscal-trend-label fiscal-trend-label-current">Current ${measure.currentValue(measure.current[10])}</text><text x="890" y="${lastRebornY.toFixed(1)}" text-anchor="end" class="fiscal-trend-label fiscal-trend-label-reborn">America Reborn ${measure.rebornValue(measure.reborn[10])}</text>${displayYears.map(year => `<text x="${x[year]}" y="262" text-anchor="middle" class="fiscal-year-label">Year ${year}</text>`).join('')}</svg>`;
  };
  const makeBars = () => {
    const centers = [155, 325, 495, 665];
    const zeroY = 164;
    const scale = 112 / 2200;
    const bar = (center, value, className) => {
      const endY = zeroY - value * scale;
      const top = Math.min(zeroY, endY);
      const height = Math.max(2, Math.abs(endY - zeroY));
      const labelY = value >= 0 ? Math.max(26, endY - 9) : Math.min(294, endY - 6);
      const labelClass = className === 'fiscal-baseline-bar' ? 'fiscal-value-label fiscal-value-label-dark' : 'fiscal-value-label';
      return `<rect x="${center - 19}" y="${top.toFixed(1)}" width="38" height="${height.toFixed(1)}" class="${className}"/><text x="${center}" y="${labelY.toFixed(1)}" text-anchor="middle" class="${labelClass}">${format(value)}</text>`;
    };
    const groups = displayYears.map((year, index) => {
      const current = currentBalance[year];
      const reborn = policyBalance[year];
      if (year === 0) return `${bar(centers[index], current, 'fiscal-baseline-bar')}<text x="${centers[index]}" y="318" text-anchor="middle" class="fiscal-year-label">Year 0 · FY2024</text>`;
      return `${bar(centers[index] - 23, current, 'fiscal-current-bar')}${bar(centers[index] + 23, reborn, 'fiscal-policy-bar')}<text x="${centers[index]}" y="318" text-anchor="middle" class="fiscal-year-label">Year ${year}</text>`;
    }).join('');
    return `<svg viewBox="0 0 760 340" role="img" aria-labelledby="fiscal-comparison-chart-title fiscal-comparison-chart-desc"><desc id="fiscal-comparison-chart-desc">FY2024 is the shared control; bars compare annual net balances in Years 1, 4, and 10.</desc><line x1="92" y1="${zeroY}" x2="720" y2="${zeroY}" class="fiscal-zero-line"/><text x="84" y="39" text-anchor="end" class="fiscal-axis-label">Surplus</text><text x="84" y="${zeroY + 4}" text-anchor="end" class="fiscal-axis-label">$0</text><text x="84" y="302" text-anchor="end" class="fiscal-axis-label">Deficit</text>${groups}</svg>`;
  };
  section.innerHTML = `<h2 id="fiscal-comparison-title">The fiscal picture beside the current baseline</h2><p>Year 0 is the FY2024 control. Current System follows Treasury actuals through FY2025, the FY2026 CBO estimate, and the published baseline thereafter. America Reborn starts at the same point, then phases toward the V35 operating model.</p><p class="fiscal-question" data-fiscal-question></p><div class="table-scroll" role="region" tabindex="0" aria-label="Fiscal outcomes compared by year and system"><table><colgroup><col><col><col></colgroup><caption data-fiscal-caption></caption><thead><tr><th scope="col" class="comparison-year">Year</th><th scope="col" class="comparison-current-head">Current System</th><th scope="col" class="comparison-reborn-head">America Reborn</th></tr></thead><tbody data-fiscal-body></tbody></table></div><figure class="fiscal-comparison-chart" aria-labelledby="fiscal-comparison-chart-title"><figcaption id="fiscal-comparison-chart-title"><strong>Annual fiscal outcome</strong><span>Net balance in billions; Year 0 is shared, followed by Years 1, 4, and 10.</span></figcaption><div class="fiscal-chart-legend" aria-label="Chart legend"><span class="fiscal-legend-current">Current System</span><span class="fiscal-legend-reborn">America Reborn</span></div><div class="fiscal-chart-scroll">${makeBars()}</div></figure><figure class="fiscal-trend-chart" aria-labelledby="fiscal-trend-title"><figcaption><strong id="fiscal-trend-title" data-fiscal-title></strong><span>Annual nominal values, FY2024–FY2034. Four selected years appear in the table.</span></figcaption><div class="fiscal-measure-controls" role="group" aria-label="Choose a fiscal measure">${Object.entries(measures).map(([key, measure]) => `<button type="button" data-fiscal-measure="${key}" aria-pressed="false">${measure.control}</button>`).join('')}</div><div class="fiscal-chart-legend" aria-label="Chart legend"><span class="fiscal-legend-current">Current System</span><span class="fiscal-legend-reborn">America Reborn</span></div><div class="fiscal-chart-scroll" data-fiscal-trend></div><p class="fiscal-trend-summary" data-fiscal-summary aria-live="polite"></p><p class="fiscal-trend-scope" data-fiscal-scope></p></figure><p class="fiscal-model-note"><strong>How the estimate is built:</strong> V35 Year 0, 4, and 10 operating anchors are shifted to Years 1, 4, and 10 because Year 0 is the control. Values between those anchors are linearly interpolated. The consolidated V35 revenue and balance paths are normalized by the Current System total-receipts index, an aggregate proxy because V35 has no annual forecast for every distinct tax base. A four-year straight-line implementation ramp is an explicit assumption. Year 0 is common; policy adoption reaches 100% in Year 4. Uncosted transition and service expenses remain unscored. Amounts are nominal dollars.</p>`;
  const scopeWarning = document.createElement('p');
  scopeWarning.className = 'fiscal-model-alert';
  scopeWarning.textContent = 'Scope note: this is not yet a like-for-like all-government comparison. Current System uses federal receipts and outlays; America Reborn uses V35 consolidated government flows, including $658B in state/local healthcare sponsorship. Internal transfers are counted once, and household-owned HSA deposits are excluded.';
  section.querySelector('[data-fiscal-question]').before(scopeWarning);
  section.querySelector('.fiscal-model-note').innerHTML = '<strong>Normalization and interpolation:</strong> FY2024 is the shared actual control. The current path uses Treasury FY2024–FY2025 actuals, CBO’s FY2026 estimate, and CBO’s February 2026 baseline for FY2027–FY2034. V35 Year 0/4/10 anchors map to policy Years 1/4/10 and are linearly interpolated. Target receipts are normalized by the matching-year current-receipts index; target outlays are normalized separately by the current-outlays index. Both flows ramp from the shared control at 25% per year through Year 4, and net balance is recalculated as receipts minus outlays. This is an aggregate proxy, not a base-by-base tax forecast: V35 does not provide annual forecasts for every tax base or price all transition, construction, and service costs. V35 also includes $658B of state/local healthcare sponsor funding while the Current System baseline is federal-only, so the aggregate figures are not a like-for-like all-government score. Household-owned HSA contributions are excluded from government revenue. All values are nominal dollars.';
  section.querySelector('.fiscal-model-note').insertAdjacentHTML('beforeend', ' <strong>Tax-flow filters:</strong> named FY2024 current benchmarks are held fixed where no matching current-policy category forecast is supplied; the America Reborn category estimates scale by aggregate federal receipt growth and the same implementation ramp. These are alternate flow lenses, not rows to sum: the property-tax view compares state/local property-tax receipts with the V35 federalized land-value-tax scenario, which has a different base and government scope.');
  const question = section.querySelector('[data-fiscal-question]');
  const caption = section.querySelector('[data-fiscal-caption]');
  const body = section.querySelector('[data-fiscal-body]');
  const title = section.querySelector('[data-fiscal-title]');
  const trend = section.querySelector('[data-fiscal-trend]');
  const summary = section.querySelector('[data-fiscal-summary]');
  const scope = section.querySelector('[data-fiscal-scope]');
  const buttons = [...section.querySelectorAll('[data-fiscal-measure]')];
  const render = key => {
    const measure = measures[key];
    question.textContent = measure.question;
    caption.textContent = `${measure.control}, billions of dollars`;
    body.innerHTML = displayYears.map(year => {
      const current = measure.current[year];
      const reborn = measure.reborn[year];
      const currentNote = ['individualIncome', 'corporateIncome', 'landTax', 'otherTreasury', 'publicPurposeReceipts'].includes(key)
        ? 'FY2024 benchmark held fixed'
        : key === 'healthcare'
        ? (year === 0 ? 'CMS FY2024 NHE actual' : 'CMS 2024–2034 path; interpolated')
        : key === 'socialSecurity'
          ? (year === 0 ? 'SSA FY2024 OASDI actual' : year === 10 ? 'SSA Trustees FY2034 projection' : 'Interpolated between SSA endpoints')
          : year === 0 ? 'Treasury FY2024 actual' : year === 1 ? 'Treasury FY2025 actual' : year === 2 ? 'CBO FY2026 estimate' : 'CBO baseline projection';
      const policyNote = year === 0 ? 'Shared control point' : `${Math.round(adoption[year] * 100)}% implementation · V35 normalized`;
      return `<tr><th scope="row" class="comparison-year">Year ${year}<small>FY${fy[year]}</small></th><td class="comparison-current"><span class="comparison-value ${current < 0 ? 'comparison-deficit' : ''}">${measure.currentValue(current)}</span><small class="comparison-improvement">${currentNote}</small></td><td class="comparison-reborn"><span class="comparison-value ${current < 0 && reborn < 0 ? 'comparison-deficit' : ((key === 'balance' || key === 'socialSecurity') && reborn >= 0 ? 'comparison-surplus' : '')}">${measure.rebornValue(reborn)}</span><small class="comparison-improvement">${policyNote}</small></td></tr>`;
    }).join('');
    title.textContent = measure.title;
    trend.innerHTML = makeTrend(measure);
    summary.textContent = measure.summary;
    scope.textContent = `${measure.scope} FY2027–FY2034 uses CBO’s February 2026 baseline vintage, which predates later 2026 legislation; FY2026 is CBO’s estimate, not a final Treasury annual statement.`;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fiscalMeasure === key)));
  };
  buttons.forEach(button => button.addEventListener('click', () => render(button.dataset.fiscalMeasure)));
  render('balance');
});
