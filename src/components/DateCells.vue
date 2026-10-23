<script setup lang="ts">
import { computed } from 'vue'
import type { BoxSettings } from '@/types/cheque'

/** 96 dpi → px per mm, as specified for cell geometry. */
const PX_PER_MM = 3.7795

interface Props {
  text: string
  box: BoxSettings
  fieldId: string
  /** explicit digit size in px; falls back to the cell-height auto fit */
  fontSize?: number
}

const props = defineProps<Props>()

/** Non-digit characters are ignored for cell content; raw value stays in state. */
const digits = computed(() => props.text.replace(/\D/g, '').split(''))

/** Date fields group as DD MM YYYY; every other box field is one continuous group. */
const groups = computed(() => {
  const d = digits.value
  if (props.fieldId === 'p-date' && d.length === 8) {
    return [d.slice(0, 2), d.slice(2, 4), d.slice(4)]
  }
  return [d]
})

type CellItem =
  | { kind: 'digit'; ch: string }
  | { kind: 'slash' }
  | { kind: 'gap' }

const items = computed<CellItem[]>(() => {
  const out: CellItem[] = []
  groups.value.forEach((group, gi) => {
    if (gi > 0) {
      if (props.box.sep === 'slash') out.push({ kind: 'slash' })
      else if (props.box.sep === 'gap') out.push({ kind: 'gap' })
    }
    for (const ch of group) out.push({ kind: 'digit', ch })
  })
  return out
})

const cellHeightPx = computed(() => props.box.cellH * PX_PER_MM)

/** Field fontSize wins when set; otherwise fit the digit to the cell. */
const digitPx = computed(() =>
  props.fontSize && props.fontSize > 0 ? props.fontSize : cellHeightPx.value * 0.6
)

const cellStyle = computed(() => ({
  width: `${props.box.cellW * PX_PER_MM}px`,
  height: `${cellHeightPx.value}px`,
  fontSize: `${digitPx.value}px`
}))

const slashStyle = computed(() => ({
  width: `${props.box.cellW * 0.6 * PX_PER_MM}px`,
  height: `${cellHeightPx.value}px`,
  fontSize: `${digitPx.value}px`
}))

const gapStyle = computed(() => ({
  width: `${props.box.gap * PX_PER_MM}px`
}))
</script>

<template>
  <div class="date-cells" :class="{ 'no-outlines': !box.outlines }">
    <template v-for="(item, i) in items" :key="i">
      <span v-if="item.kind === 'digit'" class="cell" :style="cellStyle">{{ item.ch }}</span>
      <span v-else-if="item.kind === 'slash'" class="sep-slash" :style="slashStyle">/</span>
      <span v-else class="sep-gap" :style="gapStyle" />
    </template>
  </div>
</template>

<style scoped>
.date-cells {
  display: flex;
  align-items: flex-start;
}

/* One shared border between adjacent digit cells: uniform pitch, one box strip */
.date-cells .cell + .cell {
  margin-left: -1px;
}

.date-cells .cell {
  box-sizing: border-box; /* keeps geometry identical when outlines toggle */
  border: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-family: inherit;
  font-weight: inherit;
  color: #000;
}

/* Outlines off: borders invisible, cells keep their exact 1px geometry */
.date-cells.no-outlines .cell {
  border-color: transparent;
}

.sep-slash {
  box-sizing: border-box;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-family: inherit;
  font-weight: inherit;
  color: #000;
}

.sep-gap {
  flex-shrink: 0;
}
</style>
