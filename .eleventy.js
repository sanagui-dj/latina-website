module.exports = function(eleventyConfig) {
  
  // Copia de archivos estáticos
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("stream.m3u");
  eleventyConfig.addPassthroughCopy("googlea95dadeac05ead3d.html");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");

  // Si decides mantener OneSignal, deja estas dos líneas. Si no, bórralas:
  // eleventyConfig.addPassthroughCopy("OneSignalSDKWorker.js");
  // eleventyConfig.addPassthroughCopy("OneSignalSDKWorkerUpdater.js");

  eleventyConfig.addWatchTarget("./_includes/");
  
  return {
    // Esto asegura que el pathPrefix se aplique a los filtros de URL en el HTML
    pathPrefix: "/latina/", 
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    }
  };
};