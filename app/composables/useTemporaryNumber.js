// composables/useTemporaryNumber.js
import { ref } from 'vue'

export const useTemporaryNumber = () => {
	const { $supabase } = useNuxtApp()
	const myNumber = ref(null)
	const isLoading = ref(false)
	const error = ref(null)

	const STORAGE_KEY = 'chatbip_temporary_number'
	const HOURS_24 = 24 * 60 * 60 * 1000 // 24 horas em ms

	/**
	 * Gera um número aleatório de 5 dígitos
		*/
	const generateRandomNumber = () => {
		return Math.floor(10000 + Math.random() * 90000).toString()
	}

  /**
   * Verifica se o número ainda é válido no Supabase
   */
	const validateNumber = async (number) => {
		try {
			const { data, error: queryError } = await $supabase
				.from('temporary_numbers')
				.select('*')
				.eq('number', number)
				.single()

			if (queryError) {
				console.error('Erro ao validar número:', queryError)
				return false
			}

			// Verifica se ainda não expirou
			const expiresAt = new Date(data.expires_at)
			const now = new Date()

			return expiresAt > now
		} catch (err) {
			console.error('Erro na validação:', err)
			return false
		}
	}

  /**
   * Cria um novo número no Supabase
   */
	const createNumberInDatabase = async (number) => {
		const now = new Date()
		const expiresAt = new Date(now.getTime() + HOURS_24)

		const { data, error: insertError } = await $supabase
		.from('temporary_numbers')
		.insert([
			{
			number,
			is_online: false,
			expires_at: expiresAt.toISOString(),
			created_at: now.toISOString(),
			last_seen: now.toISOString()
			}
		])
		.select()
		.single()

		if (insertError) {
			// Se erro de número duplicado, tenta outro
			if (insertError.code === '23505') { // unique violation
				return null
			}
			throw insertError
		}

		return data
	}

  /**
   * Tenta gerar um número único (com retry)
   */
	const generateUniqueNumber = async (maxAttempts = 10) => {
		for (let i = 0; i < maxAttempts; i++) {
			const number = generateRandomNumber()
			const result = await createNumberInDatabase(number)
			
			if (result) {
				return number
			}
			
			console.log(`Número ${number} já existe, tentando novamente...`)
		}
		
		throw new Error('Não foi possível gerar um número único após várias tentativas')
	}

  /**
   * Salva o número no localStorage
   */
	const saveToLocalStorage = (number) => {
		const data = {
			number,
			savedAt: new Date().toISOString()
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
	}

  /**
   * Recupera o número do localStorage
	*/
	const getFromLocalStorage = () => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (!stored) return null

			const data = JSON.parse(stored)
			return data.number
		} catch (err) {
			console.error('Erro ao ler localStorage:', err)
			return null
		}
	}

  /**
   * Remove o número do localStorage
   */
	const clearLocalStorage = () => {
		localStorage.removeItem(STORAGE_KEY)
	}

  /**
   * Inicializa o número temporário
   * 1. Verifica localStorage
   * 2. Valida no Supabase
   * 3. Gera novo se necessário
   */
	const initializeNumber = async () => {
		isLoading.value = true
		error.value = null

		try {
			// Tenta recuperar do localStorage
			const storedNumber = getFromLocalStorage()

			if (storedNumber) {
				console.log('Número encontrado no localStorage:', storedNumber)
				
				// Valida se ainda é válido
				const isValid = await validateNumber(storedNumber)
				
				if (isValid) {
					console.log('Número ainda válido, reutilizando')
					myNumber.value = storedNumber
					return storedNumber
				} else {
					console.log('Número expirado, gerando novo')
					clearLocalStorage()
				}
			}

			// Gera novo número
			console.log('Gerando novo número...')
			const newNumber = await generateUniqueNumber()
			
			myNumber.value = newNumber
			saveToLocalStorage(newNumber)
			
			console.log('Novo número gerado:', newNumber)
			return newNumber

		} catch (err) {
			console.error('Erro ao inicializar número:', err)
			error.value = err.message
			throw err
		} finally {
			isLoading.value = false
		}
	}

  /**
   * Atualiza o status online do número
   */
	const setOnlineStatus = async (isOnline, peerId = null) => {
		if (!myNumber.value) {
			throw new Error('Número não inicializado')
		}

		const updateData = {
			is_online: isOnline,
			last_seen: new Date().toISOString()
		}

		if (peerId) {
			updateData.peer_id = peerId
		}

		const { error: updateError } = await $supabase
		.from('temporary_numbers')
		.update(updateData)
		.eq('number', myNumber.value)

		if (updateError) {
			console.error('Erro ao atualizar status:', updateError)
			throw updateError
		}

		console.log(`Status atualizado: ${isOnline ? 'online' : 'offline'}`)
	}

  /**
   * Atualiza o heartbeat (last_seen)
   */
	const updateHeartbeat = async () => {
		if (!myNumber.value) return

		const { error: updateError } = await $supabase
		.from('temporary_numbers')
		.update({ last_seen: new Date().toISOString() })
		.eq('number', myNumber.value)

		if (updateError) {
			console.error('Erro ao atualizar heartbeat:', updateError)
		}
	}

	const setBusyStatus = async (isBusy, busyWith = null) => {
		if (!myNumber.value) throw new Error('Número não inicializado')

		const updateData = {
			is_busy: isBusy,
			busy_with: isBusy ? busyWith : null,
			last_seen: new Date().toISOString(),
		}

		const { error: updateError } = await $supabase
			.from('temporary_numbers')
			.update(updateData)
			.eq('number', myNumber.value)

		if (updateError) throw updateError
	}

	return {
		myNumber,
		isLoading,
		error,
		initializeNumber,
		setBusyStatus,
		setOnlineStatus,
		updateHeartbeat,
		clearLocalStorage
	}
}