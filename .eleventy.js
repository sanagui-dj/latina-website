const sitemap = require("@quasibit/eleventy-plugin-sitemap");

module.exports = function(eleventyConfig) {
  
  // 1. Configuración del Plugin de Sitemap
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://latinalive.net",
    },
  });

  // 2. Copia de archivos estáticos (Passthrough)
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("stream.m3u");
  eleventyConfig.addPassthroughCopy("googlea95dadeac05ead3d.html");
  eleventyConfig.addPassthroughCopy("robots.txt");

  // NOTA: Asegúrate de NO tener un archivo llamado sitemap.xml en la raíz, 
  // o el plugin no podrá escribir el nuevo.

  // 3. Vigilancia de cambios
  eleventyConfig.addWatchTarget("./_includes/");
  
  return {
    // Definimos la raíz como pathPrefix para evitar URLs de GitHub o subcarpetas
    pathPrefix: "/", 
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    }
  };
};