#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {countWords, parseDay} = require('../assets/heatmap.js');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets/publications.json');
const categories = ['thoughts', 'life', 'works', 'reading', 'movies', 'games', 'novels'];

function decodeHtml(value) {
  const named = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? `&${entity};`;
    const hex = entity[1].toLowerCase() === 'x';
    return String.fromCodePoint(Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10));
  });
}

function textFromBody(html, file) {
  const match = html.match(/<div\b[^>]*class=["'][^"']*\barticle-body\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!match) throw new Error(`${file}: missing .article-body`);
  return decodeHtml(match[1]
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
}

function entriesFromCategory(category) {
  const file = path.join(root, category, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const entries = [];
  for (const match of html.matchAll(/<article\b[^>]*class=["'][^"']*\bentry\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const block = match[1];
    const date = block.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1];
    const link = block.match(/<h2\b[^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!link || parseDay(date) === null) throw new Error(`${file}: incomplete publication entry`);
    const url = link[1].replace(/index\.html$/, '');
    const expectedPrefix = `/${category}/`;
    if (!url.startsWith(expectedPrefix) || !url.endsWith('/') || url === expectedPrefix || /[?#]/.test(url)) {
      throw new Error(`${file}: invalid publication URL ${url}`);
    }
    const articleFile = path.join(root, url.slice(1), 'index.html');
    if (!fs.existsSync(articleFile)) throw new Error(`${file}: missing article ${articleFile}`);
    const title = decodeHtml(link[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (!title) throw new Error(`${file}: empty publication title`);
    const words = countWords(textFromBody(fs.readFileSync(articleFile, 'utf8'), articleFile));
    entries.push({date, title, url, words});
  }
  return entries;
}

function build() {
  const byUrl = new Map();
  for (const record of categories.flatMap(entriesFromCategory)) {
    const previous = byUrl.get(record.url);
    if (previous && previous.date !== record.date) throw new Error(`conflicting dates for ${record.url}`);
    if (previous && (previous.title !== record.title || previous.words !== record.words)) {
      throw new Error(`conflicting metadata for ${record.url}`);
    }
    byUrl.set(record.url, record);
  }
  const articles = [...byUrl.values()].sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url));
  return JSON.stringify({schemaVersion: 1, articles}, null, 2) + '\n';
}

if (require.main === module) {
  const content = build();
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) {
      console.error('assets/publications.json is out of date; run node scripts/build-publication-index.cjs');
      process.exitCode = 1;
    } else {
      console.log('assets/publications.json is up to date');
    }
  } else {
    fs.writeFileSync(output, content);
    console.log(`wrote ${path.relative(root, output)}`);
  }
}

module.exports = {build, output};
