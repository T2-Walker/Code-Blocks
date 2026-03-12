<template>
  <div class="print-content">
    <div class="print-header">
      <span class="print-title">Написать</span>
    </div>
    
    <div class="print-variables">
      <div 
        v-for="(item, index) in selectedVariables" 
        :key="index"
        class="print-variable-row"
      >
 
        <select 
          v-model="item.name" 
          class="print-variable-select"
          @change="onVariableChange(item)"
        >
          <option value="">Выберите переменную</option>
        
          <optgroup label="Переменные">
            <option v-for="varItem in simpleVariables" :key="varItem.name" :value="varItem.name">
              {{ varItem.name }}
            </option>
          </optgroup>
      
          <optgroup label="Массивы">
            <option v-for="varItem in arrayVariables" :key="varItem.name" :value="varItem.name">
              {{ varItem.name }} [{{ varItem.elementType }}[{{ varItem.size }}]]
            </option>
          </optgroup>
        </select>
        
  
        <select 
          v-if="item.isArray"
          v-model="item.index" 
          class="print-index-select"
          @change="emitUpdate"
        >
          <option value="all">Весь массив</option>
          <option v-for="i in item.arraySize" :key="i-1" :value="i-1">
            [{{ i-1 }}]
          </option>
        </select>
        
        <button 
          v-if="selectedVariables.length > 1"
          class="print-remove-btn"
          @click.stop="removeVariable(index)"
        >
          ✕
        </button>
      </div>
    </div>
    
    <div class="print-add-row">
      <button class="print-add-btn" @click.stop="addVariable">
        <span class="plus-icon">+</span> Добавить переменную
      </button>
    </div>
    
    <div class="print-preview" v-if="previewItems.length > 0">
      <span class="preview-label">Вывод:</span>
      <div class="preview-values">
        <div v-for="(item, idx) in previewItems" :key="idx" class="preview-value-item">
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVariables } from '@/composables/useVariables'
import { getDeclaredVariableNamesBeforeBlock } from '@/domain/chainContext'

const props = defineProps({
  block: Object,
  allBlocks: Array,
  allConnections: Array,
})

const emit = defineEmits(['update-block'])
const { variables, getVariableByName } = useVariables()
const selectedVariables = ref([])

const initSelectedVariables = () => {
  if (props.block.selectedVariables) {
    selectedVariables.value = props.block.selectedVariables.map(item => ({
      name: item.name || '',
      isArray: item.isArray || false,
      index: item.index || 'all',
      arraySize: item.arraySize || 0
    }))
  } else {
    selectedVariables.value = [{ name: '', isArray: false, index: 'all', arraySize: 0 }]
  }
}

const allowedNames = computed(() => {
  return getDeclaredVariableNamesBeforeBlock(
    props.allBlocks || [],
    props.allConnections || [],
    props.block.id,
  )
})

const allVariables = computed(() => variables.value || [])

const allowedVariables = computed(() => {
  const nameSet = new Set(allowedNames.value)
  return allVariables.value.filter(v => nameSet.has(v.name))
})

const simpleVariables = computed(() => 
  allowedVariables.value.filter(v => v.type !== 'array')
)

const arrayVariables = computed(() => 
  allowedVariables.value.filter(v => v.type === 'array')
)

const onVariableChange = (item) => {
  const variable = getVariableByName(item.name)
  if (variable) {
    item.isArray = variable.type === 'array'
    if (item.isArray) {
      item.arraySize = variable.size
      item.index = item.index || 'all'
    } else {
      item.arraySize = 0
      item.index = undefined
    }
  }
  emitUpdate()
}

const previewItems = computed(() => {
  const result = []
  
  for (const item of selectedVariables.value) {
    if (!item.name) continue
    
    const variable = getVariableByName(item.name)
    if (!variable) continue
    
    if (variable.type === 'array') {
      if (item.index === 'all') {
        result.push(`${variable.name} = [${variable.value.join(', ')}]`)
      } else {
        const idx = parseInt(item.index)
        result.push(`${variable.name}[${idx}] = ${variable.value[idx]}`)
      }
    } else {
      if (variable.type === 'string') {
        result.push(`${variable.name} = "${variable.value}"`)
      } else if (variable.type === 'boolean') {
        result.push(`${variable.name} = ${variable.value ? 'true' : 'false'}`)
      } else {
        result.push(`${variable.name} = ${variable.value}`)
      }
    }
  }
  
  return result
})

const addVariable = () => {
  selectedVariables.value.push({ name: '', isArray: false, index: 'all', arraySize: 0 })
  emitUpdate()
}

const removeVariable = (index) => {
  selectedVariables.value.splice(index, 1)
  emitUpdate()
}

watch(allowedNames, (names) => {
  const set = new Set(names)
  let changed = false
  
  selectedVariables.value.forEach(item => {
    if (item.name && !set.has(item.name)) {
      item.name = ''
      item.isArray = false
      item.arraySize = 0
      item.index = 'all'
      changed = true
    }
  })
  
  if (changed) {
    emitUpdate()
  }
}, { immediate: true })
watch(allVariables, () => {
  let changed = false
  
  selectedVariables.value.forEach(item => {
    if (item.name) {
      const variable = getVariableByName(item.name)
      if (variable && variable.type === 'array') {
        if (item.arraySize !== variable.size) {
          item.arraySize = variable.size
          changed = true
        }
      }
    }
  })
  
  if (changed) {
    emitUpdate()
  }
}, { deep: true })

const emitUpdate = () => {
  const updateData = {
    id: props.block.id,
    selectedVariables: selectedVariables.value.map(item => ({
      name: item.name,
      isArray: item.isArray,
      index: item.index,
      arraySize: item.arraySize
    }))
  }
  
  console.log('📤 PrintBlock emitUpdate:', updateData)
  emit('update-block', updateData)
}

// Инициализация
watch(() => props.block, () => {
  initSelectedVariables()
}, { immediate: true, deep: true })
</script>

<style scoped>
.print-content {
  min-width: 320px;
  padding: 15px;
  background-color: #FF9800;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
}

.print-header {
  text-align: left;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.print-title {
  font-weight: bold;
  color: white;
  font-size: 16px;
}

.print-variables {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.print-variable-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.print-variable-select {
  flex: 2;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 13px;
  cursor: pointer;
}

.print-index-select {
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 13px;
  cursor: pointer;
}

.print-remove-btn {
  width: 24px;
  height: 24px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.print-remove-btn:hover {
  transform: scale(1.1);
  background-color: #cc0000;
}

.print-add-row {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.print-add-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px dashed rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.print-add-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.plus-icon {
  font-size: 16px;
  font-weight: bold;
}

.print-preview {
  margin-top: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.preview-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-bottom: 4px;
  display: block;
}

.preview-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-value-item {
  color: white;
  font-family: monospace;
  font-size: 13px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

select, button {
  outline: none;
}

select:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

select:focus {
  border-color: #4CAF50;
}

optgroup {
  font-weight: bold;
  color: #333;
}
</style>