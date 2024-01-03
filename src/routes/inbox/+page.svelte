<script>
	import { HttpService } from "$lib/client/services/HttpService";

  function processInbox() {
    HttpService.post('/api/inbox', {
      method: 'POST',
    });
  }
</script>


<div>
  <button on:click={processInbox}>
    Process Inbox
  </button>
</div>