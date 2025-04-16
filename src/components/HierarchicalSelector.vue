<template>
  <div class="custom-dropdown">
    <div class="dropdown-header" @click="toggleDropdown">
      <span v-if="modelValue.length === 0">{{ placeholder }}</span>
      <span v-else-if="modelValue.length === 1">{{ getSelectedLabel(modelValue[0]) }}</span>
      <span v-else>{{ modelValue.length }} items selected</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </div>

    <!-- Dropdown Menu -->
    <div v-if="isOpen" class="dropdown-menu">
      <div class="search-container">
        <input
          type="text"
          :placeholder="searchPlaceholder"
          v-model="searchTerm"
          @input="filterItems"
          ref="searchInput"
        />
      </div>

      <div class="dropdown-content">
        <!-- All items option -->
        <div class="dropdown-item all-option">
          <label>
            <input type="checkbox" :checked="isAllSelected" @change="toggleAll" />
            <span>All Items</span>
          </label>
        </div>

        <!-- Search Results Mode -->
        <div v-if="searchTerm" class="search-results">
          <div v-for="item in filteredItems" :key="item.id" class="dropdown-item search-result">
            <label>
              <input
                type="checkbox"
                :checked="internalValue.includes(item.id)"
                @change="toggleItem(item.id)"
              />
              <span>{{ item.label }}</span>
            </label>
          </div>
          <div v-if="filteredItems.length === 0" class="no-results">No results found</div>
        </div>

        <!-- Hierarchical Mode -->
        <div v-else class="hierarchy-view">
          <TreeNode
            v-for="node in options"
            :key="node.id"
            :node="node"
            :expanded-nodes="expandedNodes"
            :selected-ids="internalValue"
            @toggle-expand="toggleExpand"
            @toggle-node="toggleNode"
            @toggle-item="toggleItem"
          />
        </div>
      </div>

      <div class="dropdown-actions">
        <button class="clear-btn" @click="clearSelection">Clear All</button>
        <button class="apply-btn" @click="applySelection">Apply</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import TreeNode from './TreeNode.vue'

export default {
  name: 'HierarchicalSelector',
  components: {
    TreeNode,
  },
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
    options: {
      type: Array,
      required: true,
    },
    allItems: {
      type: Array,
      required: true,
    },
    placeholder: {
      type: String,
      default: 'Select items...',
    },
    searchPlaceholder: {
      type: String,
      default: 'Search items...',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false)
    const searchTerm = ref('')
    const searchInput = ref(null)
    const expandedNodes = reactive({})
    const filteredItems = ref([])
    const internalValue = ref([...props.modelValue])
    const tempSelection = ref([])

    // Initialize internal value from props
    watch(
      () => props.modelValue,
      (newVal) => {
        internalValue.value = [...newVal]
      },
    )

    // Check if all items are selected
    const isAllSelected = computed(() => {
      return props.allItems.length > 0 && internalValue.value.length === props.allItems.length
    })

    // Toggle dropdown visibility
    const toggleDropdown = () => {
      isOpen.value = !isOpen.value

      if (isOpen.value) {
        // Save current selection
        tempSelection.value = [...internalValue.value]

        // Focus search input
        nextTick(() => {
          if (searchInput.value) {
            searchInput.value.focus()
          }
        })
      }
    }

    // Filter items based on search term
    const filterItems = () => {
      if (!searchTerm.value) {
        filteredItems.value = []
        return
      }

      const term = searchTerm.value.toLowerCase()

      filteredItems.value = props.allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          (item.metadata &&
            Object.values(item.metadata).some(
              (meta) => typeof meta === 'string' && meta.toLowerCase().includes(term),
            )),
      )
    }

    // Toggle expansion of a node
    const toggleExpand = (nodeId) => {
      expandedNodes[nodeId] = !expandedNodes[nodeId]
    }

    // Toggle selection of a node
    const toggleNode = (nodeId, nodeDescendantIds) => {
      const isSelected = nodeDescendantIds.every((id) => internalValue.value.includes(id))

      if (isSelected) {
        // Deselect all descendants
        internalValue.value = internalValue.value.filter((id) => !nodeDescendantIds.includes(id))
      } else {
        // Select all descendants
        const newSelection = [...internalValue.value]

        nodeDescendantIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })

        internalValue.value = newSelection
      }
    }

    // Toggle selection of a single item
    const toggleItem = (itemId) => {
      const index = internalValue.value.indexOf(itemId)

      if (index === -1) {
        // Add
        internalValue.value.push(itemId)
      } else {
        // Remove
        internalValue.value.splice(index, 1)
      }
    }

    // Toggle all items
    const toggleAll = () => {
      if (isAllSelected.value) {
        internalValue.value = []
      } else {
        internalValue.value = props.allItems.map((item) => item.id)
      }
    }

    // Clear selection
    const clearSelection = () => {
      internalValue.value = []
    }

    // Apply selection
    const applySelection = () => {
      emit('update:modelValue', internalValue.value)
      isOpen.value = false
    }

    // Get label for a selected item
    const getSelectedLabel = (id) => {
      const item = props.allItems.find((item) => item.id === id)
      return item ? item.label : id
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.custom-dropdown')
      if (isOpen.value && dropdown && !dropdown.contains(event.target)) {
        // Revert to previous selection
        internalValue.value = [...tempSelection.value]
        isOpen.value = false
      }
    }

    // Setup and cleanup event listeners
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      isOpen,
      searchTerm,
      searchInput,
      expandedNodes,
      filteredItems,
      internalValue,
      isAllSelected,
      toggleDropdown,
      filterItems,
      toggleExpand,
      toggleNode,
      toggleItem,
      toggleAll,
      clearSelection,
      applySelection,
      getSelectedLabel,
    }
  },
}
</script>

<style scoped>
.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-header {
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.search-container {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}

.search-container input {
  margin: auto;
  width: 95%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.dropdown-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.dropdown-actions {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid #eee;
}

.clear-btn,
.apply-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.clear-btn {
  background-color: #f5f5f5;
  color: #333;
}

.apply-btn {
  background-color: #3b82f6;
  color: white;
}

.all-option {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
  font-weight: 500;
}

.dropdown-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

.dropdown-item label input {
  margin-right: 8px;
}

.search-result {
  padding: 4px 12px;
}

.search-result:hover {
  background-color: #f5f5f5;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>
