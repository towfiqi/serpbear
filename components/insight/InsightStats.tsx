import React, { useMemo, useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type InsightStatsProps = {
   stats: SearchAnalyticsStat[],
   totalKeywords: number,
   totalCountries: number,
   totalPages: number,
}

const InsightStats = ({ stats = [], totalKeywords = 0, totalPages = 0 }:InsightStatsProps) => {
   const formattedNum = (num:number) => new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(num);
   const [totalStat, setTotalStat] = useState({ impressions: 0, clicks: 0, ctr: 0, position: 0 });

   useEffect(() => {
      if (stats.length > 0) {
         const totalStats = stats.reduce((acc, item) => {
            return {
               impressions: item.impressions + acc.impressions,
               clicks: item.clicks + acc.clicks,
               ctr: item.ctr + acc.ctr,
               position: item.position + acc.position,
            };
         }, { impressions: 0, clicks: 0, ctr: 0, position: 0 });
         setTotalStat(totalStats);
      }
   }, [stats]);

   const chartData = useMemo(() => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartSeries: {[key:string]: number[]} = { clicks: [], impressions: [], position: [], ctr: [] };
      stats.forEach((item) => {
         chartSeries.clicks.push(item.clicks);
         chartSeries.impressions.push(item.impressions);
         chartSeries.position.push(item.position);
         chartSeries.ctr.push(item.ctr);
      });
      return {
         labels: stats && stats.length > 0 ? stats.map((item) => `${new Date(item.date).getDate()}-${months[new Date(item.date).getMonth()]}`) : [],
         series: chartSeries };
   }, [stats]);

   const renderChart = () => {
      // Doc: https://www.chartjs.org/docs/latest/samples/line/multi-axis.html
      const chartOptions = {
         responsive: true,
         maintainAspectRatio: false,
         animation: false as const,
         interaction: {
            mode: 'index' as const,
            intersect: false,
          },
         scales: {
            x: {
               grid: {
                  drawOnChartArea: false,
                },
            },
            y1: {
               display: true,
               position: 'right' as const,
               grid: {
                 drawOnChartArea: false,
               },
             },
         },
         plugins: {
            legend: {
                display: false,
            },
        },
      };
      const { clicks, impressions } = chartData.series || {};
      const dataSet = [
         { label: 'Visits', data: clicks, borderColor: 'rgb(117, 50, 205)', backgroundColor: 'rgba(117, 50, 205, 0.5)', yAxisID: 'y' },
         { label: 'Impressions', data: impressions, borderColor: 'rgb(31, 205, 176)', backgroundColor: 'rgba(31, 205, 176, 0.5)', yAxisID: 'y1' },
      ];
      return <Line datasetIdKey={'xxx'} options={chartOptions} data={{ labels: chartData.labels, datasets: dataSet }} />;
   };

   return (
      <div className='p-6 lg:border-t lg:border-gray-200'>
         <div className=' flex font-bold flex-wrap lg:flex-nowrap'>
            <div
            className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-violet-700 mr-5'
            title={`${formattedNum(totalStat.clicks || 0)} Visits`}>
               <span className=' block text-sm font-normal text-gray-500'>Visits</span>
               {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(totalStat.clicks || 0).replace('T', 'K')}
            </div>
            <div
            className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-[#1fcdb0] lg:mr-5'
            title={`${formattedNum(totalStat.impressions || 0)} Impressions`}>
               <span className=' block text-sm font-normal text-gray-500'>Impressions</span>
               {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(totalStat.impressions || 0).replace('T', 'K')}
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold mr-5'>
               <span className=' block text-sm font-normal text-gray-500'>Avg Position</span>
               {(totalStat.position ? Math.round(totalStat.position / stats.length) : 0)}
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold lg:mr-5'>
               <span className=' block text-sm font-normal text-gray-500'>Avg CTR</span>
               {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalStat.ctr || 0)}%
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold mr-5'>
               <span className=' block text-sm font-normal text-gray-500'>Keywords</span>
               {formattedNum(totalKeywords)}
            </div>
            <div className='flex-1 border border-gray-200 px-6 py-5 rounded mb-4 text-2xl text-gray-500 font-semibold'>
               <span className=' block text-sm font-normal text-gray-500'>Pages</span>
               {formattedNum(totalPages)}
            </div>
         </div>
         <div className='h-80'>
            {renderChart()}
         </div>
      </div>
   );
};

export default InsightStats;
