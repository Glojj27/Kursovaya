let students = [];
let selectedStudentIndex = null;
let charts = {};

const FIELD_NAMES = {
    class: 'Класс',
    name: 'ФИО',
    math: 'Математика',
    russian: 'Русский язык',
    physics: 'Физика',
    literature: 'Литература'
};

function normalizeFieldName(fieldName) {
    const field = fieldName.trim();
    const mappings = {
        'Класс': FIELD_NAMES.class,
        'ФИО': FIELD_NAMES.name,
        'Математика': FIELD_NAMES.math,
        'Math': FIELD_NAMES.math,
        'Русский_язык': FIELD_NAMES.russian,
        'Русский язык': FIELD_NAMES.russian,
        'Russian': FIELD_NAMES.russian,
        'Физика': FIELD_NAMES.physics,
        'Physics': FIELD_NAMES.physics,
        'Литература': FIELD_NAMES.literature,
        'Literature': FIELD_NAMES.literature
    };
    
    return mappings[field] || field;
}

function getUniqueClasses() {
    const classes = new Set();
    students.forEach(student => {
        if (student[FIELD_NAMES.class]) {
            const className = student[FIELD_NAMES.class].toString().trim();
            if (className) {
                classes.add(className);
            }
        }
    });
    return Array.from(classes).sort();
}

