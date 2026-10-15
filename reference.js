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
})();