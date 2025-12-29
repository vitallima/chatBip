// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	runtimeConfig: {
		public: {
			supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
			supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY,
		}
	}
})
