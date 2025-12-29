<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const isOnline = ref(false)
const isCall = ref(false)
const currentDial = ref(null)
const isDial = ref(false)
const dialedNumber = ref('')
const maxDigits = 5
const messageText = ref('')
const messagesContainer = ref(null) // 📜 Ref para o container de mensagens

const { numbers: liveBips, subscribe: subscribeLiveBips } = useLiveAvailableNumbers()

const { 
	myNumber, 
	isLoading, 
	error, 
	initializeNumber, 
	setOnlineStatus,
	setBusyStatus,
	updateHeartbeat 
} = useTemporaryNumber()

const {
	playClickSound,
	playPulseSound,
	playRingSound,
	playBusySound,
	playConnectSound,
	playHangupSound,
	playMessageSound,
	toggleMute,
	isMuted
} = useSounds()

const {
	peer,
	callState,
	connectedPeer,
	messages,
	initializePeer,
	call: makeCall,
	sendMessage,
	hangUp,
	destroyPeer
} = usePeerConnection()

let heartbeatInterval = null

// 📜 Função para scroll automático
const scrollToBottom = () => {
	nextTick(() => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
		}
	})
}

const variantCaller = computed(() => {
	if (!isOnline.value) return 'default'
	if (callState.value === 'connected') return 'minimal'
	if (isCall.value) return 'compact'
	return 'minimal'
})

const variantCallee = computed(() => {
	if (callState.value === 'connected') return 'minimal'
	if (isCall.value) return 'compact'
	return 'minimal'
})

const displayNumber = computed(() => {
	if (!dialedNumber.value) return '-----'
	return dialedNumber.value.padEnd(maxDigits, '-')
})

const statusText = computed(() => {
	switch (callState.value) {
		case 'calling':
			return `Chamando ${dialedNumber.value}...`
		case 'connected':
			return `Em chamada com ${connectedPeer.value}`
		case 'incoming':
			return 'Chamada recebida...'
		case 'unavailable':
			document.querySelector('body').classList.add('unavailable')
			setTimeout(() => {
				isCall.value = false
				dialedNumber.value = ''
				currentDial.value = null
				document.querySelector('body').classList.remove('unavailable')
			}, 500)
			return 'Número indisponível'
		case 'connect-close':
			document.querySelector('body').classList.add('unavailable')
			document.querySelector('body').classList.remove('connect')
			setTimeout(() => {
				isCall.value = false
				dialedNumber.value = ''
				currentDial.value = null
				document.querySelector('body').classList.remove('unavailable')
			}, 500)
			return 'Chamada encerrada'
		default:
			return 'Conectando...'
	}
})

const toggleOnline = async () => {
	isOnline.value = !isOnline.value

	if (isOnline.value) {
		try {
			await initializePeer(myNumber.value)
			console.log('Peer inicializado:', myNumber.value)
			
			await setOnlineStatus(true, myNumber.value)
			console.log('Status: ONLINE')
			
			heartbeatInterval = setInterval(() => {
				updateHeartbeat()
			}, 30000)
			
			isDial.value = true
		} catch (err) {
			console.error('Erro ao ficar online:', err)
			isOnline.value = false
		}
	} else {
		try {
			destroyPeer()
			await setBusyStatus(false)
			await setOnlineStatus(false)
			console.log('Status: OFFLINE')
			
			if (heartbeatInterval) {
				clearInterval(heartbeatInterval)
				heartbeatInterval = null
			}
			
			isDial.value = false
			isCall.value = false
			dialedNumber.value = ''
			currentDial.value = null
		} catch (err) {
			console.error('Erro ao ficar offline:', err)
		}
	}
}

const handleNumber = (number) => {
	currentDial.value = number
	playClickSound()

	if (dialedNumber.value.length < maxDigits) {
		dialedNumber.value += number
		console.log('Número atual:', dialedNumber.value)
		
		if (dialedNumber.value.length === maxDigits) {
			isCall.value = true
			console.log('Número completo:', dialedNumber.value)
			playRingSound()
			makeCall(dialedNumber.value)
		}
	}
}

const resetNumber = () => {
	dialedNumber.value = ''
	currentDial.value = null
	isCall.value = false
	hangUp()
	playHangupSound()
}

