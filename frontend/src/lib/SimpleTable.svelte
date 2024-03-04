<script lang="ts">
  type Col = {
    key: string;
    display: string | ConstructorOfATypedSvelteComponent;
    spacing?: string;
  };

  type Row = {
    [index: string]: unknown;
  };
  
  type Action = {
    icon: ConstructorOfATypedSvelteComponent,
    onClick: () => void | Promise<void>;
    name: string;
  }

  export let rows: Row[] = [];
  export let cols: Col[] = [];
  export let actions: Action[] = [];
  let orderedRows: Row[] = [];

  $: orderedRows = (() => {
    let computedRows: Row[] = [];

    if (rows) {
      for (const row of rows) {
        let obj: Row = {};
        for (const col of cols) {
          if (Object.keys(row).includes(col.key)) {
            obj[col.key] = row[col.key];
          } else {
            obj[col.key] = "---";
          }
        }
        computedRows.push(obj);
      }
    }

    return computedRows;
  })();
</script>

<table class="flex flex-col h-fit flex-1">
  <thead class="flex flex-1 bg-red-950 p-2 rounded-t-md">
    <tr class="flex flex-1 justify-between">
      {#each cols as col, i}
        <th class={`flex flex-1  ${i !== 0 ? 'justify-end' : ''}`}>{col.display}</th>
      {/each}
      {#if actions.length > 0}
        <th class="flex flex-1"/>
        <th class="flex flex-1 justify-end">Actions</th>
      {/if}
    </tr>
  </thead>
  <tbody class="flex flex-col flex-1 h-fit">
    {#each orderedRows as row}
      <tr class="h-10 flex flex-1 justify-between pl-2 pr-2 odd:bg-surface-color">
        {#each Object.values(row) as cell, i}
          <td class={`flex flex-1 ${i !== 0 ? 'justify-end' : ''}`}>{cell}</td>
        {/each}
        {#if actions.length > 0}
        <td class="flex flex-1"/>
        <td class="flex flex-1 justify-end gap-4 items-center">
          {#each actions as action}
          <span on:click={action.onClick}><svelte:component this={action.icon} /></span>
          {/each}
        </td>
        {/if}
      </tr>
    {/each}
  </tbody>
</table>
