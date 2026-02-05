const sitemap = require("@quasibit/eleventy-plugin-sitemap");

module.exports = function(eleventyConfig) {
  
  // CONFIGURACIÓN DEL PLUGIN SITEMAP
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://latinalive.net",
    },
  });

  // Copia de archivos estáticos
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("stream.m3u");
  eleventyConfig.addPassthroughCopy("googlea95dadeac05ead3d.html");
  eleventyConfig.addPassthroughCopy("robots.txt");
  
  // Eliminamos el passthrough de sitemap.xml para que el plugin pueda generarlo
  // eleventyConfig.addPassthroughCopy("sitemap.xml"); 

  // Si decides mantener OneSignal, deja estas dos líneas.
  // eleventyConfig.addPassthroughCopy("OneSignalSDKWorker.js");
  // eleventyConfig.addPassthroughCopy("OneSignalSDKWorkerUpdater.js");

  eleventyConfig.addWatchTarget("./_includes/");
  
  return {
    // Nota: El plugin usará el hostname de arriba, 
    // pero respetará este pathPrefix si las URLs lo necesitan.
    pathPrefix: "/latina/", 
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    }
  };
};