const sendChatMessage = () => {
	if (messageText.value.trim()) {
		sendMessage(messageText.value.trim())
		messageText.value = ''
		scrollToBottom() // 📜 Scroll após enviar
	}
}

const filteredLiveBips = computed(() => {
	if (!myNumber.value) return liveBips.value
	return liveBips.value.filter(bip => bip !== myNumber.value)
})

const logout = async () => {
	try {
		await setBusyStatus(false)
		await setOnlineStatus(false)
	} finally {
		destroyPeer()
		isOnline.value = false
		isCall.value = false
		isDial.value = false
	}
}

watch(callState, async (state) => {
	const busyStates = new Set(['calling', 'incoming', 'connected'])

	try {
		if (busyStates.has(state)) {
			await setBusyStatus(true, connectedPeer.value || dialedNumber.value || null)
		} else {
			await setBusyStatus(false)
		}
	} catch (e) {
		console.error('Erro ao atualizar busy:', e)
	}

	// 📜 Scroll ao conectar
	if (state === 'connected') {
		scrollToBottom()
	}
})

// 📜 Watch para mensagens - scroll automático
watch(() => messages.value.length, (newLength, oldLength) => {
	if (newLength > oldLength) {
		const lastMessage = messages.value[newLength - 1]
		if (lastMessage.type === 'received') {
			playMessageSound()
		}
		scrollToBottom() // 📜 Scroll para cada nova mensagem
	}
})

watch(callState, (newState) => {
	switch (newState) {
		case 'connected':
			playConnectSound()
			break
		case 'unavailable':
			playBusySound()
			break
		case 'connect-close':
			playHangupSound()
			break
		case 'incoming':
			playRingSound()
			break
	}
})

const handleUnload = () => {
	try {
		setBusyStatus(false)
		setOnlineStatus(false)
	} catch (e) {}
}

onMounted(async () => {
	window.addEventListener('beforeunload', handleUnload)

	try {
		await initializeNumber()
		await subscribeLiveBips()
		console.log('Meu número:', myNumber.value)
	} catch (err) {
		console.error('Erro ao inicializar número:', err)
	}
})

onUnmounted(async () => {
	window.removeEventListener('beforeunload', handleUnload)

	if (heartbeatInterval) {
		clearInterval(heartbeatInterval)
	}
	
	if (isOnline.value) {
		try {
			await setOnlineStatus(false)
			destroyPeer()
		} catch (err) {
			console.error('Erro ao desmontar:', err)
		}
	}
})
</script>

