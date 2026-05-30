const fs = require('fs');
const path = require('path');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Projects';
const VIEW_NAME = process.env.AIRTABLE_VIEW_NAME || 'Grid view';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'projects.json');

if (!API_KEY || !BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables.');
  process.exit(1);
}

const fields = ['Title', 'Category', 'Status', 'Date', 'Description', 'Images', 'Video'];
const encodedFields = fields.map((field) => `fields[]=${encodeURIComponent(field)}`).join('&');
const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?${encodedFields}&view=${encodeURIComponent(VIEW_NAME)}&sort[0][field]=Date&sort[0][direction]=desc`;

const fetchAirtableRecords = async () => {
  let records = [];
  let offset = undefined;

  while (true) {
    const url = offset ? `${baseUrl}&offset=${encodeURIComponent(offset)}` : baseUrl;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Airtable request failed: ${response.status} ${response.statusText} - ${text}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.records)) {
      throw new Error('Unexpected Airtable response structure.');
    }

    records = records.concat(data.records);
    if (!data.offset) {
      break;
    }
    offset = data.offset;
  }

  return records;
};

const normalizeRecord = (record) => {
  const fields = record.fields || {};
  const rawImages = Array.isArray(fields.Images) ? fields.Images : [];
  const images = rawImages
    .map((attachment) => attachment && attachment.url)
    .filter(Boolean);

  return {
    title: fields.Title || 'Untitled project',
    category: fields.Category || 'Other',
    status: fields.Status || 'Draft',
    date: fields.Date || '',
    description: fields.Description || '',
    images,
    video: fields.Video || '',
  };
};

const run = async () => {
  try {
    const records = await fetchAirtableRecords();
    const projects = records
      .map(normalizeRecord)
      .sort((a, b) => {
        const aTime = new Date(a.date).getTime() || 0;
        const bTime = new Date(b.date).getTime() || 0;
        return bTime - aTime;
      });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(projects, null, 2) + '\n', 'utf8');
    console.log(`Synced ${projects.length} project(s) to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
};

run();
