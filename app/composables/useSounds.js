// composables/useSounds.js
import { ref } from 'vue'

export const useSounds = () => {
	const audioContext = ref(null)
	const isMuted = ref(false)

	/**
	 * Obtém ou cria o AudioContext
	 */
	const getAudioContext = () => {
		if (!audioContext.value) {
			audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
		}
		return audioContext.value
	}

	/**
	 * Som de click (ao começar a girar o discador)
	 */
	const playClickSound = () => {
		if (isMuted.value) return
		
		try {
			const ctx = getAudioContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()
			
			osc.connect(gain)
			gain.connect(ctx.destination)
			
			osc.frequency.value = 800
			osc.type = 'square'
			gain.gain.setValueAtTime(0.1, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
			
			osc.start(ctx.currentTime)
			osc.stop(ctx.currentTime + 0.05)
		} catch (err) {
			console.error('Erro ao tocar som de click:', err)
		}
	}

	/**
	 * Som de pulso (durante o retorno do discador)
	 */
	const playPulseSound = () => {
		if (isMuted.value) return
		
		try {
			const ctx = getAudioContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()
			
			osc.connect(gain)
			gain.connect(ctx.destination)
			
			osc.frequency.value = 440
			osc.type = 'sine'
			gain.gain.setValueAtTime(0.05, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
			
			osc.start(ctx.currentTime)
			osc.stop(ctx.currentTime + 0.02)
		} catch (err) {
			console.error('Erro ao tocar som de pulso:', err)
		}
	}

	/**
	 * Som de chamada (ring ring)
	 */
	const playRingSound = () => {
		if (isMuted.value) return
		
		try {
			const ctx = getAudioContext()
			
			// Dois rings
			[0, 0.5].forEach(delay => {
				const osc = ctx.createOscillator()
				const gain = ctx.createGain()
				
				osc.connect(gain)
				gain.connect(ctx.destination)
				
				osc.frequency.value = 440
				osc.type = 'sine'
				gain.gain.setValueAtTime(0.1, ctx.currentTime + delay)
				gain.gain.setValueAtTime(0, ctx.currentTime + delay + 0.4)
				
				osc.start(ctx.currentTime + delay)
				osc.stop(ctx.currentTime + delay + 0.4)
			})
		} catch (err) {
			console.error('Erro ao tocar som de ring:', err)
		}
	}

	/**
	 * Som de ocupado/indisponível
	 */
	const playBusySound = () => {
		if (isMuted.value) return
		
		try {
			const ctx = getAudioContext()
			
			// 4 beeps rápidos
			for (let i = 0; i < 4; i++) {
				const osc = ctx.createOscillator()
				const gain = ctx.createGain()
				
				osc.connect(gain)
				gain.connect(ctx.destination)
				
				osc.frequency.value = 480
				osc.type = 'sine'
				gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.5)
				gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.5 + 0.25)
				
				osc.start(ctx.currentTime + i * 0.5)
				osc.stop(ctx.currentTime + i * 0.5 + 0.25)
			}
		} catch (err) {
			console.error('Erro ao tocar som busy:', err)
		}
	}

	/**
	 * Som de conexão estabelecida
	 */
	const playConnectSound = () => {
		if (isMuted.value) return
		
		try {
			const ctx = getAudioContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()
			
			osc.connect(gain)
			gain.connect(ctx.destination)
			
			osc.frequency.value = 600
			osc.type = 'sine'
			gain.gain.setValueAtTime(0.1, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
			
			osc.start(ctx.currentTime)
			osc.stop(ctx.currentTime + 0.3)
		} catch (err) {
			console.error('Erro ao tocar som de conexão:', err)
		}
	}

	/**
	 * Som de desligar
	 */
	const playHangupSound = () => {
		if (isMuted.value) return
		
		try {
			const ctx = getAudioContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()
			
			osc.connect(gain)
			gain.connect(ctx.destination)
			
			osc.frequency.value = 300
			osc.type = 'sine'
			gain.gain.setValueAtTime(0.1, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
			
			osc.start(ctx.currentTime)
			osc.stop(ctx.currentTime + 0.2)
		} catch (err) {
			console.error('Erro ao tocar som de desligar:', err)
		}
	}

	/**
	 * Som de mensagem recebida
	 */
	const playMessageSound = () => {
		if (isMuted.value) return
		
		try {
			const ctx = getAudioContext()
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()
			
			osc.connect(gain)
			gain.connect(ctx.destination)
			
			osc.frequency.value = 800
			osc.type = 'sine'
			gain.gain.setValueAtTime(0.08, ctx.currentTime)
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
			
			osc.start(ctx.currentTime)
			osc.stop(ctx.currentTime + 0.1)
		} catch (err) {
			console.error('Erro ao tocar som de mensagem:', err)
		}
	}

	/**
	 * Toggle mute/unmute
	 */
	const toggleMute = () => {
		isMuted.value = !isMuted.value
		return isMuted.value
	}

	return {
		isMuted,
		playClickSound,
		playPulseSound,
		playRingSound,
		playBusySound,
		playConnectSound,
		playHangupSound,
		playMessageSound,
		toggleMute
	}
}