<script lang="ts">
	import { page } from '$app/state';
	import FileSelector from '$lib/components/files/FileSelector.svelte';
	import * as Select from '$lib/components/ui/select';
	import { data, loadUploadedCSV, type DataStore } from '$lib/data-loader.svelte';
	import { pb, useRecord } from '$lib/pocketbase.svelte';
	import type { BoardsRecord, BoardsResponse } from '$lib/types/db';
	import { cn } from '$lib/utils';
	import type { LineSeriesOption } from 'echarts';
	import { Loader, Zap } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import BoardsList from './BoardsList.svelte';
	import DataChart from './DataChart.svelte';
	import MakeCopyButton from './MakeCopyButton.svelte';
	import { onNavigate } from '$app/navigation';
	import Input from '$lib/components/ui/input/input.svelte';
	import Activity from '@lucide/svelte/icons/activity';

	let board = useRecord<
		BoardsResponse<{
			properties_visible: string[];
			time_range_start: number;
			time_range_end: number;
		}>
	>('boards', page.params.boardid!);

	onNavigate(() => {
		window.location.reload();
	});

	let renaming = $state(false);
	let renamingValue = $state(board.record?.name || '');

	let previousBoardId = $state('');

	$effect(() => {
		if (!board.record || previousBoardId == board.record.id) return;
		loadUploadedCSV(board.record.data);
		previousBoardId = board.record.id;
		board.record.compare.forEach((file) => loadUploadedCSV(file));
	});

	function distanceFromDataset(dataset: DataStore['datasets']['data']) {
		if (!dataset || typeof dataset == 'string') return [];
		return dataset.datapoints.reduce(
			(accumulator, curr) => {
				const prev = accumulator[accumulator.length - 1];
				accumulator.push({
					timestamp: curr.TimeStamp * 1,
					Wheel_Speed: curr.Wheel_Speed,
					value:
						prev.value +
						((curr.TimeStamp * 1 - prev.timestamp) / 1000) * prev.Wheel_Speed * Math.PI * (16 / 12) // 16 inch wheel diameter -> 16 / 12 feet
				});
				return accumulator;
			},
			[
				{
					timestamp: dataset.datapoints[0].TimeStamp,
					value: 0,
					Wheel_Speed: dataset.datapoints[0].Wheel_Speed
				}
			]
		);
	}
	function accelerationFromDataset(dataset: DataStore['datasets']['data']) {
		if (!dataset || typeof dataset == 'string') return [];
		return dataset.datapoints.reduce(
			(accumulator, curr) => {
				const prev = accumulator[accumulator.length - 1];
				accumulator.push({
					timestamp: curr.TimeStamp * 1,
					Wheel_Speed: curr.Wheel_Speed,
					value:
						((curr.Wheel_Speed - prev.Wheel_Speed) * Math.PI * (16 / 12)) / // 16 inch wheel diameter -> 16 / 12 feet
						((curr.TimeStamp * 1 - prev.timestamp) / 1000)
				});
				return accumulator;
			},
			[
				{
					timestamp: dataset.datapoints[0].TimeStamp,
					value: 0,
					Wheel_Speed: dataset.datapoints[0].Wheel_Speed
				}
			]
		);
	}

	type DataPlotPoint = {
		timestamp: number;
		value: number;
	};

	function matchTimestampsToOtherSet(
		set1: DataPlotPoint[],
		set2: DataPlotPoint[],
		offset?: number
	): DataPlotPoint[] {
		const outputSet: DataPlotPoint[] = [];
		const set1StartingTimestamp = set1[0].timestamp;
		const set2StartingTimestamp = set2[0].timestamp;
		let set2Index = offset ?? 0;
		for (const point of set1) {
			while (
				set2[set2Index].timestamp - set2StartingTimestamp <
					point.timestamp - set1StartingTimestamp &&
				set2Index < set2.length
			) {
				set2Index++;
			}
			outputSet.push({ timestamp: point.timestamp, value: set2[set2Index].value });
		}

		return outputSet;
	}

	function mergeDataPlots(sets: { label: string; datapoints: DataPlotPoint[] }[]) {
		const outputSet: { timestamp: number; [x: string]: number }[] = [];
		for (let i = 0; i < sets[0].datapoints.length; i++) {
			const newPoint: (typeof outputSet)[0] = { timestamp: sets[0].datapoints[i].timestamp };
			sets.forEach((set) => (newPoint[set.label] = set.datapoints[i].value));
			outputSet.push(newPoint);
		}
		return outputSet;
	}

	const chartBaseOptions = {
		type: 'line',
		step: 'start',
		// symbol: 'none',
		showSymbol: false,
		// areaStyle: {opacity: 0.2},
		animationDuration: 200,
		lineStyle: { width: 0.75 }
	} as const satisfies LineSeriesOption;
</script>

