module.exports = function(eleventyConfig) {
  
  // Esta línea le dice a Eleventy:
  // "Cuando construyas el sitio, busca una carpeta llamada 'scripts'
  // y cópiala EXACTAMENTE IGUAL dentro de la carpeta _site".
  eleventyConfig.addPassthroughCopy("scripts");
eleventyConfig.addPassthroughCopy("css");
eleventyConfig.addPassthroughCopy("stream.m3u");
eleventyConfig.addPassthroughCopy("img");
eleventyConfig.addPassthroughCopy("googlea95dadeac05ead3d.html");
eleventyConfig.addPassthroughCopy("robots.txt");
eleventyConfig.addPassthroughCopy("sitemap.xml");
eleventyConfig.addPassthroughCopy("OneSignalSDKWorker.js");
eleventyConfig.addPassthroughCopy("OneSignalSDKWorkerUpdater.js");
  // El resto de la configuración que teníamos antes
  eleventyConfig.addWatchTarget("./_includes/");
  
  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    }
  };
};