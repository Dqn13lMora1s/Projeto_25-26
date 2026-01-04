// ==============================
// CONFIG
// ==============================
const apiUrl = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://your-backend-url.onrender.com";
const maxDataPoints = 30;

// ==============================
// DOM ELEMENTS
// ==============================
const latestTempSpan = document.getElementById('latest-temp');
const latestMoistureSpan = document.getElementById('latest-moisture');
const latestPhSpan = document.getElementById('latest-ph');

const dateFilterInput = document.getElementById('date-filter');
const filterButton = document.getElementById('filter-button');
const clearFilterButton = document.getElementById('clear-filter-button');

let realTimeChart;

// ==============================
// HELPER FUNCTIONS
// ==============================
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeOnly(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
    });
}


function updateLatestStats(data) {
    latestTempSpan.textContent = data.temperature.toFixed(2);
    latestMoistureSpan.textContent = data.moisture.toFixed(2);
    latestPhSpan.textContent = data.ph.toFixed(2);
}

// ==============================
// HISTORICAL DATA
// ==============================
async function loadHistoricalData(filterDate = null) {
    realTimeChart.data.labels = [];
    realTimeChart.data.datasets.forEach(ds => ds.data = []);

    try {
        // Always fetch all data
        const response = await fetch(`${apiUrl}/readings?_sort=timestamp&_order=asc`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        let history = await response.json();

        // 🟢 FRONTEND DATE FILTERING (THE FIX)
        if (filterDate) {
            history = history.filter(item => {
                const itemDate = new Date(item.timestamp)
                    .toISOString()
                    .split('T')[0];

                return itemDate === filterDate;
            });
        }

        if (history.length === 0) {
            console.warn("No data found for selected date.");
            realTimeChart.update();
            return;
        }

        history.forEach(item => {
            const label = filterDate
                ? formatTimeOnly(item.timestamp)
                : formatDateTime(item.timestamp);

            realTimeChart.data.labels.push(label);
            realTimeChart.data.datasets[0].data.push(item.temperature);
            realTimeChart.data.datasets[1].data.push(item.moisture);
            realTimeChart.data.datasets[2].data.push(item.ph);
        });

        realTimeChart.update('quiet');
        updateLatestStats(history[history.length - 1]);

        console.log(`Loaded ${history.length} points`);

    } catch (error) {
        console.error("Error loading historical data:", error);
    }
}

// ==============================
// FILTER HANDLER
// ==============================
function filterHistory() {
    const selectedDate = dateFilterInput.value;
    loadHistoricalData(selectedDate || null);
}

// ==============================
// CHART INITIALIZATION
// ==============================
function initChartStructure() {
    const ctx = document.getElementById('realTimeChart').getContext('2d');

    realTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperatura (°C)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    yAxisID: 'yTemp'
                },
                {
                    label: 'Humidade (%)',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    yAxisID: 'yMoisture'
                },
                {
                    label: 'pH',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    yAxisID: 'yPh'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tempo'
                    }
                },
                yTemp: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    },
                    suggestedMin: 15,
                    suggestedMax: 45
                },
                yMoisture: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Humidade (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                },
                yPh: {
                    type: 'linear',
                    display: false,
                    suggestedMin: 0,
                    suggestedMax: 14
                }
            }
        }
    });
}

// ==============================
// INITIALIZATION
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    initChartStructure();
    loadHistoricalData();

    if (filterButton) {
        filterButton.addEventListener('click', filterHistory);
    }

    if (clearFilterButton) {
        clearFilterButton.addEventListener('click', () => {
            dateFilterInput.value = '';
            filterHistory();
        });
    }
});
