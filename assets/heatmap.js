/* 发布统计的数据来源：七个分类页面的 article.entry、time[datetime] 和 h2 a。 */
(function () {
  'use strict';
  const categories = ['thoughts', 'life', 'works', 'reading', 'movies', 'games', 'novels'];
  const DAY = 86400000;
  function parseDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const stamp = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp : null;
  }
  function dateKey(stamp) { return new Date(stamp).toISOString().slice(0, 10); }
  function todayKey() {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date());
    const value = type => parts.find(p => p.type === type).value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  }
  function summarize(records, today) {
    const end = parseDay(today);
    if (end === null) throw new Error('Invalid current day');
    const start = end - 364 * DAY;
    const seen = new Map();
    const counts = new Map();
    for (const record of records) {
      const stamp = parseDay(record.date);
      if (stamp === null) throw new Error('Invalid publication date');
      if (seen.has(record.url)) {
        if (seen.get(record.url) !== record.date) throw new Error('Conflicting publication dates');
        continue;
      }
      seen.set(record.url, record.date);
      if (stamp < start || stamp > end) continue;
      if (!counts.has(record.date)) counts.set(record.date, []);
      counts.get(record.date).push(record);
    }
    const days = Array.from({length: 365}, (_, i) => {
      const date = dateKey(start + i * DAY);
      return {date, records: counts.get(date) || []};
    });
    return {days, offset: new Date(start).getUTCDay(), total: days.reduce((n, d) => n + d.records.length, 0), active: counts.size};
  }
  function readEntries(html, base) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('article.entry')).map(entry => {
      const link = entry.querySelector('h2 a[href]');
      const date = entry.querySelector('time[datetime]')?.getAttribute('datetime');
      if (!link || parseDay(date) === null) throw new Error('Incomplete publication entry');
      const url = new URL(link.getAttribute('href'), base);
      const origin = new URL(base).origin;
      if (url.origin !== origin || !categories.includes(url.pathname.split('/')[1])) throw new Error('Invalid record URL');
      url.hash = ''; url.search = '';
      url.pathname = url.pathname.replace(/index\.html$/, '');
      if (!url.pathname.endsWith('/')) url.pathname += '/';
      if (url.pathname.split('/').filter(Boolean).length < 2 || !link.textContent.trim()) throw new Error('Not a publication URL or title');
      return {date, title: link.textContent.trim(), url: url.pathname};
    });
  }
  async function init() {
    const status = document.getElementById('activity-status');
    if (!status) return;
    try {
      const groups = await Promise.all(categories.map(async category => {
        const url = new URL('/' + category + '/', location.origin);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch(url, {signal: controller.signal});
          if (!response.ok) throw new Error('Unable to load category');
          return readEntries(await response.text(), url.href);
        } finally { clearTimeout(timeout); }
      }));
      render(summarize(groups.flat(), todayKey()));
    } catch (error) {
      status.textContent = '发布统计暂时无法加载，请稍后刷新。你仍可以直接浏览各分类。';
      console.error('Publication statistics:', error);
    }
  }
  function render(data) {
    const grid = document.getElementById('heatmap-grid');
    const months = document.getElementById('heatmap-months');
    const detail = document.getElementById('activity-detail');
    const columns = Math.ceil((data.offset + data.days.length) / 7);
    grid.style.gridTemplateColumns = months.style.gridTemplateColumns = `repeat(${columns}, 11px)`;
    const buttons = [];
    let selected;
    function select(day, button) {
      if (selected) { selected.setAttribute('aria-pressed', 'false'); selected.tabIndex = -1; }
      selected = button; button.setAttribute('aria-pressed', 'true'); button.tabIndex = 0;
      detail.replaceChildren();
      const text = document.createElement('p');
      text.textContent = `${day.date} · ${day.records.length ? '发布 ' + day.records.length + ' 篇' : '没有发布记录'}`;
      detail.append(text);
      if (day.records.length) {
        const list = document.createElement('ul');
        for (const record of day.records) {
          const item = document.createElement('li'); const link = document.createElement('a');
          link.href = record.url; link.textContent = record.title; item.append(link); list.append(item);
        }
        detail.append(list);
      }
    }
    for (let i = 0; i < data.offset; i++) { const gap = document.createElement('span'); gap.className = 'heatmap-gap'; grid.append(gap); }
    data.days.forEach((day, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'heatmap-day';
      button.dataset.level = Math.min(day.records.length, 4);
      button.title = `${day.date}：${day.records.length} 篇`;
      button.setAttribute('aria-label', button.title); button.setAttribute('aria-pressed', 'false'); button.tabIndex = -1;
      button.addEventListener('click', () => select(day, button));
      button.addEventListener('keydown', event => {
        const steps = {ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, Home: -i, End: data.days.length - 1 - i};
        if (!(event.key in steps)) return;
        event.preventDefault();
        const next = Math.max(0, Math.min(data.days.length - 1, i + steps[event.key]));
        select(data.days[next], buttons[next]); buttons[next].focus();
      });
      grid.append(button); buttons.push(button);
      if (day.date.endsWith('-01') || (i === 0 && Number(day.date.slice(8)) < 23)) {
        const label = document.createElement('span'); label.textContent = Number(day.date.slice(5, 7)) + '月';
        label.style.gridColumn = String(Math.floor((i + data.offset) / 7) + 1); months.append(label);
      }
    });
    document.getElementById('activity-status').textContent = `最近 365 天发布 ${data.total} 篇，记录了 ${data.active} 天。`;
    document.getElementById('activity-chart').hidden = false;
    const latest = data.days.findLastIndex(day => day.records.length > 0);
    const index = latest === -1 ? data.days.length - 1 : latest;
    select(data.days[index], buttons[index]);
    const scroll = document.querySelector('.heatmap-scroll');
    scroll.scrollLeft = scroll.scrollWidth;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {parseDay, summarize, readEntries};
  if (typeof document !== 'undefined') init();
})();
