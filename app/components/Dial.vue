<script setup>
	import { computed, ref } from 'vue'
	
	const props = defineProps({
		numbers: {
			type: Array,
			default: () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
		},
		radius: {
			type: Number,
			default: 160
		}
	})

	const emit = defineEmits(['number-dialed'])

	const rotation = ref(0)
	const isDragging = ref(false)
	const lastAngle = ref(0)
	const accumulatedRotation = ref(0) // Rotação acumulada
	const currentHoleIndex = ref(null)
	const dialedNumbers = ref([])
	const fingerStopHit = ref(false) // Para animação do finger stop

	const angleStep = 360 / (props.numbers.length + 1)

	const numberPositions = computed(() => {
		const total = props.numbers.length + 1
		
		return props.numbers.map((num, index) => {
			const rotationAngle = -(angleStep * (index + 1))
			
			return {
				number: num,
				style: {
					transform: `rotate(${rotationAngle}deg) translate(${props.radius}px) rotate(${-rotationAngle}deg)`
				}
			}
		})
	})

	const holePositions = computed(() => {
		const total = props.numbers.length + 1
		
		return Array.from({ length: total }, (_, index) => {
			const rotationAngle = -(angleStep * index)
			
			return {
				index,
				initialAngle: rotationAngle,
				style: {
					transform: `rotate(${rotationAngle}deg) translate(${props.radius}px) rotate(${-rotationAngle}deg)`
				}
			}
		})
	})

	// Normaliza diferença de ângulo para -180 a 180
	const normalizeAngleDelta = (delta) => {
		while (delta > 180) delta -= 360
		while (delta < -180) delta += 360
		return delta
	}

	// Calcula o ângulo entre o centro e o ponto do mouse
	const getAngleFromCenter = (event, element) => {
		const rect = element.getBoundingClientRect()
		const centerX = rect.left + rect.width / 2
		const centerY = rect.top + rect.height / 2
		const deltaX = event.clientX - centerX
		const deltaY = event.clientY - centerY
		return Math.atan2(deltaY, deltaX) * (180 / Math.PI)
	}

	const onHoleMouseDown = (event, holeIndex) => {
		if (holeIndex === 0) return // Não pode arrastar o hole do finger stop
		
		event.preventDefault() // Previne comportamento padrão do touch
		
		isDragging.value = true
		currentHoleIndex.value = holeIndex
		
		const dialElement = event.currentTarget.closest('.rotary-dial')
		
		// Detecta se é touch ou mouse
		const clientX = event.touches ? event.touches[0].clientX : event.clientX
		const clientY = event.touches ? event.touches[0].clientY : event.clientY
		
		lastAngle.value = getAngleFromCenterWithCoords(clientX, clientY, dialElement)
		accumulatedRotation.value = rotation.value
		
		// Adiciona listeners para mouse e touch
		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener('mouseup', onMouseUp)
		document.addEventListener('touchmove', onTouchMove, { passive: false })
		document.addEventListener('touchend', onTouchEnd)
	}
	
	// Nova função para calcular ângulo com coordenadas
	const getAngleFromCenterWithCoords = (clientX, clientY, element) => {
		const rect = element.getBoundingClientRect()
		const centerX = rect.left + rect.width / 2
		const centerY = rect.top + rect.height / 2
		const deltaX = clientX - centerX
		const deltaY = clientY - centerY
		return Math.atan2(deltaY, deltaX) * (180 / Math.PI)
	}

	const onMouseMove = (event) => {
		if (!isDragging.value) return
		
		const dialElement = document.querySelector('.rotary-dial')
		const currentAngle = getAngleFromCenter(event, dialElement)
		const delta = normalizeAngleDelta(currentAngle - lastAngle.value)
		lastAngle.value = currentAngle
		
		// Atualiza rotação acumulada com o delta
		let newRotation = accumulatedRotation.value + delta
		
		// Limita entre 0 e o máximo permitido
		newRotation = Math.max(0, newRotation)
		
		const holeInitialAngle = holePositions.value[currentHoleIndex.value].initialAngle
		const maxRotation = Math.abs(holeInitialAngle)
		const limitedRotation = Math.min(newRotation, maxRotation)
		
		// Detecta quando bate no limite (finger stop)
		if (newRotation >= maxRotation && !fingerStopHit.value) {
			fingerStopHit.value = true
			setTimeout(() => {
				fingerStopHit.value = false
			}, 200) // Duração da animação
		}
		
		accumulatedRotation.value = limitedRotation
		rotation.value = limitedRotation
	}
	
	const onTouchMove = (event) => {
		if (!isDragging.value) return
		
		event.preventDefault() // Previne scroll durante drag
		
		const dialElement = document.querySelector('.rotary-dial')
		const touch = event.touches[0]
		const currentAngle = getAngleFromCenterWithCoords(touch.clientX, touch.clientY, dialElement)
		const delta = normalizeAngleDelta(currentAngle - lastAngle.value)
		lastAngle.value = currentAngle
		
		// Atualiza rotação acumulada com o delta
		let newRotation = accumulatedRotation.value + delta
		
		// Limita entre 0 e o máximo permitido
		newRotation = Math.max(0, newRotation)
		
		const holeInitialAngle = holePositions.value[currentHoleIndex.value].initialAngle
		const maxRotation = Math.abs(holeInitialAngle)
		const limitedRotation = Math.min(newRotation, maxRotation)
		
		// Detecta quando bate no limite (finger stop)
		if (newRotation >= maxRotation && !fingerStopHit.value) {
			fingerStopHit.value = true
			setTimeout(() => {
				fingerStopHit.value = false
			}, 200)
		}
		
		accumulatedRotation.value = limitedRotation
		rotation.value = limitedRotation
	}

	const onMouseUp = () => {
		if (!isDragging.value) return
		
		// Verifica se chegou perto do finger stop (85% do caminho)
		const holeInitialAngle = holePositions.value[currentHoleIndex.value].initialAngle
		const maxRotation = Math.abs(holeInitialAngle)
		
		// Se chegou em 85% ou mais do caminho, registra o número
		if (maxRotation !== 0 && rotation.value / maxRotation > 0.85) {
			const numberIndex = currentHoleIndex.value - 1
			const dialedNumber = props.numbers[numberIndex]
			dialedNumbers.value.push(dialedNumber)
			emit('number-dialed', dialedNumber)
			console.log('Número discado:', dialedNumber)
		}
		
		// Reset da rotação
		rotation.value = 0
		accumulatedRotation.value = 0
		isDragging.value = false
		currentHoleIndex.value = null
		
		// Remove todos os listeners
		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
		document.removeEventListener('touchmove', onTouchMove)
		document.removeEventListener('touchend', onTouchEnd)
	}
	
	const onTouchEnd = () => {
		onMouseUp() // Usa a mesma lógica de mouseup
	}
