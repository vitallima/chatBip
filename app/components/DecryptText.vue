<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'

const props = defineProps({
	text: {
		type: String,
		default: ''
	},
	duration: {
		type: Number,
		default: 1500
	},
	autoStart: {
		type: Boolean,
		default: true
	},
	placeholderLength: {
		type: Number,
		default: 5
	}
})

const displayText = ref(props.text || '-----') // Valor inicial para SSR
const isMounted = ref(false) // Flag para saber se está no cliente
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
let decryptInterval = null
let randomInterval = null

const generateRandomText = (length) => {
	return Array.from({ length }, () => 
		characters[Math.floor(Math.random() * characters.length)]
	).join('')
}

const startRandomAnimation = () => {
	stopRandomAnimation()
	
	randomInterval = setInterval(() => {
		displayText.value = generateRandomText(props.placeholderLength)
	}, 100)
}

const stopRandomAnimation = () => {
	if (randomInterval) {
		clearInterval(randomInterval)
		randomInterval = null
	}
}

const startDecrypt = () => {
	stopRandomAnimation()
	
	if (decryptInterval) {
		clearInterval(decryptInterval)
	}
	
	const revealDelay = 40
	const iterations = Math.floor(props.duration / revealDelay)
	let currentIteration = 0
	
	decryptInterval = setInterval(() => {
		displayText.value = props.text.split('').map((char, index) => {
			const revealAt = (index / props.text.length) * iterations
			
			if (currentIteration >= revealAt) {
				return char
			}
			
			return characters[Math.floor(Math.random() * characters.length)]
		}).join('')
		
		currentIteration++
		
		if (currentIteration >= iterations) {
			clearInterval(decryptInterval)
			decryptInterval = null
			displayText.value = props.text
		}
	}, revealDelay)
}

watch(() => props.text, (newText) => {
	// Só anima se estiver no cliente
	if (!isMounted.value) return
	
	if (!newText || newText === '' || newText === '-----') {
		startRandomAnimation()
	} else {
		startDecrypt()
	}
})

onMounted(() => {
	isMounted.value = true
	
	if (props.autoStart) {
		if (!props.text || props.text === '' || props.text === '-----') {
			startRandomAnimation()
		} else {
			startDecrypt()
		}
	}
})

onUnmounted(() => {
	stopRandomAnimation()
	if (decryptInterval) {
		clearInterval(decryptInterval)
	}
})

defineExpose({ startDecrypt, startRandomAnimation })
</script>

<template lang="pug">
	span.decrypt-text {{ displayText }}
</template>

<style scoped>
.decrypt-text {
	font-family: 'ocr';
	font-size: 2.5rem;
	letter-spacing: 0.1em;
}
</style>