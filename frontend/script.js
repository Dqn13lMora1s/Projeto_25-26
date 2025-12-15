// A URL base do seu Node.js/Express Backend (substitua pelo seu IP e porta)
const apiUrl = "http://localhost:5000";
const maxDataPoints = 30; // Limitar o gráfico a 30 pontos para clareza

// Referências aos elementos para mostrar o último valor
const latestTempSpan = document.getElementById('latest-temp');
const latestMoistureSpan = document.getElementById('latest-moisture');
const latestPhSpan = document.getElementById('latest-ph');

let realTimeChart;

// --- Funções de Ajuda ---

// Formata o timestamp para exibição (ex: "11:30:05 AM")
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-PT');
}

// Atualiza os valores do chart e da barra de estatísticas
function updateChartAndStats(data) {
    // 1. Atualizar o DOM com os valores mais recentes
    latestTempSpan.textContent = data.temperature.toFixed(2);
    latestMoistureSpan.textContent = data.moisture.toFixed(2);
    latestPhSpan.textContent = data.ph.toFixed(2);

    // 2. Adicionar o novo ponto ao gráfico
    const timeLabel = formatTime(data.timestamp);

    realTimeChart.data.labels.push(timeLabel);
    realTimeChart.data.datasets[0].data.push(data.temperature);
    realTimeChart.data.datasets[1].data.push(data.moisture);
    realTimeChart.data.datasets[2].data.push(data.ph);

    // 3. Remover o ponto mais antigo se o limite for excedido
    if (realTimeChart.data.labels.length > maxDataPoints) {
        realTimeChart.data.labels.shift();
        realTimeChart.data.datasets[0].data.shift();
        realTimeChart.data.datasets[1].data.shift();
        realTimeChart.data.datasets[2].data.shift();
    }

    // 4. Redesenhar o gráfico
    realTimeChart.update('quiet'); // 'quiet' evita animações para melhor performance
}

// --- Funções Principais ---

// 1. Configurar e Inicializar o Gráfico com os Dados Históricos
async function initChart() {
    const chartContext = document.getElementById('realTimeChart').getContext('2d');
    
    // Configuração inicial do Chart.js
    const chartConfig = {
        type: 'line',
        data: {
            labels: [], 
            datasets: [
                {
                    label: 'Temperatura (°C)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)', // Vermelho
                    yAxisID: 'yTemp',
                },
                {
                    label: 'Humidade (%)',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)', // Azul
                    yAxisID: 'yMoisture',
                },
                {
                    label: 'pH',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)', // Verde
                    yAxisID: 'yPh',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Permite que o chart ocupe o espaço total do container
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            scales: {
                x: {
                    title: { display: true, text: 'Tempo' }
                },
                yTemp: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Temperatura (°C)' },
                    suggestedMin: 15,
                    suggestedMax: 35
                },
                yMoisture: {
                    type: 'linear',
                    display: true,
                    position: 'right', // Eixo Y à direita
                    title: { display: true, text: 'Humidade (%)' },
                    grid: { drawOnChartArea: false }, // Desenha apenas o eixo, não as linhas
                    suggestedMin: 0,
                    suggestedMax: 100
                },
                yPh: {
                    type: 'linear',
                    display: false, // Pode ser escondido, mas útil para o tooltip
                    title: { display: true, text: 'pH' },
                    suggestedMin: 0,
                    suggestedMax: 14
                }
            }
        }
    };
    
    // Cria a instância do Chart.js
    realTimeChart = new Chart(chartContext, chartConfig);

    // Busca dados históricos (por exemplo, os últimos 50 pontos)
    try {
        const response = await fetch(`${apiUrl}/readings`); // Ajuste o endpoint se necessário
        const history = await response.json();

        history.forEach(item => {
            // Preenche o gráfico com dados históricos
            realTimeChart.data.labels.push(formatTime(item.timestamp));
            realTimeChart.data.datasets[0].data.push(item.temperature);
            realTimeChart.data.datasets[1].data.push(item.moisture);
            realTimeChart.data.datasets[2].data.push(item.ph);
        });

        realTimeChart.update();
        console.log(`Gráfico inicializado com ${history.length} pontos.`);

        // Atualiza as estatísticas com o último ponto
        if (history.length > 0) {
            updateChartAndStats(history[history.length - 1]);
        }

    } catch (error) {
        console.error('Erro ao buscar dados históricos:', error);
    }
}


// 2. Configurar a Conexão WebSocket
function setupSocketIo() {
    // Conecta-se ao servidor Node.js/Socket.io
    const socket = io(apiUrl); 

    socket.on('connect', () => {
        console.log('Conectado ao servidor WebSocket.');
    });

    // Escuta pelo evento 'new-data' que o servidor emite
    socket.on('new-data', (data) => {
        console.log('Dados em tempo real recebidos:', data);
        updateChartAndStats(data);
    });

    socket.on('disconnect', () => {
        console.warn('Desconectado do servidor WebSocket.');
    });
}

// Inicialização:
document.addEventListener('DOMContentLoaded', () => {
    initChart();     // 1. Configura o gráfico e carrega o histórico
    setupSocketIo(); // 2. Configura a escuta em tempo real
});