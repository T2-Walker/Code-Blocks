import { ref } from 'vue'

const terminalLines = ref([])
const isTerminalVisible = ref(true)
const terminalPosition = ref({ 
  x: window.innerWidth - 340, 
  y: window.innerHeight - 340 
})

export function useTerminal() {
  const addLine = (text, type = 'output') => {
  const timestamp = new Date().toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
  
  terminalLines.value.push({
    text: `[${timestamp}] ${text}`,
    type: type
  })
}
  
  const clearTerminal = () => {
    terminalLines.value = []
    addLine('Терминал очищен', 'success')
  }
  
  const hideTerminal = () => {
    isTerminalVisible.value = false
  }
  
  const showTerminal = () => {
    isTerminalVisible.value = true
  }
  
  const toggleTerminal = () => {
    isTerminalVisible.value = !isTerminalVisible.value
  }
  
  const updatePosition = (newPosition) => {
    terminalPosition.value = newPosition
  }
  
  return {
    terminalLines,
    isTerminalVisible,
    terminalPosition,
    addLine,
    clearTerminal,
    hideTerminal,
    showTerminal,
    toggleTerminal,
    updatePosition
  }
}