</script>

<template lang="pug">
	.rotary-dial
		//- Camada de trás (fixa) - Números
		.numbers-layer
			.center-circle
			.numbers
				.number-item(
					v-for="(item, index) in numberPositions",
					:key="index",
					:style="item.style",
					:class="{ 'number--dragging': isDragging && currentHoleIndex === index + 1 }"
				) {{ item.number }}
		
		//- Camada de cima (rotacionável) - Overlay
		.dial-overlay(
			:style="{ transform: `rotate(${rotation}deg)` }",
			:class="{ 'is-dragging': isDragging }"
		)
			.holes
				.hole(
					v-for="(hole, index) in holePositions",
					:key="index",
					:style="hole.style",
					:class="{ 'hole--stop': index === 0, 'hole--dragging': isDragging && currentHoleIndex === index }",
					@mousedown="onHoleMouseDown($event, hole.index)",
					@touchstart="onHoleMouseDown($event, hole.index)"
				)
		
		//- Finger stop (fixo, não rotaciona)
		.finger-stop(:class="{ 'finger-stop--hit': fingerStopHit }")
</template>

<style scoped>
	.rotary-dial {
		width: 25rem;
		height: 25rem;
		border-radius: 999px;
		position: relative;
		touch-action: none; /* Previne gestos padrão do navegador */
	}

	/* Camada de números (atrás, fixa) */
	.numbers-layer {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 1;
	}

	.center-circle {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10rem;
		height: 10rem;
		border-radius: 999px;
		border: 2px solid var(--color-cream-light);
	}

	.numbers {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
	}

	.number-item {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 5rem;
		height: 5rem;
		margin-left: -2.5rem;
		margin-top: -2.5rem;
		
		display: flex;
		align-items: center;
		justify-content: center;
		
		background: var(--color-red);
		border-radius: 50%;
		
		color: var(--color-cream-medium);
		font-size: 1.75rem;
		font-family: 'ocr';
		text-shadow: 0 2px 1px rgba(0, 0, 0, 0.20);
		font-weight: 600;
		
		user-select: none;
		pointer-events: none;
	}

	/* Camada overlay (cima, rotacionável) */
	.dial-overlay {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 2;
		transition: transform 0.3s ease-out;
		cursor: grab;
	}
	
	/* Remove transição durante drag */
	.dial-overlay.is-dragging {
		transition: none;
	}

	.dial-overlay:active {
		cursor: grabbing;
	}

	.holes {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
	}

	.hole {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 5rem;
		height: 5rem;
		margin-left: -2.5rem;
		margin-top: -2.5rem;
		border-radius: 50%;
		
		background: transparent;
		border: 2px solid var(--color-cream-light);
		box-shadow: 0 8px 2px 2px rgba(0, 0, 0, 0.20) inset;
		cursor: grab;
	}
	
	.hole:active {
		cursor: grabbing;
	}

	.hole--stop {
		border: none;
		box-shadow: none;
		cursor: default;
	}
	
	.hole--dragging {
		border-color: var(--color-blue);
		border-width: 3px;
		box-shadow: 0 0 0 2px rgba(43, 66, 195, 0.3), 0 8px 2px 2px rgba(0, 0, 0, 0.20) inset;
	}

	.number--dragging {
		transform: scale(1.1);
		box-shadow: 0 0 20px rgba(195, 70, 43, 0.6);
	}

	.finger-stop {
		position: absolute;
		top: 50%;
		right: 0;
		transform: translateY(-50%);
		z-index: 3;
		
		width: 5rem;
		height: 5rem;
		display: flex;
		align-items: center;
		
		pointer-events: none;
		transition: transform 0.1s ease-out;
	}
	
	.finger-stop--hit {
		animation: fingerTap 0.2s ease-out;
	}
	
	@keyframes fingerTap {
		0% {
			transform: translateY(-50%) translateX(0);
		}
		50% {
			transform: translateY(-50%) translateX(-8px);
		}
		100% {
			transform: translateY(-50%) translateX(0);
		}
	}
	
	.finger-stop::before {
		content: "";
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		margin: auto;
		width: 2rem;
		height: 2rem;
		mask-image: url('./images/stop-finger.svg');
		mask-size: contain;
		mask-repeat: no-repeat;
		background-color: var(--color-white);
		transition: background-color 0.1s ease;
	}
	
	.finger-stop--hit::before {
		background-color: var(--color-blue);
	}
</style>