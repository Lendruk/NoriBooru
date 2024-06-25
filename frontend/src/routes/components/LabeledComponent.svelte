<script lang="ts">
  export { cssClass as class };
  let cssClass = '';
</script>

<div class={`flex flex-col mt-2 mb-2 ${cssClass}`}>
  <div class="text-lg mb-1">
    <slot name="label" />
  </div>
  <slot name="content"/>
</div>