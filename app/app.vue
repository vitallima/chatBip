<script setup>
	import { Analytics } from '@vercel/analytics/nuxt'

	useHead({
		title: 'chatBip — Conversas anônimas e temporárias',
		meta: [
			{
			name: 'description',
			content:
				'Crie um bip temporário e converse direto com outra pessoa, sem conta, sem histórico e sem servidor intermediando. O número dura até 24 horas.'
			},

			// Open Graph
			{ property: 'og:type', content: 'website' },
			{ property: 'og:title', content: 'chatBip — Conversas anônimas, diretas e temporárias' },
			{
			property: 'og:description',
			content:
				'Crie um bip temporário e converse direto com outra pessoa, sem conta, sem histórico e sem servidor intermediando. O número dura até 24 horas.'
			},
			{ property: 'og:url', content: 'https://www.chatbip.com' },
			{ property: 'og:image', content: 'https://www.chatbip.com/og/og-chatbip.png' },
			{ property: 'og:image:width', content: '1200' },
			{ property: 'og:image:height', content: '630' },

			// Twitter
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:title', content: 'chatBip — Conversas anônimas e temporárias' },
			{
			name: 'twitter:description',
			content:
				'Crie um bip temporário e converse direto com outra pessoa, sem conta e sem servidor intermediando.'
			},
			{ name: 'twitter:image', content: 'https://www.chatbip.com/og/og-chatbip.png' }
		]
	})
</script>

<template lang="pug">
	nuxt-page
	Analytics
</template>