<script lang="ts">
	import { HttpService } from '$lib/services/HttpService';
	import type { SDProgress } from '$lib/types/SD/SDProgress';

	export let isGeneratingImage: boolean;
	let interval: NodeJS.Timeout;
	let currentProgress: SDProgress;

	async function getProgress() {
		currentProgress = await HttpService.get<SDProgress>(`/sd/progress`);
	}

	$: {
		console.log('react');
		if (isGeneratingImage) {
			console.log('enters is generating');
			void getProgress();
			interval = setInterval(async () => {
				await getProgress();
			}, 400);
		} else {
			console.log('exits is generating');
			clearInterval(interval);
		}
	}
</script>

{#if isGeneratingImage && currentProgress}
	<div>
		<div>
			ETA: {currentProgress.eta_relative.toFixed(2)} seconds
		</div>
		<div class="w-full h-[40px] relative bg-zinc-950">
			<div
				class="absolute top-0 left-0 h-full bg-red-950 rounded-sm"
				style={`width: ${currentProgress.progress * 100}% ;`}
			></div>
			<div class="absolute left-4 top-[25%]">
				{(currentProgress.progress * 100).toFixed(2)}%
			</div>
		</div>
	</div>
{/if}
