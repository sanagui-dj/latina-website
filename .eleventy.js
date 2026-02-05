const sitemap = require("@quasibit/eleventy-plugin-sitemap");

module.exports = function(eleventyConfig) {
  
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      // ESTO ES LO MÁS IMPORTANTE:
      hostname: "https://latinalive.net",
    },
  });

  // Mantén tus passthroughs igual
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("stream.m3u");
  eleventyConfig.addPassthroughCopy("googlea95dadeac05ead3d.html");
  eleventyConfig.addPassthroughCopy("robots.txt");

  eleventyConfig.addWatchTarget("./_includes/");
  
  return {
    // CAMBIA ESTO: Si el sitio es la raíz, usa "/"
    pathPrefix: "/", 
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    }
  };
};