import { ref, onUnmounted } from 'vue'

export const useLiveAvailableNumbers = () => {
	const { $supabase } = useNuxtApp()
	const numbers = ref([])
	const isLoading = ref(false)
	let channel = null

	const fetchAvailable = async () => {
		isLoading.value = true
		const { data, error } = await $supabase
		.from('available_numbers') // view
		.select('number, peer_id, last_seen')
		.order('last_seen', { ascending: false })
		.limit(50)

		isLoading.value = false
		if (error) throw error
		numbers.value = data?.map(d => d.number) ?? []
	}

	const subscribe = async () => {
		// inicial
		await fetchAvailable()

		// realtime: escuta mudanças na tabela base
		channel = $supabase
		.channel('realtime-available-bips')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'temporary_numbers' },
			// estratégia simples e robusta: refetch
			async () => { 
				try { await fetchAvailable() } catch (e) { console.error(e) }
			}
		)
		.subscribe()
	}

	const unsubscribe = async () => {
		if (channel) {
			await $supabase.removeChannel(channel)
			channel = null
		}
	}

	onUnmounted(() => { unsubscribe() })

	return { numbers, isLoading, fetchAvailable, subscribe, unsubscribe }
}