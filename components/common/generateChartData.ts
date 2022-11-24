type ChartData = {
   labels: string[],
   sreies: number[]
}

export const generateChartData = (history: KeywordHistory): ChartData => {
   const currentDate = new Date();
   const priorDates = [];
   const seriesDates: any = {};
   let lastFoundSerp = 0;

   // First Generate Labels. The labels should be the last 30 days dates. Format: Oct 26
   for (let index = 30; index >= 0; index -= 1) {
      const pastDate = new Date(new Date().setDate(currentDate.getDate() - index));
      priorDates.push(`${pastDate.getDate()}/${pastDate.getMonth() + 1}`);

      // Then Generate Series. if past date's serp does not exist, use 0.
      // If have a missing serp in between dates, use the previous date's serp to fill the gap.
      const pastDateKey = `${pastDate.getFullYear()}-${pastDate.getMonth() + 1}-${pastDate.getDate()}`;
      const serpOftheDate = history[pastDateKey];
      const lastLargestSerp = lastFoundSerp > 0 ? lastFoundSerp : 0;
      seriesDates[pastDateKey] = history[pastDateKey] ? history[pastDateKey] : lastLargestSerp;
      if (lastFoundSerp < serpOftheDate) { lastFoundSerp = serpOftheDate; }
   }

   return { labels: priorDates, sreies: Object.values(seriesDates) };
};

export const generateTheChartData = (history: KeywordHistory, time:string = '30'): ChartData => {
   const currentDate = new Date(); let lastFoundSerp = 0;
   const chartData: ChartData = { labels: [], sreies: [] };

   if (time === 'all') {
      Object.keys(history).forEach((dateKey) => {
         const serpVal = history[dateKey] ? history[dateKey] : 111;
         chartData.labels.push(dateKey);
         chartData.sreies.push(serpVal);
      });
   } else {
      // First Generate Labels. The labels should be the last 30 days dates. Format: Oct 26
      for (let index = parseInt(time, 10); index >= 0; index -= 1) {
         const pastDate = new Date(new Date().setDate(currentDate.getDate() - index));
         // Then Generate Series. if past date's serp does not exist, use 0.
         // If have a missing serp in between dates, use the previous date's serp to fill the gap.
         const pastDateKey = `${pastDate.getFullYear()}-${pastDate.getMonth() + 1}-${pastDate.getDate()}`;
         const prevSerp = history[pastDateKey];
         const serpVal = prevSerp || (lastFoundSerp > 0 ? lastFoundSerp : 111);
         if (serpVal !== 0) { lastFoundSerp = prevSerp; }
         chartData.labels.push(pastDateKey);
         chartData.sreies.push(serpVal);
      }
   }
   // console.log(chartData);

   return chartData;
};
