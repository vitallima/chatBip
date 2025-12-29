// composables/usePeerConnection.js
import { ref, onUnmounted } from 'vue'
import Peer from 'peerjs'

export const usePeerConnection = () => {
	const peer = ref(null)
	const connection = ref(null)
	const callState = ref('idle') // idle, dialing, calling, connected, unavailable
	const connectedPeer = ref(null)
	const myPeerId = ref(null) // ID do peer atual (seu número)
	const messages = ref([])

	/**
	 * Inicializa o peer com o número do usuário
	 */
	const initializePeer = (myNumber, retryCount = 0) => {
		return new Promise((resolve, reject) => {
			try {
				// Se tiver retry, adiciona sufixo
				const peerId = retryCount > 0 ? `${myNumber}-${retryCount}` : myNumber
				
				peer.value = new Peer(peerId, {
					debug: 1,
					config: {
						iceServers: [
							{ urls: 'stun:stun.l.google.com:19302' },
							{ urls: 'stun:stun1.l.google.com:19302' }
						]
					}
				})

				peer.value.on('open', (id) => {
					console.log('Peer conectado com ID:', id)
					myPeerId.value = id // Armazena o ID
					resolve(id)
				})

				peer.value.on('error', (err) => {
					console.error('Erro no Peer:', err)
					
					// Se o ID está ocupado, tenta novamente com sufixo
					if (err.type === 'unavailable-id' && retryCount < 5) {
						console.log(`ID ocupado, tentando com sufixo... (tentativa ${retryCount + 1})`)
						
						// Destroi o peer atual
						if (peer.value) {
							peer.value.destroy()
							peer.value = null
						}
						
						// Tenta novamente após 1 segundo
						setTimeout(() => {
							initializePeer(myNumber, retryCount + 1)
								.then(resolve)
								.catch(reject)
						}, 1000)
					} else {
						reject(err)
					}
				})

				// Recebe conexão de entrada
				peer.value.on('connection', (conn) => {
					console.log('Conexão recebida de:', conn.peer)
					handleIncomingConnection(conn)
				})

			} catch (err) {
				reject(err)
			}
		})
	}

	/**
	 * Lida com conexão de entrada (quando alguém liga para você)
	 */
	const handleIncomingConnection = (conn) => {
		connection.value = conn
		connectedPeer.value = conn.peer
		callState.value = 'incoming'

		conn.on('open', () => {
			console.log('Conexão estabelecida com:', conn.peer)
			callState.value = 'connected'
			addSystemMessage(`Conectado com ${conn.peer}`)
		})

		conn.on('data', (data) => {
			if (data.type === 'message') {
				addReceivedMessage(data.text)
			}
		})

		conn.on('close', () => {
			console.log('Conexão fechada')
			resetCall()
		})

		conn.on('error', (err) => {
			console.error('Erro na conexão:', err)
			resetCall()
		})
	}

	/**
	 * Inicia uma chamada para outro peer
	 */
	const call = (targetNumber) => {
		if (!peer.value) {
			console.error('Peer não inicializado')
			return
		}

		callState.value = 'calling'
		connectedPeer.value = targetNumber

		console.log('Chamando:', targetNumber)

		try {
			connection.value = peer.value.connect(targetNumber, {
				reliable: true,
				serialization: 'json'
			})

			connection.value.on('open', () => {
				console.log('Conexão estabelecida!')
				callState.value = 'connected'
				addSystemMessage(`Conectado com ${targetNumber}`)
			})

			connection.value.on('data', (data) => {
				if (data.type === 'message') {
					addReceivedMessage(data.text)
				}
			})

			connection.value.on('close', () => {
				console.log('Conexão fechada')
				callState.value = 'connect-close'
				setTimeout(() => {
					resetCall()
				}, 1000)
			})

			connection.value.on('error', (err) => {
				console.error('Erro na conexão:', err)
				callState.value = 'unavailable'
				
				setTimeout(() => {
					resetCall()
				}, 1000)
			})

			// Timeout se não conectar em 10 segundos
			setTimeout(() => {
				if (callState.value === 'calling') {
					console.log('Timeout na chamada')
					callState.value = 'unavailable'
					
					setTimeout(() => {
						resetCall()
					}, 1000)
				}
			}, 5000) // Voltei para 10s

		} catch (err) {
			console.error('Erro ao chamar:', err)
			callState.value = 'unavailable'
		}
	}

	/**
	 * Envia mensagem de texto
	 */
	const sendMessage = (text) => {
		if (!connection.value || !text.trim()) {
			console.error('Conexão não estabelecida ou mensagem vazia')
			return
		}

		try {
			connection.value.send({
				type: 'message',
				text: text.trim()
			})

			addSentMessage(text.trim())
			return true
		} catch (err) {
			console.error('Erro ao enviar mensagem:', err)
			return false
		}
	}

	/**
	 * Desliga a chamada
	 */
	const hangUp = () => {
		if (connection.value) {
			connection.value.close()
		}
		resetCall()
	}

	/**
	 * Reseta o estado da chamada
	 */
	const resetCall = () => {
		connection.value = null
		connectedPeer.value = null
		callState.value = 'idle'
		messages.value = []
	}

	/**
	 * Adiciona mensagem do sistema
	 */
	const addSystemMessage = (text) => {
		messages.value.push({
			type: 'system',
			text,
			timestamp: new Date()
		})
	}

	/**
	 * Adiciona mensagem enviada
	 */
	const addSentMessage = (text) => {
		messages.value.push({
			type: 'sent',
			text,
			timestamp: new Date()
		})
	}

	/**
	 * Adiciona mensagem recebida
	 */
	const addReceivedMessage = (text) => {
		messages.value.push({
			type: 'received',
			text,
			timestamp: new Date()
		})
	}

	/**
	 * Destroi a conexão peer
	 */
	const destroyPeer = () => {
		if (connection.value) {
			connection.value.close()
		}
		
		if (peer.value) {
			peer.value.destroy()
			peer.value = null
		}
		
		myPeerId.value = null // Limpa o ID
		resetCall()
	}

	// Cleanup ao desmontar
	onUnmounted(() => {
		destroyPeer()
	})

	return {
		// State
		peer,
		connection,
		callState,
		connectedPeer,
		myPeerId, // ✨ Expondo o ID do peer atual
		messages,

		// Methods
		initializePeer,
		call,
		sendMessage,
		hangUp,
		resetCall,
		destroyPeer
	}
}