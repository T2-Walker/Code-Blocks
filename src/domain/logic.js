import { BLOCK_TYPES } from './blocks'

export function getDefaultVariableForBlock() {
  return {
    name: '',
    type: 'int',
    value: 0,
  }
}

export function validateVariableName(name, existingNames, allowEmpty = false) {
  const trimmed = name.trim()

  if (!trimmed) {
    if (allowEmpty) {
      return { ok: true, value: '' }
    }
    return { ok: false, error: 'Имя обязательно' }
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return {
      ok: false,
      error: 'Имя должно начинаться с буквы или _ и содержать только буквы, цифры и _',
    }
  }

  if (existingNames.includes(trimmed)) {
    return { ok: false, error: 'Переменная с таким именем уже существует' }
  }

  return { ok: true, value: trimmed }
}

export function validateAndNormalizeValue(type, raw) {
  switch (type) {
    case 'int': {
      if (raw === '' || raw === null || raw === undefined) {
        return { ok: false, error: 'Введите целое число' }
      }
      const n = Number(raw)
      if (!Number.isInteger(n)) {
        return { ok: false, error: 'Значение должно быть целым числом' }
      }
      return { ok: true, value: n }
    }
    case 'boolean': {
      if (typeof raw === 'boolean') {
        return { ok: true, value: raw }
      }
      const lower = String(raw).toLowerCase()
      if (lower === 'true') return { ok: true, value: true }
      if (lower === 'false') return { ok: true, value: false }
      return { ok: false, error: 'Значение должно быть true или false' }
    }
    case 'array': {
      if (Array.isArray(raw)) {
        return { ok: true, value: raw }
      }
      const str = String(raw)
      if (!str.trim()) return { ok: true, value: [] }
      const items = str
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
      return { ok: true, value: items }
    }
    case 'string':
    default:
      return { ok: true, value: String(raw ?? '') }
  }
}

export function formatVariableForDisplay(variable) {
  if (!variable) return { name: 'Новая переменная', type: 'int', value: '—' }

  const { name, type, value } = variable

  if (value === undefined || value === null) {
    return { name: name || 'Новая переменная', type, value: '—' }
  }

  switch (type) {
    case 'array':
      return {
        name: name || 'Новая переменная',
        type,
        value: Array.isArray(value) ? `[${value.join(', ')}]` : '[]',
      }
    case 'boolean':
      return { name: name || 'Новая переменная', type, value: value ? 'true' : 'false' }
    case 'string':
      return { name: name || 'Новая переменная', type, value: `"${value}"` }
    case 'int':
    default:
      return { name: name || 'Новая переменная', type, value: String(value) }
  }
}

export function createVariableBlockAtPosition(x, y) {
  const base = createBaseVariableBlock(x, y)
  const variableDefaults = getDefaultVariableForBlock()

  return {
    ...base,
    variableName: variableDefaults.name,
    variableType: variableDefaults.type,
    variableValue: variableDefaults.value,
  }
}

function createBaseVariableBlock(x, y) {
  const type = BLOCK_TYPES.variable.type
  const config = BLOCK_TYPES[type]

  return {
    id: Date.now() + Math.random(),
    type: config.type,
    name: config.label,
    color: config.color,
    x: Math.round(x),
    y: Math.round(y),
  }
}

