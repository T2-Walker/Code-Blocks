import { storeToRefs } from 'pinia'
import { useVariablesStore } from '@/stores/variablesStore'

export function useVariables() {
  const store = useVariablesStore()
  const { variables, variableTypes } = storeToRefs(store)

  return {
    variables,
    variableTypes,
    isNameUnique: store.isNameUnique.bind(store),
    upsertVariable: store.upsertVariable.bind(store),
    getVariableByName: store.getVariableByName.bind(store),
    deleteVariableByName: store.deleteVariableByName.bind(store),
  }
}