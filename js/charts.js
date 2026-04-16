const Charts = {
    getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            text: isDark ? '#F3F4F6' : '#1e293b',
            grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            primary: '#4F46E5',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
            purple: '#8B5CF6',
            pink: '#EC4899',
            blue: '#3B82F6'
        };
    },

    renderStatusChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const colors = this.getThemeColors();
        const ctx = canvas.getContext('2d');
        
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) existingChart.destroy();

        if (Object.keys(data).length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '14px Inter';
            ctx.fillStyle = colors.text;
            ctx.globalAlpha = 0.5;
            ctx.fillText('No data available yet', canvas.width / 2, canvas.height / 2);
            ctx.globalAlpha = 1.0;
            return;
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Issues',
                    data: Object.values(data),
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    barThickness: 32
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: colors.grid, drawBorder: false },
                        ticks: { color: colors.text, font: { family: 'Inter' } }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: colors.text, font: { family: 'Inter' } }
                    }
                }
            }
        });
    },

    renderBarChart(canvasId, data, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const colors = this.getThemeColors();
        const ctx = canvas.getContext('2d');
        
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) existingChart.destroy();

        if (Object.keys(data).length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '14px Inter';
            ctx.fillStyle = colors.text;
            ctx.globalAlpha = 0.5;
            ctx.fillText('No data available yet', canvas.width / 2, canvas.height / 2);
            ctx.globalAlpha = 1.0;
            return;
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: label,
                    data: Object.values(data),
                    backgroundColor: colors.success,
                    borderRadius: 12,
                    barThickness: 32
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: colors.grid, drawBorder: false },
                        ticks: { color: colors.text, font: { family: 'Inter' } }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: colors.text, font: { family: 'Inter' } }
                    }
                }
            }
        });
    },

    renderLineChart(canvasId, data, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const colors = this.getThemeColors();
        const ctx = canvas.getContext('2d');
        
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) existingChart.destroy();

        if (Object.keys(data).length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '14px Inter';
            ctx.fillStyle = colors.text;
            ctx.globalAlpha = 0.5;
            ctx.fillText('No data available yet', canvas.width / 2, canvas.height / 2);
            ctx.globalAlpha = 1.0;
            return;
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colors.primary + '40'); // 25% opacity
        gradient.addColorStop(1, colors.primary + '00'); // 0% opacity

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: label,
                    data: Object.values(data),
                    borderColor: colors.primary,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: colors.grid, drawBorder: false },
                        ticks: { color: colors.text, font: { family: 'Inter' } }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: colors.text, font: { family: 'Inter' } }
                    }
                }
            }
        });
    }
};

window.Charts = Charts;
