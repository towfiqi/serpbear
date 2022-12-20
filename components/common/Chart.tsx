import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ChartProps ={
   labels: string[],
   sreies: number[],
   reverse? : boolean,
}

const Chart = ({ labels, sreies, reverse = true }:ChartProps) => {
   const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
         y: {
            reverse,
            min: 1,
            max: reverse ? 100 : undefined,
         },
      },
      plugins: {
         legend: {
             display: false,
         },
     },
   };

   return <Line
            datasetIdKey='XXX'
            options={options}
            data={{
            labels,
            datasets: [
               {
                  fill: 'start',
                  data: sreies,
                  borderColor: 'rgb(31, 205, 176)',
                  backgroundColor: 'rgba(31, 205, 176, 0.5)',
               },
            ],
            }}
         />;
};

export default Chart;