class GradeJournal {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showTab('upload');
        this.renderAllTables();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.getAttribute('data-tab');
                this.showTab(tab);
            });
        });

        document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    }

    showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        if (tabName === 'stats_table') {
            this.renderStatsTables();
        } else if (tabName === 'stats_graph') {
            setTimeout(() => this.renderCharts(), 100);
        }
    }

    renderAllTables() {
        this.renderUploadedTable();
        this.renderGradeTable();
        this.updateFileInfo();
    }

    renderUploadedTable() {
        const container = document.getElementById('uploadedTable');
        container.innerHTML = this.generateTableHTML(students);
    }

    renderGradeTable() {
        const container = document.getElementById('gradeTable');
        container.innerHTML = this.generateTableHTML(students, true);
        
        setTimeout(() => {
            const rows = container.querySelectorAll('tbody tr');
            rows.forEach((row, index) => {
                row.addEventListener('click', () => this.selectStudent(row, index));
            });
        }, 0);
    }

    renderStatsTables() {
        this.renderClassStatsTable();
        this.renderOverallStatsTable();
    }

    renderClassStatsTable() {
        const container = document.getElementById('classStatsTable');
        const classes = getUniqueClasses();
        const subjects = [FIELD_NAMES.math, FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature];

        if (classes.length === 0 || students.length === 0) {
            container.innerHTML = '<p>Нет данных для отображения</p>';
            return;
        }

        let html = '<table><tr><th>Класс</th><th>Предмет</th><th>Средняя</th><th>Медиана</th>';
        for (let i = 1; i <= 5; i++) {
            html += `<th>${i} (кол-во)</th><th>${i} (%)</th>`;
        }
        html += '</tr>';

        classes.forEach(className => {
            subjects.forEach(subject => {
                const classStudents = students.filter(s => s[FIELD_NAMES.class] === className);
                const stats = this.calculateSubjectStats(classStudents, subject);
                html += `<tr>
                    <td>${className}</td>
                    <td>${subject}</td>
                    <td>${stats.average.toFixed(2)}</td>
                    <td>${stats.median.toFixed(2)}</td>`;
                for (let i = 1; i <= 5; i++) {
                    html += `<td>${stats.gradeCount[i] || 0}</td>
                            <td>${stats.gradePercent[i] || '0.00'}%</td>`;
                }
                html += '</tr>';
            });
        });

        html += '</table>';
        container.innerHTML = html;
    }

    renderOverallStatsTable() {
        const container = document.getElementById('overallStatsTable');
        const subjects = [FIELD_NAMES.math, FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature];

        if (students.length === 0) {
            container.innerHTML = '<p>Нет данных для отображения</p>';
            return;
        }

        let html = '<table><tr><th>Предмет</th><th>Средняя</th><th>Медиана</th>';
        for (let i = 1; i <= 5; i++) {
            html += `<th>${i} (кол-во)</th><th>${i} (%)</th>`;
        }
        html += '</tr>';

        subjects.forEach(subject => {
            const stats = this.calculateSubjectStats(students, subject);
            html += `<tr>
                <td>${subject}</td>
                <td>${stats.average.toFixed(2)}</td>
                <td>${stats.median.toFixed(2)}</td>`;
            for (let i = 1; i <= 5; i++) {
                html += `<td>${stats.gradeCount[i] || 0}</td>
                        <td>${stats.gradePercent[i] || '0.00'}%</td>`;
            }
            html += '</tr>';
        });

        html += '</table>';
        container.innerHTML = html;
    }

    calculateSubjectStats(studentsList, subject) {
        const grades = studentsList.map(s => {
            const grade = s[subject];
            return grade ? parseInt(grade) : NaN;
        }).filter(g => !isNaN(g));
        
        if (grades.length === 0) return { average: 0, median: 0, gradeCount: {}, gradePercent: {} };

        const average = grades.reduce((a, b) => a + b, 0) / grades.length;
        
        const sorted = [...grades].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0 
            ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2 
            : sorted[Math.floor(sorted.length/2)];

        const gradeCount = {};
        const gradePercent = {};
        for (let i = 1; i <= 5; i++) {
            gradeCount[i] = grades.filter(g => g === i).length;
            gradePercent[i] = ((gradeCount[i] / grades.length) * 100).toFixed(2);
        }

        return { average, median, gradeCount, gradePercent };
    }

    renderCharts() {
        this.destroyCharts();
        this.renderClassAvgChart();
        this.renderGradeDistributionChart();
        this.renderOverallPerformanceChart();
    }

    destroyCharts() {
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
    }

    renderClassAvgChart() {
        const ctx = document.getElementById('classAvgChart').getContext('2d');
        const classes = getUniqueClasses();
        const subjects = [FIELD_NAMES.math, FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature];

        if (classes.length === 0 || students.length === 0) {
            ctx.canvas.parentElement.innerHTML = '<p>Нет данных для построения графика</p>';
            return;
        }

        const datasets = subjects.map((subject, index) => {
            const data = classes.map(className => {
                const classStudents = students.filter(s => s[FIELD_NAMES.class] === className);
                const grades = classStudents.map(s => {
                    const grade = s[subject];
                    return grade ? parseInt(grade) : NaN;
                }).filter(g => !isNaN(g));
                
                return grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
            });

            const colors = [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)'
            ];

            return {
                label: subject,
                data: data,
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                tension: 0.4,
                fill: false
            };
        });

        charts.classAvg = new Chart(ctx, {
            type: 'line',
            data: {
                labels: classes,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        title: {
                            display: true,
                            text: 'Средняя оценка'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Классы'
                        }
                    }
                }
            }
        });
    }

    renderGradeDistributionChart() {
        const ctx = document.getElementById('gradeDistributionChart').getContext('2d');
        const subjects = [FIELD_NAMES.math, FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature];
        
        if (students.length === 0) {
            ctx.canvas.parentElement.innerHTML = '<p>Нет данных для построения графика</p>';
            return;
        }

        const datasets = [];
        const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];

        for (let grade = 1; grade <= 5; grade++) {
            const data = subjects.map(subject => {
                const grades = students.map(s => {
                    const g = s[subject];
                    return g ? parseInt(g) : NaN;
                }).filter(g => !isNaN(g));
                
                return grades.filter(g => g === grade).length;
            });

            datasets.push({
                label: `Оценка ${grade}`,
                data: data,
                backgroundColor: colors[grade-1],
                borderColor: colors[grade-1],
                borderWidth: 1
            });
        }

        charts.gradeDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Предметы'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество оценок'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    renderOverallPerformanceChart() {
        const ctx = document.getElementById('overallPerformanceChart').getContext('2d');
        const subjects = [FIELD_NAMES.math, FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature];
        
        if (students.length === 0) {
            ctx.canvas.parentElement.innerHTML = '<p>Нет данных для построения графика</p>';
            return;
        }

        const averages = subjects.map(subject => {
            const grades = students.map(s => {
                const grade = s[subject];
                return grade ? parseInt(grade) : NaN;
            }).filter(g => !isNaN(g));
            
            return grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
        });

        charts.overallPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Средняя оценка',
                    data: averages,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        title: {
                            display: true,
                            text: 'Средняя оценка'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Предметы'
                        }
                    }
                }
            }
        });
    }

    generateTableHTML(data, selectable = false) {
        if (data.length === 0) {
            return '<p>Данные не загружены</p>';
        }

        const headers = [FIELD_NAMES.class, FIELD_NAMES.name, FIELD_NAMES.math, 
                       FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature];
        
        let html = `
            <table>
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((row, index) => {
            const selected = selectable && index === selectedStudentIndex ? 'style="background-color: #e3f2fd;"' : '';
            html += `<tr ${selected}>`;
            headers.forEach(header => {
                html += `<td>${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    selectStudent(row, index) {
        document.querySelectorAll('#gradeTable tr').forEach(r => {
            r.style.backgroundColor = '';
        });
        row.style.backgroundColor = '#e3f2fd';
        selectedStudentIndex = index;

        const student = students[index];
        document.getElementById('studentClass').value = student[FIELD_NAMES.class] || '';
        document.getElementById('studentName').value = student[FIELD_NAMES.name] || '';
        document.getElementById('mathGrade').value = student[FIELD_NAMES.math] || '';
        document.getElementById('russianGrade').value = student[FIELD_NAMES.russian] || '';
        document.getElementById('physicsGrade').value = student[FIELD_NAMES.physics] || '';
        document.getElementById('literatureGrade').value = student[FIELD_NAMES.literature] || '';
    }

    updateFileInfo() {
        const container = document.getElementById('fileInfo');
        if (students.length > 0) {
            const classes = getUniqueClasses();
            container.innerHTML = `
                <p><strong>Загружено записей:</strong> ${students.length}</p>
                <p><strong>Классы:</strong> ${classes.join(', ')}</p>
                <p><strong>Предметы:</strong> ${[FIELD_NAMES.math, FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature].join(', ')}</p>
            `;
        } else {
            container.innerHTML = '<p>Файл не загружен</p>';
        }
    }
}

function loadSampleData() {
    students = [
        { [FIELD_NAMES.class]: "10A", [FIELD_NAMES.name]: "Иванов А.И.", [FIELD_NAMES.math]: 5, [FIELD_NAMES.russian]: 4, [FIELD_NAMES.physics]: 5, [FIELD_NAMES.literature]: 4 },
        { [FIELD_NAMES.class]: "10A", [FIELD_NAMES.name]: "Петрова С.К.", [FIELD_NAMES.math]: 4, [FIELD_NAMES.russian]: 5, [FIELD_NAMES.physics]: 4, [FIELD_NAMES.literature]: 5 },
        { [FIELD_NAMES.class]: "10B", [FIELD_NAMES.name]: "Сидоров Д.М.", [FIELD_NAMES.math]: 3, [FIELD_NAMES.russian]: 4, [FIELD_NAMES.physics]: 4, [FIELD_NAMES.literature]: 3 },
        { [FIELD_NAMES.class]: "10B", [FIELD_NAMES.name]: "Козлова М.П.", [FIELD_NAMES.math]: 5, [FIELD_NAMES.russian]: 3, [FIELD_NAMES.physics]: 5, [FIELD_NAMES.literature]: 4 },
        { [FIELD_NAMES.class]: "11A", [FIELD_NAMES.name]: "Николаев В.С.", [FIELD_NAMES.math]: 4, [FIELD_NAMES.russian]: 4, [FIELD_NAMES.physics]: 3, [FIELD_NAMES.literature]: 5 },
        { [FIELD_NAMES.class]: "11A", [FIELD_NAMES.name]: "Орлова Е.Д.", [FIELD_NAMES.math]: 5, [FIELD_NAMES.russian]: 5, [FIELD_NAMES.physics]: 5, [FIELD_NAMES.literature]: 4 }
    ];
    gradeJournal.renderAllTables();
    alert('Пример данных загружен!');
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        parseExcel(file);
    } else if (fileExtension === 'csv' || fileExtension === 'txt') {
        parseTextFile(file);
    } else {
        alert('Неподдерживаемый формат файла. Используйте CSV, TXT, XLSX или XLS.');
    }
}

function parseTextFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            parseCSV(content);
        } catch (error) {
            alert('Ошибка при чтении файла: ' + error.message);
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) {
                alert('Файл Excel пустой');
                return;
            }
            
            const rawHeaders = jsonData[0];
            const headers = rawHeaders.map(normalizeFieldName);
            
            students = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row && row.length > 0) {
                    const record = {};
                    rawHeaders.forEach((rawHeader, index) => {
                        const normalizedHeader = normalizeFieldName(rawHeader);
                        record[normalizedHeader] = row[index] ? row[index].toString().trim() : '';
                    });
                    
                    if (!record[FIELD_NAMES.class]) record[FIELD_NAMES.class] = '';
                    if (!record[FIELD_NAMES.name]) record[FIELD_NAMES.name] = '';
                    
                    students.push(record);
                }
            }
            
            gradeJournal.renderAllTables();
            alert(`Успешно загружено ${students.length} записей из Excel файла`);
            
        } catch (error) {
            alert('Ошибка при чтении Excel файла: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        alert('Файл пустой');
        return;
    }

    const rawHeaders = lines[0].split(',').map(h => h.trim());
    const headers = rawHeaders.map(normalizeFieldName);
    
    students = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            if (values.length === rawHeaders.length) {
                const record = {};
                rawHeaders.forEach((rawHeader, index) => {
                    const normalizedHeader = normalizeFieldName(rawHeader);
                    record[normalizedHeader] = values[index].trim();
                });
                
                if (!record[FIELD_NAMES.class]) record[FIELD_NAMES.class] = '';
                if (!record[FIELD_NAMES.name]) record[FIELD_NAMES.name] = '';
                
                students.push(record);
            }
        }
    }

    gradeJournal.renderAllTables();
    alert(`Успешно загружено ${students.length} записей`);
}

