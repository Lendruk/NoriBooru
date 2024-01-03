<script lang="ts">
  export let onClick = () => {};
  export let bgColor = "#007bff";
  export let hoverBgColor = "#0069d9";
  export let iconColor = "#ffffff";
  export let cssClasses = "";

  let width = 35;
  let height = 35;

  $: cssVarStyles = `--hoverBgColor: ${hoverBgColor}; --bgColor: ${bgColor}; --iconColor: ${iconColor};`;
</script>

<button 
  class={`flex justify-center place-items-center items-center rounded-full btnHover ${cssClasses ?? ''}`} 
  style={` width: ${width}px; height: ${height}px; background-color: ${bgColor}; ${cssVarStyles}`} 
  on:click={(e) => { e.preventDefault(); onClick(); }}
>
  <slot />
</button>

<style>
  .btnHover:hover {
    transition: 0.5s;
    background-color: var(--hoverBgColor) !important;
  }
</style>