<script setup lang="ts">
/**
 * Minimal line-icon set (1.5px stroke, rounded caps — Lucide-style).
 * Add new paths here as needed; keep 24x24 viewBox.
 */
interface Props {
  name: keyof typeof paths
  size?: number
  stroke?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  stroke: 1.5
})

const paths = {
  'file-text': [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M8 13h8',
    'M8 17h5'
  ],
  'layout': [
    'M3 4h18v16H3z',
    'M3 9h18',
    'M9 9v11'
  ],
  'printer': [
    'M6 9V2h12v7',
    'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
    'M6 14h12v8H6z'
  ],
  'plus': ['M12 5v14', 'M5 12h14'],
  'trash': [
    'M3 6h18',
    'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2',
    'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'
  ],
  'save': [
    'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z',
    'M17 21v-8H7v8',
    'M7 3v5h8'
  ],
  'reset': [
    'M3 12a9 9 0 1 0 3-6.7',
    'M3 4v5h5'
  ],
  'check': ['M20 6L9 17l-5-5'],
  'edit': [
    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
    'M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z'
  ],
  'crosshair': [
    'M12 3v4',
    'M12 17v4',
    'M3 12h4',
    'M17 12h4',
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'
  ],
  'align-center': [
    'M12 3v18',
    'M17 7H7',
    'M19 12H5',
    'M17 17H7'
  ],
  'crossing': ['M4 8l16 8', 'M4 16l16-8'],
  'more-horizontal': ['M5 12h.01', 'M12 12h.01', 'M19 12h.01']
} as const
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths[props.name]" :key="i" :d="d" />
  </svg>
</template>
