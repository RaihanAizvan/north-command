import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Elf = { userId: string; username: string; openCount: number; doneCount: number };

export default function ElfBarChart({ elves }: { elves: Elf[] }) {
  const labels = useMemo(() => elves.map((e) => e.username), [elves]);

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Done',
          data: elves.map((e) => e.doneCount),
          backgroundColor: 'rgba(255,77,77,0.75)',
          borderRadius: 8,
          barThickness: 14,
        },
        {
          label: 'Open',
          data: elves.map((e) => e.openCount),
          backgroundColor: 'rgba(255,255,255,0.10)',
          borderRadius: 8,
          barThickness: 14,
        },
      ],
    }),
    [elves, labels]
  );

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'rgba(232,240,255,0.82)' } },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(190,205,235,0.70)' },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        ticks: { color: 'rgba(190,205,235,0.70)', precision: 0 },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