<template lang="pug">
	transition(name="motion-start")
		#start(v-if="!isOnline")
			section.intro
				.column
					h2.title Seu número está no cartão
					.divider
					p.description Este é o seu bip. Ele dura 24 horas ou enquanto esta aba estiver aberta.
				.column
					h2.title Comunicação P2P de verdade
					.divider
					p.description Não existe servidor intermediando a conversa. Quando alguém te chama, a comunicação acontece direto de um computador para o outro.
			section.terms
				p.text Ao ficar online, você aceita os termos do chatbip.
				p.text.text-mobile Esse é o seu bip temporário. Ele fica ativo por até 24 horas ou enquanto esta aba estiver aberta.
				p.text.text-mobile A conversa acontece direto entre dois dispositivos. Não existe servidor intermediando a chamada.
	
	#dial(v-if="isDial && !isCall && callState != 'connected'")
		dial(@number-dialed="handleNumber")

		.list-live
			.bips
				span.bip(v-for="bip in filteredLiveBips" :key="bip") {{ bip }}
			.footer
				span.label Online
				span.text {{ (liveBips.length - 1) <= 0 ? 0 : (liveBips.length - 1) }}
	
	//- Chat quando conectado
	#chat(v-if="callState === 'connected'")
		.container-chat
			.messages(ref="messagesContainer")
				.message(
					v-for="(msg, index) in messages",
					:key="index",
					:class="msg.type"
				)
					span {{ msg.text }}
					span.time {{ new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
			.input-row
				input.message-input(
					v-model="messageText",
					@keypress.enter="sendChatMessage",
					placeholder="Digite sua mensagem..."
				)
				button.send-btn(@click="sendChatMessage") Enviar
	
	card-number(
		:class="[{ 'is-online': isOnline, 'is-call': isCall }, callState]",
		:loading="true",
		:variant="variantCaller",
		:number="myNumber"
	)
		template(#footer, v-if="!isOnline")
			button.btn(@click="toggleOnline", :class="{'disable': isLoading}") {{isLoading ? 'Aguarde...' : 'Ficar online'}}
		template(#action, v-if="isOnline && !isCall")
			button.btn-circle.icon-logout(@click="logout")
		template(#action, v-if="callState == 'connected'")
			button.btn-circle.icon-end(@click="resetNumber")
	
	span.text-loading(v-if="isCall && callState != 'connected'") {{ statusText }}
	
	transition(name="slide-up")
		card-number(
			v-if="isOnline",
			:number="connectedPeer || displayNumber",
			:class="[{ 'is-online': isOnline, 'is-call': isCall}, callState]",
			:variant="variantCallee",
			type="calle"
		)
</template>

<style scoped>
	.text-loading{
		width: 100%;
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: auto;
		color: var(--color-cream-medium);
		font-size: 1rem;
	}
	
	#chat {
		width: 100%;
		height: 100vh;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background-color: var(--color-blue);
		overflow: hidden; /* 📜 Previne scroll da página */
		
		.container-chat{
			width: 100%;
			height: 100%;
			max-width: 500px;
			margin: 0 auto;
			display: flex;
			padding: 1rem;
			gap: 1rem;
			flex-direction: column;
			justify-content: flex-end;
			overflow: hidden; /* 📜 Previne scroll no container */
		}

		.messages {
			overflow-y: auto; /* 📜 Scroll apenas aqui */
			overflow-x: hidden;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			padding-right: 0.25rem; /* 📜 Espaço para scrollbar */

			/* 📜 Scrollbar customizada */
			&::-webkit-scrollbar {
				width: 6px;
			}
			
			&::-webkit-scrollbar-track {
				background: rgba(255, 255, 255, 0.1);
			}
			
			&::-webkit-scrollbar-thumb {
				background: var(--color-cream-medium);
				border-radius: 3px;
				
				&:hover {
					background: var(--color-cream-light);
				}
			}
		}
		
		.message {
			padding: 0.75rem;
			max-width: 70%;
			word-break: break-word;
			flex-shrink: 0; /* 📜 Previne compressão */
		}
		
		.time{
			font-size: .75rem;
			margin-left: .25rem;
			opacity: .5;
		}
		
		.message.sent {
			background: var(--color-white);
			color: var(--color-black);
			border: 2px solid var(--color-black);
			align-self: flex-end;
		}
		
		.message.received {
			background: rgba(255, 255, 255, .2);
			color: var(--color-white);
			align-self: flex-start;
		}
		
		.message.system {
			background: transparent;
			color: var(--color-cream-medium);
			font-size: 0.875rem;
			text-align: center;
			align-self: center;
		}
		
		.input-row {
			display: flex;
			gap: 0.5rem;
			flex-shrink: 0; /* 📜 Mantém input sempre visível */
		}
		
		.message-input {
			flex: 1;
			border: 2px solid var(--color-black);
			padding: 1rem;
			background-color: transparent;
			color: var(--color-cream-light);
			font-size: 1rem;
		}
		
		.message-input::placeholder {
			color: var(--color-cream-medium);
			opacity: 0.8;
		}
		
		.send-btn {
			background: var(--color-black);
			color: var(--color-white);
			border: none;
			padding: 0.75rem 1.5rem;
			cursor: pointer;
			font-size: 1rem;
			transition: opacity 0.2s;
		}
		
		.send-btn:hover {
			background-color: var(--color-white);
			color: var(--color-black);
		}
	}
	
	.card-number{
		&.unavailable,
		&.connect-close{
			opacity: .4;
		}

		.btn{
			&.disable{
				pointer-events: none;
				opacity: .3;
			}
		}
		
		&.card-number--caller{
			position: absolute;
			top: 50%;
			right: 0;
			left: 0;
			transform: translateY(-50%);
			margin: auto;
			height: fit-content;
			
			&.is-online{
				top: .5rem;
				transform: translateY(0);
			}
			
			&.is-call{
				top: 50%;
				transform: translateY(-115%);
			}
			
			&.connected{
				top: .5rem;
				transform: translateY(0);
				border-bottom-left-radius: 4px;
				border-bottom-right-radius: 4px;
			}
		}
		
		&.card-number--calle{
			position: absolute;
			bottom: .5rem;
			right: 0;
			left: 0;
			margin: auto;
			height: fit-content;

			&.is-call{
				bottom: 50%;
				transform: translateY(115%);
			}

			&.connected{
				bottom: auto;
				transform: translateY(130%);
				border-top-left-radius: 4px;
				border-top-right-radius: 4px;
			}
			
			&.slide-up-enter-active {
				transition: transform 0.3s .3s cubic-bezier(0.4, 0, 0.2, 1);
			}

			&.slide-up-leave-active {
				transition: transform 0.3s .3s cubic-bezier(0.4, 0, 1, 1);
			}

			&.slide-up-enter-from {
				transform: translateY(120%);
			}

			&.slide-up-enter-to {
				transform: translateY(0);
			}

			&.slide-up-leave-from {
				transform: translateY(0);
			}

			&.slide-up-leave-to {
				transform: translateY(120%);
			}
		}
	}

	#start{
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background-color: var(--color-black);

		@media (min-width: 375px) and (max-width: 639px) {
			background-color: var(--color-red);
		}

		&.motion-start-leave-active {
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

			.intro {
				transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			}

			.column{
				transition: opacity 0.3s ease-out;
			}

			.terms{
				transition: opacity 0.3s ease-out 0.1s;
			}
		}

		&.motion-start-leave-to {
			.intro{
				height: 100vh !important;
			}

			.column,
			.terms{
				opacity: 0;
			}
		}

		.terms{
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			padding: 1rem;
			gap: 1rem;

			.text{
				font-size: 1rem;
				color: var(--color-cream-light);
			}

			.text-mobile{
				display: none;
			}

			@media (min-width: 375px) and (max-width: 639px) {
				.text{
					display: none;
				}
				.text-mobile{
					display: block;
				}
			}
		}

		.intro{
			display: flex;
			align-items: center;
			width: 100%;
			gap: 20rem;
			height: 45vh;
			padding: 2.5rem 6rem;
			background-color: var(--color-red);

			@media (min-width: 375px) and (max-width: 639px) {
				display: none;
			}
			
			.column{
				display: flex;
				flex-direction: column;
				align-items: center;
				text-align: center;
				width: 100%;
				gap: 1rem;
				color: var(--color-cream-light);
				transition: all .2s;

				.divider{
					width: 40%;
					height: 1px;
					opacity: .3;
					background-color: var(--color-cream-light);
				}

				.title{
					font-size: 2rem;
				}

				.description{
					font-size: 1rem;
					line-height: 125%;
				}
			}
		}
	}

	#dial{
		width: 100%;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 2.5rem;

		.list-live{
			position: absolute;
			height: 100%;
			width: 13rem;
			display: flex;
			flex-direction: column;
			right: 0;
			padding: 1rem 2rem;

			.footer{
				width: 100%;
				display: flex;
				justify-content: space-between;
				border-top: 1px solid rgba(255, 255, 255, .10);
				padding-top: 1rem;
				color: var(--color-cream-light);
			}

			.bips{
				position: relative;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: flex-end;
				flex: 1;
				overflow: auto;

				.bip{
					font-size: 2rem;
					font-family: 'ocr';
					color: var(--color-cream-light);
				}

				&::before{
					content: "";
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 25%;
					background: linear-gradient(180deg, #C3462B 0%, rgba(195, 70, 43, 0.00) 100%);
				}

				&::after{
					content: "";
					position: absolute;
					bottom: 0;
					left: 0;
					width: 100%;
					height: 25%;
					background: linear-gradient(180deg, rgba(195, 70, 43, 0.00) 0%, #C3462B 100%);
				}
			}

			@media (min-width: 375px) and (max-width: 639px) {
				position: relative;
				width: 100%;
				padding: 1rem;

				.bips{
					width: 100%;
					flex: none;
					flex-direction: row;

					.bip{
						&::after{
							content: ","
						}

						&:last-child{
							&::after{
								display: none;
							}
						}
					}
				}
			}
		}
	}
</style>