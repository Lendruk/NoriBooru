<script lang="ts">
	import { sdUiStatus, type SDUIStatus } from '../../../store';

	let status: SDUIStatus = 'UNKNOWN';
	function getColorFromStatus(status: SDUIStatus): string {
		switch (status) {
			case 'RUNNING':
				return '#069c1a'; // green
			case 'NOT_RUNNING':
				return '#9c7b06'; // yellow
			default:
				return '#403e3e'; // grey
		}
	}

	sdUiStatus.subscribe((update) => {
		status = update;
	});
</script>

<div
	class="w-[10px] h-[10px] rounded-full"
	style={`background-color: ${getColorFromStatus(status)};`}
></div>
