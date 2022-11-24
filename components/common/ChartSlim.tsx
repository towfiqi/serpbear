import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

type ChartProps ={
   labels: string[],
   sreies: number[]
}

const ChartSlim = ({ labels, sreies }:ChartProps) => {
   const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
         y: {
            display: false,
            reverse: true,
            min: 1,
            max: 100,
         },
         x: {
            display: false,
         },
      },
      plugins: {
         tooltip: {
            enabled: false,
         },
         legend: {
             display: false,
         },
     },
   };

   return <div className='w-[120px] h-[30px] rounded border border-gray-200'>
         <Line
            datasetIdKey='XXX'
            options={options}
            data={{
            labels,
            datasets: [
               {
                  fill: 'start',
                  showLine: false,
                  data: sreies,
                  pointRadius: 0,
                  borderColor: 'rgb(31, 205, 176)',
                  backgroundColor: 'rgba(31, 205, 176, 0.5)',
               },
            ],
            }}
         />
         </div>;
};

export default ChartSlim;
