import { ref } from 'vue'

const initialVariables = ref({})
const isExecuted = ref(false)

export function useExecutionState() {
  const saveInitialState = (variables) => {
    initialVariables.value = {}
    variables.forEach(v => {
      if (v.name) {
        initialVariables.value[v.name] = v.value
      }
    })
    console.log('Saved initial state:', initialVariables.value)
  }

  const restoreInitialState = (updateVariableFn) => {
    Object.entries(initialVariables.value).forEach(([name, value]) => {
      updateVariableFn(name, value)
    })
    isExecuted.value = false
    console.log('Restored initial state')
  }

  const setExecuted = () => {
    isExecuted.value = true
  }

  const resetExecution = () => {
    isExecuted.value = false
  }

  return {
    initialVariables,
    isExecuted,
    saveInitialState,
    restoreInitialState,
    setExecuted,
    resetExecution
  }
}