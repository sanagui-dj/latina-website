module.exports = function(eleventyConfig) {
  
  // Copia de archivos estáticos (Incluyendo el sitemap manual)
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("stream.m3u");
  eleventyConfig.addPassthroughCopy("googlea95dadeac05ead3d.html");
  eleventyConfig.addPassthroughCopy("robots.txt");
  
  // ESTA LÍNEA ES CLAVE AHORA:
  eleventyConfig.addPassthroughCopy("sitemap.xml");
eleventyConfig.addPassthroughCopy("src/img/site.webmanifest");
  eleventyConfig.addWatchTarget("./_includes/");
  
  return {
    pathPrefix: "/", 
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    }
  };
};