function addStudent() {
    const className = document.getElementById('studentClass').value.trim();
    const name = document.getElementById('studentName').value.trim();
    
    if (!className) {
        alert('Введите название класса');
        return;
    }
    
    if (!name) {
        alert('Введите ФИО ученика');
        return;
    }

    const newStudent = {
        [FIELD_NAMES.class]: className,
        [FIELD_NAMES.name]: name,
        [FIELD_NAMES.math]: document.getElementById('mathGrade').value || '',
        [FIELD_NAMES.russian]: document.getElementById('russianGrade').value || '',
        [FIELD_NAMES.physics]: document.getElementById('physicsGrade').value || '',
        [FIELD_NAMES.literature]: document.getElementById('literatureGrade').value || ''
    };

    students.push(newStudent);
    clearForm();
    gradeJournal.renderAllTables();
}

function updateStudent() {
    if (selectedStudentIndex === null) {
        alert('Выберите ученика для редактирования');
        return;
    }

    const className = document.getElementById('studentClass').value.trim();
    const name = document.getElementById('studentName').value.trim();
    
    if (!className) {
        alert('Введите название класса');
        return;
    }
    
    if (!name) {
        alert('Введите ФИО ученика');
        return;
    }

    students[selectedStudentIndex] = {
        [FIELD_NAMES.class]: className,
        [FIELD_NAMES.name]: name,
        [FIELD_NAMES.math]: document.getElementById('mathGrade').value || '',
        [FIELD_NAMES.russian]: document.getElementById('russianGrade').value || '',
        [FIELD_NAMES.physics]: document.getElementById('physicsGrade').value || '',
        [FIELD_NAMES.literature]: document.getElementById('literatureGrade').value || ''
    };

    clearForm();
    gradeJournal.renderAllTables();
    selectedStudentIndex = null;
}

function deleteStudent() {
    if (selectedStudentIndex === null) {
        alert('Выберите ученика для удаления');
        return;
    }

    if (confirm('Удалить этого ученика?')) {
        students.splice(selectedStudentIndex, 1);
        clearForm();
        gradeJournal.renderAllTables();
        selectedStudentIndex = null;
    }
}

function downloadJournal(format) {
    if (students.length === 0) {
        alert('Нет данных для сохранения');
        return;
    }

    const headers = [FIELD_NAMES.class, FIELD_NAMES.name, FIELD_NAMES.math, 
                   FIELD_NAMES.russian, FIELD_NAMES.physics, FIELD_NAMES.literature];
    
    switch(format) {
        case 'csv':
            downloadCSV(headers);
            break;
        case 'excel':
            downloadExcel(headers);
            break;
        case 'txt':
            downloadTXT(headers);
            break;
        default:
            alert('Неизвестный формат файла');
    }
}

function downloadCSV(headers) {
    const BOM = '\uFEFF';
    
    const csvContent = [
        headers.join(','),
        ...students.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                if (value.toString().includes(',') || value.toString().includes('"')) {
                    return '"' + value.toString().replace(/"/g, '""') + '"';
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'journal.csv');
}

function downloadExcel(headers) {
    try {
        const worksheetData = [
            headers,
            ...students.map(row => headers.map(header => row[header] || ''))
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        const colWidths = headers.map(() => ({ wch: 20 }));
        worksheet['!cols'] = colWidths;
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Журнал оценок");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        downloadFile(blob, 'journal.xlsx');
    } catch (error) {
        alert('Ошибка при создании Excel файла: ' + error.message);
    }
}

function downloadTXT(headers) {
    const txtContent = [
        headers.join(','),
        ...students.map(row => 
            headers.map(header => row[header] || '').join(',')
        )
    ].join('\n');
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, 'journal.txt');
}

function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function clearForm() {
    document.getElementById('studentClass').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('mathGrade').value = '';
    document.getElementById('russianGrade').value = '';
    document.getElementById('physicsGrade').value = '';
    document.getElementById('literatureGrade').value = '';
}

let gradeJournal;
document.addEventListener('DOMContentLoaded', () => {
    gradeJournal = new GradeJournal();
});