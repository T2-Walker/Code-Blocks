import { defineStore } from 'pinia'

export const useVariablesStore = defineStore('variables', {
  state: () => ({
    // типы переменных для выпадающего списка
    variableTypes: [
      { value: 'int', label: 'Целое число', color: '#66BB6A' },
      { value: 'string', label: 'Строка', color: '#42A5F5' },
      { value: 'boolean', label: 'Логическое', color: '#FFA726' },
      { value: 'array', label: 'Массив', color: '#AB47BC' },
    ],
    // единый стор переменных: ключ - уникальное имя
    variables: [],
  }),
  getters: {
    variableNames(state) {
      return state.variables.map((v) => v.name)
    },
  },
  actions: {
    isNameUnique(name, exceptName) {
      const trimmed = name.trim()
      if (!trimmed) return false
      return !this.variables.some(
        (v) => v.name === trimmed && (!exceptName || v.name !== exceptName),
      )
    },
    upsertVariable({ oldName, name, type, value }) {
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error('Имя переменной не может быть пустым')
      }

      // если имя меняется, проверяем уникальность
      if (!oldName || oldName !== trimmed) {
        if (!this.isNameUnique(trimmed)) {
          throw new Error('Переменная с таким именем уже существует')
        }
      }

      const existingIndex = this.variables.findIndex((v) => v.name === oldName)

      const typeInfo = this.variableTypes.find((t) => t.value === type)
      const color = typeInfo?.color || '#9C27B0'

      const payload = {
        name: trimmed,
        type,
        value,
        color,
      }

      if (existingIndex !== -1) {
        this.variables[existingIndex] = payload
      } else {
        this.variables.push(payload)
      }
    },
    getVariableByName(name) {
      if (!name) return undefined
      return this.variables.find((v) => v.name === name)
    },
    deleteVariableByName(name) {
      this.variables = this.variables.filter((v) => v.name !== name)
    },
  },
})

