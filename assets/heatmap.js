/* 发布统计的数据来源：发布时生成的 assets/publications.json。 */
(function () {
  'use strict';
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
  function countWords(text) {
    let count = 0;
    const remainder = text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, () => { count++; return ' '; });
    return count + (remainder.match(/[\p{L}\p{N}]+(?:['’‐-][\p{L}\p{N}]+)*/gu) || []).length;
  }
  function visibleDays(width) { return width >= 600 ? 365 : width >= 400 ? 270 : 180; }
  function wordLevel(words) { return words <= 0 ? 0 : words <= 2000 ? 1 : words <= 4000 ? 2 : words <= 6000 ? 3 : words <= 8000 ? 4 : 5; }
  function latestRecords(records, limit = 3) {
    return [...records].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN')).slice(0, limit);
  }
  function summarize(records, today, length = 365) {
    const end = parseDay(today);
    if (end === null) throw new Error('Invalid current day');
    if (!Number.isInteger(length) || length < 1 || length > 366) throw new Error('Invalid range');
    const start = end - (length - 1) * DAY;
    let allTotal = 0, allWords = 0;
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
      if (stamp > end) continue;
      allTotal++; allWords += record.words || 0;
      if (stamp < start) continue;
      if (!counts.has(record.date)) counts.set(record.date, []);
      counts.get(record.date).push(record);
    }
    const days = Array.from({length}, (_, i) => {
      const date = dateKey(start + i * DAY);
      const entries = counts.get(date) || [];
      return {date, records: entries, words: entries.reduce((n, r) => n + (r.words || 0), 0)};
    });
    return {days, allTotal, allWords, offset: new Date(start).getUTCDay(), total: days.reduce((n, d) => n + d.records.length, 0), active: counts.size};
  }
  function validatePublicationIndex(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.articles)) throw new Error('Invalid publication index');
    return data.articles.map(record => {
      if (!record || parseDay(record.date) === null || typeof record.title !== 'string' || !record.title.trim() ||
          typeof record.url !== 'string' || !/^\/(thoughts|life|works|reading|movies|games|novels)\/.+\/$/.test(record.url) ||
          !Number.isInteger(record.words) || record.words < 0) throw new Error('Invalid publication record');
      return {date: record.date, title: record.title.trim(), url: record.url, words: record.words};
    });
  }
  async function init() {
    const status = document.getElementById('activity-status');
    if (!status) return;
    try {
      const today = todayKey();
      const response = await fetch('/assets/publications.json', {cache: 'no-cache'});
      if (!response.ok) throw new Error('Unable to load publication index');
      const unique = validatePublicationIndex(await response.json()).filter(record => record.date <= today);
      summarize(unique, today); // 校验重复链接的日期一致性。
      renderLatest(unique);
      let length = visibleDays(window.innerWidth);
      const redraw = () => render(summarize(unique, todayKey(), length));
      redraw();
      window.addEventListener('resize', () => {
        const updated = visibleDays(window.innerWidth);
        if (updated !== length) { length = updated; redraw(); }
      });
    } catch (error) {
      status.textContent = '发布统计暂时无法加载，请稍后刷新。你仍可以直接浏览各分类。';
      console.error('Publication statistics:', error);
    }
  }
  function renderLatest(records) {
    const section = document.getElementById('latest-section');
    const container = document.getElementById('latest-entries');
    if (!section || !container) return;
    const latest = latestRecords(records);
    if (!latest.length) return;
    container.replaceChildren(...latest.map(record => {
      const article = document.createElement('article'); article.className = 'latest-entry';
      const time = document.createElement('time'); time.dateTime = record.date; time.textContent = record.date;
      const heading = document.createElement('h3'); const link = document.createElement('a');
      link.href = record.url; link.textContent = record.title; heading.append(link); article.append(time, heading);
      return article;
    }));
    section.hidden = false;
  }
  function render(data) {
    const grid = document.getElementById('heatmap-grid');
    const months = document.getElementById('heatmap-months');
    const detail = document.getElementById('activity-detail');
    grid.replaceChildren(); months.replaceChildren(); detail.replaceChildren(); detail.hidden = true;
    const tooltip = document.getElementById('heatmap-tooltip'); tooltip.hidden = true;
    const section = document.querySelector('.activity-section');
    let hideTimer;
    function hideSoon() { hideTimer = setTimeout(() => { tooltip.hidden = true; }, 180); }
    tooltip.onmouseenter = () => clearTimeout(hideTimer); tooltip.onmouseleave = hideSoon;
    function describe(day, target) {
      target.replaceChildren();
      const text = document.createElement('p');
      text.textContent = `${day.date} · ${day.records.length} 篇 · ${day.words.toLocaleString('zh-CN')} 字`; target.append(text);
      for (const record of day.records) {
        const link = document.createElement('a'); link.href = record.url;
        link.textContent = `${record.title} · ${record.words.toLocaleString('zh-CN')} 字`; target.append(link);
      }
    }
    function preview(day, button) {
      clearTimeout(hideTimer); describe(day, tooltip); tooltip.hidden = false;
      const box = button.getBoundingClientRect(), parent = section.getBoundingClientRect();
      tooltip.style.left = Math.max(0, Math.min(box.left - parent.left, parent.width - tooltip.offsetWidth)) + 'px';
      tooltip.style.top = (box.bottom - parent.top + 8) + 'px';
    }
    const columns = Math.ceil((data.offset + data.days.length) / 7);
    grid.style.gridTemplateColumns = months.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    const buttons = [];
    let selected;
    function select(day, button) {
      if (selected) { selected.setAttribute('aria-pressed', 'false'); selected.tabIndex = -1; }
      selected = button; button.setAttribute('aria-pressed', 'true'); button.tabIndex = 0;
      describe(day, detail); detail.hidden = false; tooltip.hidden = true;
    }
    for (let i = 0; i < data.offset; i++) { const gap = document.createElement('span'); gap.className = 'heatmap-gap'; grid.append(gap); }
    data.days.forEach((day, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'heatmap-day';
      button.dataset.level = wordLevel(day.words);
      const label = `${day.date}：${day.records.length} 篇，${day.words} 字`;
      button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', 'false'); button.tabIndex = -1;
      button.addEventListener('mouseenter', () => preview(day, button));
      button.addEventListener('mouseleave', hideSoon);
      button.addEventListener('focus', () => preview(day, button));
      button.addEventListener('blur', hideSoon);
      button.addEventListener('click', () => select(day, button));
      button.addEventListener('keydown', event => {
        if (event.key === 'Escape') { tooltip.hidden = true; return; }
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
    document.getElementById('activity-status').textContent = `累计发布 ${data.allTotal} 篇 · 累计字数 ${data.allWords.toLocaleString('zh-CN')} 字`;
    document.getElementById('activity-range').textContent = `最近 ${data.days.length} 天`;
    document.getElementById('activity-chart').hidden = false;
    const latest = data.days.findLastIndex(day => day.records.length > 0);
    const index = latest === -1 ? data.days.length - 1 : latest;
    buttons[index].tabIndex = 0; selected = buttons[index];
    const scroll = document.querySelector('.heatmap-scroll');
    scroll.scrollLeft = scroll.scrollWidth;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {parseDay, summarize, countWords, visibleDays, wordLevel, latestRecords, validatePublicationIndex};
  if (typeof document !== 'undefined') init();
})();
