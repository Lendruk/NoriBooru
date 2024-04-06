<script context="module" lang="ts">
  import Toast from "./Toast.svelte";
  export type ToastDef = {
    content: string;
    dismissIn: number;
    createdAt: number;
  };

  let toasts: ToastDef[] = $state([]);
  export const createToast = (content: string, dismissIn: number = 2500) => {
    const createdAt = new Date().getUTCMilliseconds();
    toasts.push({ content, dismissIn, createdAt });
    // setTimeout(() => {
    //   const index = toasts.findIndex(t => t.createdAt === createdAt);
    //   toasts.splice(index, 1);
    // }, dismissIn);
  };

  function removeToast(toast: ToastDef) {
    const index = toasts.findIndex(t => t.createdAt === toast.createdAt);
    toasts.splice(index, 1);
  }
</script>

<div class="absolute bottom-4 right-4">
  {#each toasts as toast, i (i) }
    <Toast onDismissClick={() => removeToast(toast)} content={toast.content} dismissIn={toast.dismissIn} />
  {/each}
</div>