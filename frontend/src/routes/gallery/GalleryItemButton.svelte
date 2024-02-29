<script lang="ts">
  export let onClick = () => {};
  export { cssClasses as class };
  let cssClasses = "";

  let width = 35;
  let height = 35;
</script>

<button 
  class={`flex fill-white justify-center place-items-center items-center rounded-full bg-red-900 hover:bg-red-800 ${cssClasses ?? ''}`} 
  style={` width: ${width}px; height: ${height}px;`} 
  on:click={(e) => { e.preventDefault(); onClick(); }}
>
  <slot />
</button>