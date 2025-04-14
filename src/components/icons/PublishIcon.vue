<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <g stroke="currentColor" stroke-width="2" fill="none" fill-rule="evenodd">
      <g transform="translate(-377.000000, -378.000000)" id="Group">
        <g transform="translate(375.000000, 376.000000)" id="Shape">
          <polygon
            points="9.375 21 9.375 14.5072464 5 14.5072464 12 7 19 14.5072464 14.625 14.5072464 14.625 21"
          ></polygon>
          <line x1="3" y1="3" x2="21" y2="3"></line>
        </g>
      </g>
    </g>
  </svg>
</template>

<script>
export default {
  name: 'PublishIcon',
  props: {
    width: {
      type: [Number, String],
      default: '15px',
    },
    height: {
      type: [Number, String],
      default: '15px',
    },
  },
}
</script>
