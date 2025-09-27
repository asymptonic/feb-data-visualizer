<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { data } from '$lib/data-loader.svelte';
	import { cn } from '$lib/utils';
	import dayjs from 'dayjs';

	$inspect(data);

	const noColor = ['adjusted_time_ms', 'time_on_video'];
  const timestamp = ['adjusted_time_ms']
	const properties = [
		'adjusted_time_ms',
		'D1_Commanded_Torque',
		'D1_DC_Bus_Voltage',
		'D2_Motor_Speed',
		'IVT_Result_I',
		'Wheel_Speed',
		'Power',
		'Incremental_Energy',
		'Total_Energy',
		'time_on_video'
	] as const;
</script>

{#if data.datasets['jxbnty0xu2l05v9']}
	{@const dataset = data.datasets['jxbnty0xu2l05v9']}

	<div class="relative h-full w-full overflow-scroll">
		<Table.Root>
			<!-- <Table.Caption>{dataset.datapoints.length} datapoints</Table.Caption> -->
			<Table.Header>
				<Table.Row>
					{#each properties as property}
						<Table.Head class="sticky top-0">{property}</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<!-- </Table.Header> -->
			<Table.Body>
				{#each dataset.datapoints as datapoint, index}
					{@const previous = index > 0 ? dataset.datapoints[index - 1] : datapoint}
					<Table.Row class="text-xs">
						{#each properties as property}
							{#if noColor.includes(property)}
								<!-- <Table.Cell>{datapoint[property]}</Table.Cell> -->
								<Table.Cell>{timestamp.includes(property) ? dayjs(datapoint[property] as number * 1).format('HH:mm:ss:SSS') : datapoint[property]}</Table.Cell>
							{:else}
								<Table.Cell
									class={cn(
										previous[property] < datapoint[property] && 'font-bold text-emerald-400',
										previous[property] > datapoint[property] && 'font-bold text-red-400'
									)}
								>
									{datapoint[property]}
								</Table.Cell>
							{/if}
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
