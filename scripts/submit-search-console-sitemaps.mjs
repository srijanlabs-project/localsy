const accessToken = process.env.GSC_ACCESS_TOKEN || '';
const rawProperties = process.env.GSC_PROPERTIES || '';
const sitemapUrl = process.env.SITEMAP_URL || '';

if (!accessToken) {
  console.error('Missing GSC_ACCESS_TOKEN');
  process.exit(1);
}

if (!rawProperties.trim()) {
  console.error('Missing GSC_PROPERTIES (comma-separated, e.g. "sc-domain:happygifting.in,https://roadpali.happygifting.in/")');
  process.exit(1);
}

if (!sitemapUrl.trim()) {
  console.error('Missing SITEMAP_URL (e.g. "https://happygifting.in/sitemap.xml")');
  process.exit(1);
}

const properties = rawProperties
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const submitOne = async (property) => {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Submit failed for ${property} (${res.status}): ${body}`);
  }

  console.log(`Submitted sitemap for: ${property}`);
};

const run = async () => {
  for (const property of properties) {
    await submitOne(property);
  }
  console.log('All sitemap submissions completed.');
};

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

