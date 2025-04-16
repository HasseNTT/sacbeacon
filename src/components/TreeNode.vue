<template>
  <div class="tree-node" :class="`level-${level}`">
    <div class="node-header" @click="handleHeaderClick">
      <span v-if="hasChildren" class="expand-icon">
        {{ expandedNodes[node.id] ? '▼' : '▶' }}
      </span>
      <span v-else class="expand-placeholder"></span>

      <label @click.stop>
        <input
          type="checkbox"
          :checked="isFullySelected"
          :indeterminate.prop="isPartiallySelected && !isFullySelected"
          @change="toggleNode"
        />
        <span>{{ node.label }}</span>
      </label>
    </div>

    <!-- Children nodes -->
    <div v-if="expandedNodes[node.id] && node.children" class="children-container">
      <!-- Recursive tree nodes -->
      <TreeNode
        v-for="childNode in node.children"
        :key="childNode.id"
        :node="childNode"
        :expanded-nodes="expandedNodes"
        :selected-ids="selectedIds"
        :level="level + 1"
        @toggle-expand="onToggleExpand"
        @toggle-node="onToggleNode"
        @toggle-item="onToggleItem"
      />

      <!-- Leaf items if no more child nodes -->
      <div
        v-if="!hasChildNodes && hasLeafItems"
        v-for="item in node.children"
        :key="item.id"
        class="leaf-item"
        @click.stop
      >
        <label>
          <input
            type="checkbox"
            :checked="selectedIds.includes(item.id)"
            @change="toggleItem(item.id)"
          />
          <span>{{ item.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'TreeNode',
  props: {
    node: {
      type: Object,
      required: true,
    },
    expandedNodes: {
      type: Object,
      required: true,
    },
    selectedIds: {
      type: Array,
      required: true,
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  emits: ['toggle-expand', 'toggle-node', 'toggle-item'],
  setup(props, { emit }) {
    // Check if node has children
    const hasChildren = computed(() => {
      return props.node.children && props.node.children.length > 0
    })

    // Check if children are nodes (with their own children) or leaf items
    const hasChildNodes = computed(() => {
      if (!props.node.children) return false
      return props.node.children.some((child) => child.children && child.children.length > 0)
    })

    // Check if has leaf items
    const hasLeafItems = computed(() => {
      if (!props.node.children) return false
      return props.node.children.some((child) => !child.children || child.children.length === 0)
    })

    // Get all selectable descendant IDs
    const descendantIds = computed(() => {
      return getAllDescendantIds(props.node)
    })

    // Check if node is fully selected
    const isFullySelected = computed(() => {
      const ids = descendantIds.value
      return ids.length > 0 && ids.every((id) => props.selectedIds.includes(id))
    })

    // Check if node is partially selected
    const isPartiallySelected = computed(() => {
      const ids = descendantIds.value
      const selectedCount = ids.filter((id) => props.selectedIds.includes(id)).length
      return selectedCount > 0 && selectedCount < ids.length
    })

    // Get all descendant IDs recursively
    const getAllDescendantIds = (node) => {
      let ids = []

      if (!node.children) {
        return [node.id]
      }

      // Process children
      node.children.forEach((child) => {
        if (child.children) {
          // It's a node, get its descendants
          ids = [...ids, ...getAllDescendantIds(child)]
        } else {
          // It's a leaf item
          ids.push(child.id)
        }
      })

      return ids
    }

    // Handle node header click (expand/collapse)
    const handleHeaderClick = () => {
      if (hasChildren.value) {
        emit('toggle-expand', props.node.id)
      }
    }

    // Toggle node selection
    const toggleNode = () => {
      emit('toggle-node', props.node.id, descendantIds.value)
    }

    // Toggle a single item
    const toggleItem = (itemId) => {
      emit('toggle-item', itemId)
    }

    // Event handlers for child nodes
    const onToggleExpand = (nodeId) => {
      emit('toggle-expand', nodeId)
    }

    const onToggleNode = (nodeId, nodeDescendantIds) => {
      emit('toggle-node', nodeId, nodeDescendantIds)
    }

    const onToggleItem = (itemId) => {
      emit('toggle-item', itemId)
    }

    return {
      hasChildren,
      hasChildNodes,
      hasLeafItems,
      isFullySelected,
      isPartiallySelected,
      handleHeaderClick,
      toggleNode,
      toggleItem,
      onToggleExpand,
      onToggleNode,
      onToggleItem,
    }
  },
}
</script>

<style scoped>
.tree-node {
  width: 100%;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  cursor: pointer;
}

.node-header:hover {
  background-color: #f5f5f5;
}

.expand-icon,
.expand-placeholder {
  width: 16px;
  font-size: 10px;
  margin-right: 4px;
}

.children-container {
  margin-left: 16px;
}

.leaf-item {
  padding: 4px 12px 4px 20px;
  cursor: pointer;
}

.leaf-item:hover {
  background-color: #f5f5f5;
}

label {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

label input {
  margin-right: 8px;
}

.level-1 {
  /* Level 1 specific styles */
}

.level-2 {
  /* Level 2 specific styles */
}

.level-3 {
  /* Level 3 specific styles */
}
</style>
