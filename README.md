# RSS Feed para Blog en Framer

Este proyecto es un servidor Node.js que expone un endpoint `/rss` para generar un feed RSS a partir de los posts de un blog creado en Framer y alojado en https://lascositasdesita.com/blog.

## Uso

1. Instala las dependencias:
   ```sh
   npm install
   ```
2. Inicia el servidor:
   ```sh
   npm start
   ```
3. Accede a `(https://rss-feed-imc1.onrender.com/rss)` para ver el feed RSS.

## Personalización

Debes implementar la lógica para obtener los posts del blog en Framer dentro de `index.js`.

## Dependencias
- express
- rss
- rss-parser

