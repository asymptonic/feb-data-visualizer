<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import { data } from '$lib/data-loader.svelte';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import { scaleLinear, scaleOrdinal, scaleUtc } from 'd3-scale';
	import { curveStepAfter } from 'd3-shape';
	import dayjs from 'dayjs';
	import { init, type EChartsOption, type SeriesOption } from 'echarts';
	import { Area, AreaChart, Highlight, RectClipPath } from 'layerchart';

	let element = $state<HTMLDivElement>();

	let {
		series,
		difference = false,
		hideXAxis: hideXAxis = false
	}: { series: SeriesOption[]; difference?: boolean; hideXAxis?: boolean } = $props();

	let resize: () => void | undefined

	$effect(() => {
		if (!series) return;
		let chart = init(element, 'dark');
		resize = chart.resize

		let maxValue = Math.max(
			...series.map((dataset) =>
				Math.max(
					...(dataset.data as [number, number][])
						.filter(([_, p]) => !isNaN(p))
						.map((datapoint) => Math.abs(datapoint[1]))
				)
			)
		);

		var option = {
			tooltip: {
				trigger: 'axis',
				// borderWidth: 0,
				borderColor: '#fff',
				backgroundColor: '#000',
				axisPointer: {
					type: 'cross',
					label: {
						backgroundColor: '#fff',
						color: '#000'
					},
					animation: false
				}
			},
			legend: {
				data: series.map((option) => option.name) as string[],
				bottom: 30
			},
			axisPointer: {
				link: [
					{
						xAxisIndex: 'all'
					}
				]
			},
			grid: {
				top: 0,
				bottom: 0,
				left: 0,
				right: 0
			},
			xAxis: {
				type: 'time',
				show: !hideXAxis
			},
			yAxis: {
				type: 'value',
				boundaryGap: [0, '25%'],
				...(difference ? { min: Math.floor(-maxValue * 1.8), max: Math.ceil(maxValue * 1.8) } : {})
			},
			series
		} satisfies EChartsOption;

		chart.setOption(option);

		return () => chart.dispose();
	});
</script>

<svelte:window onresize={resize} />

<div bind:this={element} class="h-full w-full"></div>
