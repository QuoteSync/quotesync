<template>
  <!-- No changes to template section -->
</template>

<script>
import UserService from '../services/UserService';

export default {
  methods: {
    async setupChartData() {
      try {
        const activityData = await UserService.getUserActivity();
        
        // Extract dates and counts from the activity data
        const labels = activityData.map(day => day.date);
        const quotesData = activityData.map(day => day.quotes_count);
        const importsData = activityData.map(day => day.imports_count);
        
        // Goal line data (assuming 5 quotes per day as goal)
        const goalData = new Array(labels.length).fill(5);
        
        if (this.activityChart) {
          this.activityChart.destroy();
        }
        
        // Get the canvas element
        const ctx = document.getElementById('activityChart');
        
        // Create a new chart
        this.activityChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Quotes Added',
                data: quotesData,
                borderColor: '#3e95cd',
                backgroundColor: 'rgba(62, 149, 205, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              },
              {
                label: 'Quotes Imported',
                data: importsData,
                borderColor: '#42b983',
                backgroundColor: 'rgba(66, 185, 131, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              },
              {
                label: 'Daily Goal',
                data: goalData,
                borderColor: 'rgba(255, 99, 132, 0.7)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(200, 200, 200, 0.1)'
                },
                ticks: {
                  precision: 0
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false
              },
              legend: {
                position: 'top'
              }
            }
          }
        });
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    }
  }
}
</script>

<style>
  /* No changes to style section */
</style> 