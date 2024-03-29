export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: "static",

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    script: [
      {
        lang: "javascript",
        src: "https://unpkg.com/xlsx/dist/xlsx.full.min.js"
      },
      {
        lang: "javascript",
        src:
          "https://cdnjs.cloudflare.com/ajax/libs/json2html/2.1.0/json2html.min.js"
      }
    ],
    title: "MCQ | Donateurs",
    htmlAttrs: {
      lang: "fr"
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
      { name: "format-detection", content: "telephone=no" }
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }]
  },
  //   env: {
  //     baseUrl: process.env.BASE_URL || "http://localhost:3000"
  //   },
  router: {
    prefetchLinks: false,
    base: process.env.NODE_ENV == "production" ? "" : "/mcq_donateurs/"
  },
  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ["element-ui/lib/theme-chalk/index.css", "~assets/css/main.css"],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ["@/plugins/element-ui", "@/plugins/supabase"],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: ["@nuxtjs/dotenv"],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [],
  build: {
    transpile: [/^element-ui/]
  }
  // Build Configuration: https://go.nuxtjs.dev/config-build
};
