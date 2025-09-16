
const express = require('express');
const RSS = require('rss');
const axios = require('axios');
const cheerio = require('cheerio');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;

const SITEMAP_URL = 'https://lascositasdesita.com/sitemap.xml';

async function getBlogPostsFromSitemap() {
  try {
    const { data } = await axios.get(SITEMAP_URL);
    const result = await xml2js.parseStringPromise(data);
    const urls = result.urlset.url.map(u => u.loc[0]);
    // Filtrar solo las URLs que contienen /blog/
    const blogUrls = urls.filter(url => url.includes('/blog/'));
    return blogUrls;
  } catch (err) {
    console.error('Error leyendo sitemap:', err);
    return [];
  }
}

async function getPostData(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const title = $('title').first().text() || url;
    const description = $('meta[name="description"]').attr('content') || '';
    const date = $('meta[property="article:published_time"]').attr('content') || new Date().toISOString();
    return { title, description, url, date };
  } catch (err) {
    console.error('Error leyendo post:', url, err);
    return null;
  }
}

app.get('/rss', async (req, res) => {
  const feed = new RSS({
    title: 'Las Cositas de Sita',
    description: 'Blog de Sita',
    feed_url: 'https://rss-feed-imc1.onrender.com/rss',
    site_url: 'https://lascositasdesita.com/blog',
    language: 'es',
  });

  const urls = await getBlogPostsFromSitemap();
  const posts = await Promise.all(urls.map(getPostData));
  posts.filter(Boolean).forEach(post => {
    feed.item({
      title: post.title,
      description: post.description,
      url: post.url,
      date: post.date,
    });
  });

  res.set('Content-Type', 'application/rss+xml');
  res.send(feed.xml({ indent: true }));
});

app.listen(PORT, () => {
  console.log(`Servidor RSS corriendo en http://localhost:${PORT}/rss`);
});

