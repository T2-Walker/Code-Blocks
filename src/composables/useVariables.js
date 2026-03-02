import { storeToRefs } from 'pinia'
import { useVariablesStore } from '@/stores/variablesStore'

export function useVariables() {
  const store = useVariablesStore()
  const { variables, variableTypes } = storeToRefs(store)

  return {
    variables,
    variableTypes,

    isNameUnique: store.isNameUnique,
    upsertVariable: store.upsertVariable,
    getVariableByName: store.getVariableByName,
    deleteVariableByName: store.deleteVariableByName,
  }
}
