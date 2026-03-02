<script setup>
import { ref, watch, nextTick, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  variable: {
    type: Object,
    default: () => ({ name: '', type: 'string', value: '' })
  },
  editing: Boolean,
  variableTypes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'close'])

const localVariable = ref({ ...props.variable })
const nameError = ref('')
const nameInput = ref(null)

const hintText = computed(() => {
  const hints = {
    string: 'Текстовое значение',
    number: 'Числовое значение (целое или дробное)',
    boolean: 'Логическое значение (true/false)',
    array: 'Введите элементы через запятую',
  }
  return hints[localVariable.value.type] || ''
})

const showHint = computed(() => {
  return ['array'].includes(localVariable.value.type)
})

const isValid = computed(() => {
  return localVariable.value.name.trim() && !nameError.value
})

watch(() => props.variable, (newVal) => {
  localVariable.value = { ...newVal }
  validateName()
}, { deep: true })

watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      nameInput.value?.focus()
    })
  }
})

// проверка имени
const validateName = () => {
  const name = localVariable.value.name.trim()

  if (!name) {
    nameError.value = 'Имя обязательно'
    return false
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    nameError.value = 'Имя должно начинаться с буквы или _ и содержать только буквы, цифры и _'
    return false
  }

  nameError.value = ''
  return true
}

// изменение типа переменной
const onTypeChange = () => {
  switch (localVariable.value.type) {
    case 'string':
      localVariable.value.value = ''
      break
    case 'number':
      localVariable.value.value = 0
      break
    case 'boolean':
      localVariable.value.value = true
      break
    case 'array':
      localVariable.value.value = ''
      break
  }
}

// это для массива, храним его как строку до того как сохраним
const parseArrayValue = () => {
}


const save = () => {
  if (!validateName()) return

  let processedValue = localVariable.value.value

  if (localVariable.value.type === 'array' && typeof processedValue === 'string') {
    processedValue = processedValue.split(',').map(item => item.trim()).filter(item => item)
  }

  emit('save', {
    ...localVariable.value,
    value: processedValue
  })
}

const handleClose = () => {
  nameError.value = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content" @keyup.esc="handleClose">
        <h3>{{ editing ? 'Редактировать переменную' : 'Новая переменная' }}</h3>

        <div class="form-group">
          <label for="var-name">Имя переменной:</label>
          <input
            id="var-name"
            v-model="localVariable.name"
            type="text"
            placeholder="например: userName, count, isActive"
            :class="{ error: nameError }"
            @input="validateName"
            @keyup.enter="save"
            ref="nameInput"
          />
          <span v-if="nameError" class="error-message">{{ nameError }}</span>
        </div>

        <div class="form-group">
          <label for="var-type">Тип данных:</label>
          <select id="var-type" v-model="localVariable.type" @change="onTypeChange">
            <option v-for="type in variableTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="var-value">Значение по умолчанию:</label>

          <!-- для строки -->
          <input
            v-if="localVariable.type === 'string'"
            id="var-value"
            v-model="localVariable.value"
            type="text"
            placeholder="текстовое значение"
          />

          <!-- для числа -->
          <input
            v-else-if="localVariable.type === 'number'"
            id="var-value"
            v-model.number="localVariable.value"
            type="number"
            placeholder="0"
            step="any"
          />

          <!-- для буль буля -->
          <select
            v-else-if="localVariable.type === 'boolean'"
            id="var-value"
            v-model="localVariable.value"
          >
            <option :value="true">true</option>
            <option :value="false">false</option>
          </select>

          <!-- для массива -->
          <input
            v-else-if="localVariable.type === 'array'"
            id="var-value"
            v-model="localVariable.value"
            type="text"
            placeholder="элемент1, элемент2, элемент3"
            @input="parseArrayValue"
          />
        </div>

        <div v-if="showHint" class="hint">
          <small>{{ hintText }}</small>
        </div>

        <!-- кнопки в модальном окне -->
        <div class="modal-actions">
          <button class="cancel-btn" @click="handleClose" type="button">Отмена</button>
          <button class="save-btn" @click="save" :disabled="!isValid">
            {{ editing ? 'Сохранить' : 'Создать' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
  color: #555;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input.error {
  border-color: #f44336;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.error-message {
  display: block;
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}

.hint {
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #666;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

textarea {
  resize: vertical;
  min-height: 80px;
}
</style>
