import { Injectable } from '@nestjs/common';

export interface ChartData {
  type: string;
  data: any;
  options: any;
}

@Injectable()
export class DataVisualizationService {
  // Generate visualization specifications
  generateLineChart(
    data: { x: any[]; y: number[]; label?: string }[],
    options?: any,
  ): ChartData {
    return {
      type: 'line',
      data: {
        datasets: data.map((series) => ({
          label: series.label || 'Series',
          data: series.x.map((x, i) => ({ x, y: series.y[i] })),
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Line Chart',
          },
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: options?.xLabel || 'X Axis',
            },
          },
          y: {
            title: {
              display: true,
              text: options?.yLabel || 'Y Axis',
            },
          },
        },
        ...options,
      },
    };
  }

  generateBarChart(
    labels: string[],
    datasets: Array<{ label: string; data: number[]; backgroundColor?: string }>,
    options?: any,
  ): ChartData {
    return {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((ds) => ({
          ...ds,
          backgroundColor: ds.backgroundColor || 'rgba(54, 162, 235, 0.5)',
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Bar Chart',
          },
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: options?.yLabel || 'Value',
            },
          },
        },
        ...options,
      },
    };
  }

  generatePieChart(
    labels: string[],
    data: number[],
    options?: any,
  ): ChartData {
    return {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: this.generateColors(labels.length),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Pie Chart',
          },
          legend: {
            position: 'right',
          },
        },
        ...options,
      },
    };
  }

  generateScatterPlot(
    data: Array<{ x: number; y: number; label?: string }>,
    options?: any,
  ): ChartData {
    return {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: options?.label || 'Data Points',
            data,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Scatter Plot',
          },
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: options?.xLabel || 'X Axis',
            },
          },
          y: {
            title: {
              display: true,
              text: options?.yLabel || 'Y Axis',
            },
          },
        },
        ...options,
      },
    };
  }

  generateHeatmap(
    data: number[][],
    xLabels: string[],
    yLabels: string[],
    options?: any,
  ): ChartData {
    return {
      type: 'heatmap',
      data: {
        labels: xLabels,
        datasets: yLabels.map((yLabel, i) => ({
          label: yLabel,
          data: data[i],
        })),
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Heatmap',
          },
          legend: {
            display: false,
          },
        },
        ...options,
      },
    };
  }

  generateBoxPlot(
    data: Array<{
      label: string;
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    }>,
    options?: any,
  ): ChartData {
    return {
      type: 'boxplot',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Distribution',
            data: data.map((d) => ({
              min: d.min,
              q1: d.q1,
              median: d.median,
              q3: d.q3,
              max: d.max,
            })),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Box Plot',
          },
        },
        ...options,
      },
    };
  }

  generateHistogram(
    data: number[],
    bins: number = 10,
    options?: any,
  ): ChartData {
    const { binEdges, frequencies } = this.calculateHistogram(data, bins);

    const labels = binEdges.slice(0, -1).map((edge, i) =>
      `${edge.toFixed(2)}-${binEdges[i + 1].toFixed(2)}`,
    );

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Frequency',
            data: frequencies,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Histogram',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency',
            },
          },
          x: {
            title: {
              display: true,
              text: options?.xLabel || 'Value Range',
            },
          },
        },
        ...options,
      },
    };
  }

  generateCorrelationMatrix(
    correlationMatrix: number[][],
    variables: string[],
  ): ChartData {
    return this.generateHeatmap(
      correlationMatrix,
      variables,
      variables,
      {
        title: 'Correlation Matrix',
        scales: {
          z: {
            min: -1,
            max: 1,
          },
        },
      },
    );
  }

  generateTimeSeries(
    timestamps: Date[],
    values: number[],
    options?: any,
  ): ChartData {
    return {
      type: 'line',
      data: {
        labels: timestamps.map((t) => t.toISOString()),
        datasets: [
          {
            label: options?.label || 'Time Series',
            data: values,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: options?.title || 'Time Series',
          },
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: options?.timeUnit || 'day',
            },
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            title: {
              display: true,
              text: options?.yLabel || 'Value',
            },
          },
        },
        ...options,
      },
    };
  }

  // Helper methods
  private calculateHistogram(
    data: number[],
    bins: number,
  ): { binEdges: number[]; frequencies: number[] } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;

    const binEdges = Array.from(
      { length: bins + 1 },
      (_, i) => min + i * binWidth,
    );

    const frequencies = Array(bins).fill(0);

    data.forEach((value) => {
      let binIndex = Math.floor((value - min) / binWidth);
      if (binIndex >= bins) binIndex = bins - 1;
      if (binIndex < 0) binIndex = 0;
      frequencies[binIndex]++;
    });

    return { binEdges, frequencies };
  }

  private generateColors(count: number): string[] {
    const colors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(153, 102, 255, 0.5)',
      'rgba(255, 159, 64, 0.5)',
    ];

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }

    return result;
  }
}
