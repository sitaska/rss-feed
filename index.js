
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
    // Buscar fecha en el div con data-framer-name="Fecha de publicación"
    let date = $('div[data-framer-name="Fecha de publicación"] p').first().text().trim();
    if (date) {
      // Convertir "13 ago 2025" a formato ISO
      const meses = {
        'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
        'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
      };
      const match = date.match(/(\d{1,2})\s([a-záéíóú]{3,})\s(\d{4})/i);
      if (match) {
        const dia = match[1].padStart(2, '0');
        const mes = meses[match[2].toLowerCase().slice(0,3)] || '01';
        const anio = match[3];
        date = `${anio}-${mes}-${dia}T00:00:00.000Z`;
      } else {
        date = new Date().toISOString();
      }
    } else {
      date = $('meta[property="article:published_time"]').attr('content') || new Date().toISOString();
    }
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
    feed_url: 'http://localhost:' + PORT + '/rss',
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