<section class="sticky top-0 z-50 border-b bg-background px-8 py-5">
	<div class="flex items-center gap-5">
		<img class="my-1 h-8" src="https://cdn.lowk.app/feb.avif" alt="feb logo" />
		<div class="flex items-center gap-1.5">
			<span class="cursor-default text-primary/50">Boards / </span>
			<div>
				{#if !board.record}
					<Loader class="animate-spin" />
				{:else if renaming}
					<Input
						bind:value={renamingValue}
						autofocus
						onfocusout={() => {
							if (renamingValue === '') return toast.error('Name cannot be blank.');
							renaming = false;
							if (renamingValue !== board.record?.name) {
								toast.promise(
									pb.collection('boards').update(board.record!.id, {
										name: renamingValue
									} satisfies Partial<BoardsRecord>),
									{
										loading: `Updating name`,
										success: `Updated name`,
										error: `Update failed`
									}
								);
							}
						}}
					/>
				{:else}
					<button
						class="cursor-text"
						onclick={() => {
							renamingValue = board.record?.name || '';
							renaming = true;
						}}
					>
						{board.record.name}
					</button>
				{/if}
			</div>
		</div>

		{#if board.record}
			<FileSelector
				initialValue={board.record?.data}
				onchange={(selectedids) => {
					if (!board.record) return;
					toast.promise(
						pb
							.collection('boards')
							.update(board.record.id, { data: selectedids[0] } satisfies Partial<BoardsRecord>),
						{
							loading: `Updating board`,
							success: `Updated board`,
							error: `Update failed`
						}
					);
				}}
			/>
			<div>vs</div>
			<FileSelector
				initialValue={board.record?.compare}
				multiselect
				onchange={(selectedids) => {
					if (!board.record) return;
					toast.promise(
						pb
							.collection('boards')
							.update(board.record.id, { compare: selectedids } satisfies Partial<BoardsRecord>),
						{
							loading: `Updating board`,
							success: `Updated board`,
							error: `Update failed`
						}
					);
				}}
			/>
			<div class="ml-auto">
				<MakeCopyButton record={board.record} />
			</div>
		{/if}
	</div>
</section>

{#if board.record?.view}
	{@const dataset = data.datasets[board.record.data]}
	{#if typeof dataset != 'string'}
		<div class="gird fixed bottom-0 z-50 place-items-center p-10">
			<div class="border border-[#FDB515] bg-background">
				<Select.Root
					type="multiple"
					bind:value={board.record.view.properties_visible}
					onValueChange={() => {
						pb.collection('boards').update(board.record!.id, { view: board.record!.view });
					}}
				>
					<Select.Trigger class="">
						{board.record.view.properties_visible.join(', ').replaceAll(':', '')}
					</Select.Trigger>
					<Select.Content>
						{#each Object.keys(dataset.datapoints[0]).filter((p) => p !== 'TimeStamp') as property}
							<Select.Item value={property}>{property}</Select.Item>
						{/each}
						<Select.Item value=":Distance_Traveled">Distance_Traveled <Zap /></Select.Item>
						<Select.Item value=":Acceleration">Acceleration <Zap /></Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	{/if}
{/if}

<div class="grid" style="grid-template-columns: auto 1fr;">
	<section class="">
		{#if board.record}
			<BoardsList projectid={board.record.project} />
		{/if}
	</section>
	<section class="p-5">
		<div class="flex flex-col gap-5">
			{#if board.record?.view && data.datasets[board.record.data]}
				{@const dataset = data.datasets[board.record.data]}
				{#each board.record.view.properties_visible as property}
					<div
						class={cn(
							'border p-5',
							(dataset == 'fetching' || dataset == 'missing') && 'grid h-96 place-items-center'
						)}
					>
						{#if dataset == 'fetching'}
							<Loader class="animate-spin" />
						{:else if dataset == 'missing'}
							<div class="font-bold text-destructive">Data Missing.</div>
						{:else if dataset.datapoints}
							{@const distance = distanceFromDataset(dataset)}
							{@const acceleration = accelerationFromDataset(dataset)}
							{@const plottingDatapoints = dataset.datapoints.map((datapoint, index) =>
								property === ':Distance_Traveled'
									? {
											timestamp: distance[index]?.timestamp || 0,
											value: distance[index]?.value || 0
										}
									: property === ':Acceleration'
										? {
												timestamp: acceleration[index]?.timestamp || 0,
												value: acceleration[index]?.value || 0
											}
										: // @ts-ignore
											{ timestamp: datapoint.TimeStamp, value: datapoint[property] }
							)}
							{@const comparisonPlottingDatapoints = board.record.compare
								.map((comparisonFileId) => data.datasets[comparisonFileId])
								.filter((d) => !!d && typeof d != 'string')
								.map((comparisonDataset) => ({
									label: comparisonDataset.name,
									datapoints: matchTimestampsToOtherSet(
										plottingDatapoints,
										comparisonDataset.datapoints.map((datapoint) => ({
											timestamp: datapoint.TimeStamp,
											// @ts-expect-error
											value: datapoint[property]
										}))
									)
							}))}

							<div>
								<div class="mb-5 flex items-center gap-3 font-bold">
									<Activity />
									{property}
									<hr class="w-full border-dashed border-white" />
								</div>
								<div class="h-96">
									<DataChart
										series={[
											{
												name: dataset.name,
												...chartBaseOptions,
												color: '#FDB515',
												data: plottingDatapoints.map((datapoint) => [
													datapoint.timestamp * 1,
													parseFloat(datapoint.value)
												])
											},
											...comparisonPlottingDatapoints.map((comparisonDataset) => ({
												name: comparisonDataset.label,
												...chartBaseOptions,
												data: comparisonDataset.datapoints.map((datapoint) => [
													datapoint.timestamp * 1,
													datapoint.value
												])
											}))
										] satisfies LineSeriesOption[] as any}
									/>
								</div>
								{#if comparisonPlottingDatapoints.length > 0}
									<div class="mt-10 h-56">
										<DataChart
											difference
											hideXAxis
											series={comparisonPlottingDatapoints.map((comparison) => ({
												name: `Current vs. ${comparison.label}`,
												...chartBaseOptions,
												areaStyle: { opacity: 0.2 },
												data: comparison.datapoints.map((datapoint, index) => [
													datapoint.timestamp * 1,
													plottingDatapoints[index].value - datapoint.value
												])
											}))}
										/>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</section>
</div>
