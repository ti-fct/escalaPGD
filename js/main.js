// Função para carregar o arquivo CSV externo
async function loadCSVFile() {
    try {
        //const response = await fetch('./utils/planilha_exportada.csv');
        const response = await fetch('https://ti-fct.github.io/escalaPGD/utils/planilha_exportada.csv');
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const csvText = await response.text();
        return csvText;
    } catch (error) {
        console.error('Erro ao carregar arquivo CSV:', error);
        // Fallback - você pode manter os dados originais como backup
        return `
Erro ao obtê-lo. Verifique a conexão com a internet ou o caminho do arquivo.
        Técnico,Modalidade,Segunda,Terca,Quarta,Quinta,Sexta
`;
    }
}

// Função para processar o CSV e extrair dados
function processCSV(csvText) {
    const result = Papa.parse(csvText, {
        skipEmptyLines: true,
        dynamicTyping: false,
        delimiter: ",",
        delimitersToGuess: [',', '\t', '|', ';']
    });
    
    const week1Data = [];
    const week2Data = [];
    let week1Dates = [];
    let week2Dates = [];
    
    let currentWeek = 0;
    let passedHeader = false;
    let headerRow = [];
    
    for (let i = 0; i < result.data.length; i++) {
        const row = result.data[i];
        
        // Detectar a Semana 1
        if (row[0] && row[0].includes("SEMANA 1")) {
            currentWeek = 1;
            passedHeader = false;
            if (row.length > 2 && row[2]) {
                week1Dates = row.slice(2).filter(item => item && item.trim() !== "");
            } else if (i + 1 < result.data.length) {
                const nextRow = result.data[i + 1];
                if (nextRow.length > 2) {
                    week1Dates = nextRow.slice(2).filter(item => item && item.trim() !== "");
                }
            }
            continue;
        }
        
        // Detectar a Semana 2
        if (row[0] && row[0].includes("SEMANA 2")) {
            currentWeek = 2;
            passedHeader = false;
            let foundDates = false;
            if (row.length > 2) {
                const potentialDates = row.slice(2).filter(item => item && item.trim() !== "");
                if (potentialDates.some(item => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(item))) {
                    week2Dates = potentialDates;
                    foundDates = true;
                }
            }
            
            if (!foundDates) {
                for (let j = i + 1; j < Math.min(i + 5, result.data.length); j++) {
                    const searchRow = result.data[j];
                    if (searchRow && searchRow.length > 2) {
                        const potentialDates = searchRow.slice(2).filter(item => item && item.trim() !== "");
                        if (potentialDates.some(item => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(item))) {
                            week2Dates = potentialDates;
                            break;
                        }
                    }
                }
            }
            continue;
        }
        
        // Pular linha de cabeçalho de cada semana
        if (row[0] === "Técnico") {
            passedHeader = true;
            headerRow = row;
            continue;
        }
        
        // Pular linhas vazias
        if (!row[0] || row[0].trim() === "") {
            continue;
        }
        
        // Ignorar linhas de observações
        if (row[0] && row[0].includes("Obsvervações")) {
            break;
        }
        
        // Processar dados das semanas
        if (currentWeek === 1 && passedHeader) {
            week1Data.push({
                tecnico: row[0],
                modalidade: row[1],
                segunda: row[2],
                terca: row[3],
                quarta: row[4],
                quinta: row[5],
                sexta: row[6]
            });
        } else if (currentWeek === 2 && passedHeader) {
            week2Data.push({
                tecnico: row[0],
                modalidade: row[1],
                segunda: row[2],
                terca: row[3],
                quarta: row[4],
                quinta: row[5],
                sexta: row[6]
            });
        }
    }
    
    console.log("Week 1 Data:", week1Data);
    console.log("Week 2 Data:", week2Data);
    console.log("Week 1 Dates:", week1Dates);
    console.log("Week 2 Dates:", week2Dates);
    
    return {
        week1: week1Data,
        week2: week2Data,
        week1Dates: week1Dates,
        week2Dates: week2Dates,
        observations: []
    };
}

// Função para exibir status com cor de fundo
function getStatusCell(status) {
    let bgClass = '';
    
    switch(status?.toUpperCase()) {
        case 'REMOTO':
            bgClass = 'bg-remoto';
            break;
        case 'PRESENCIAL':
            bgClass = 'bg-presencial';
            break;
        case 'ATIVIDADE EXTERNA':
            bgClass = 'bg-atividade-externa';
            break;
        case 'AFASTAMENTO':
            bgClass = 'bg-afastamento';
            break;
        case 'FÉRIAS':
            bgClass = 'bg-ferias';
        case 'FERIADO':
            bgClass = 'bg-ferias';
        case 'LICENÇA':
            bgClass = 'bg-licenca';
            break;
        case 'PARALISAÇÃO':
            bgClass = 'bg-paralisacao';
            break;
        default:
            bgClass = '';
    }

    return `<td class="${bgClass}">${status || ''}</td>`;
}

// Função para preencher a tabela
function fillTable(weekData, tableId) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';
    
    weekData.forEach(row => {
        let rowHtml = `
            <tr>
                <td>${row.tecnico}</td>
                <td>${row.modalidade}</td>
                ${getStatusCell(row.segunda)}
                ${getStatusCell(row.terca)}
                ${getStatusCell(row.quarta)}
                ${getStatusCell(row.quinta)}
                ${getStatusCell(row.sexta)}
            </tr>
        `;
        tableBody.innerHTML += rowHtml;
    });
}

// Função para atualizar os cabeçalhos das tabelas com as datas do CSV
function updateTableHeaders(weekDates, weekNumber) {
    const dias = ["segunda", "terca", "quarta", "quinta", "sexta"];
    
    if (weekDates && weekDates.length >= 5) {
        const firstDate = weekDates[0];
        const lastDate = weekDates[weekDates.length - 1];
        document.getElementById(`week${weekNumber}-dates`).textContent = `${firstDate} - ${lastDate}`;
        
        for (let i = 0; i < Math.min(dias.length, weekDates.length); i++) {
            const dia = dias[i];
            const header = document.getElementById(`week${weekNumber}-${dia}`);
            if (header) {
                const diaNome = dia.charAt(0).toUpperCase() + dia.slice(1);
                header.textContent = `${diaNome} (${weekDates[i]})`;
            }
        }
    } else {
        document.getElementById(`week${weekNumber}-dates`).textContent = `Semana ${weekNumber}`;
    }
}

function removeHighlight() {
    const allHeaders = document.querySelectorAll('#week1Table thead th, #week2Table thead th');
    allHeaders.forEach(header => {
        header.classList.remove('bg-primary', 'text-white', 'current-day-highlight');
    });
    
    const allCells = document.querySelectorAll('#week1Table tbody td, #week2Table tbody td');
    allCells.forEach(cell => {
        cell.classList.remove('current-day-highlight');
    });
}

// Função para destacar a data atual na tabela
async function highlightCurrentDate() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    console.log('Dia da semana atual:', dayOfWeek);
    console.log('Data atual:', today.toLocaleDateString('pt-BR'));
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = today.toLocaleDateString('pt-BR', options);
    }
    
    function isDateFormat(str) {
        return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str);
    }
    
    function parseDate(dateStr) {
        if (!isDateFormat(dateStr)) return null;
        const parts = dateStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    function findCurrentDateInWeek(weekDates, currentDate) {
        console.log('Procurando data atual em:', weekDates);
        for (let i = 0; i < weekDates.length; i++) {
            const dateObj = parseDate(weekDates[i]);
            console.log(`Comparando ${weekDates[i]} com ${currentDate.toLocaleDateString('pt-BR')}`);
            if (dateObj && 
                dateObj.getDate() === currentDate.getDate() &&
                dateObj.getMonth() === currentDate.getMonth() &&
                dateObj.getFullYear() === currentDate.getFullYear()) {
                console.log(`Data encontrada no índice ${i}`);
                return i;
            }
        }
        return -1;
    }
    
    removeHighlight();
    
    if (dayOfWeek < 1 || dayOfWeek > 5) {
        console.log('Fim de semana - não há destaque');
        return;
    }
    
    // Carregar dados do CSV externo
    const csvText = await loadCSVFile();
    const data = processCSV(csvText);
    
    console.log('Datas da semana 1:', data.week1Dates);
    console.log('Datas da semana 2:', data.week2Dates);
    
    let activeWeek = null;
    let dayIndex = -1;
    
    if (data.week1Dates && data.week1Dates.length >= 5) {
        dayIndex = findCurrentDateInWeek(data.week1Dates, today);
        if (dayIndex >= 0) {
            activeWeek = 1;
            console.log('Semana 1 ativa, índice do dia:', dayIndex);
        }
    }
    
    if (activeWeek === null && data.week2Dates && data.week2Dates.length >= 5) {
        dayIndex = findCurrentDateInWeek(data.week2Dates, today);
        if (dayIndex >= 0) {
            activeWeek = 2;
            console.log('Semana 2 ativa, índice do dia:', dayIndex);
        }
    }
    
    if (activeWeek === null) {
        console.log('Data atual não encontrada nas semanas. Usando fallback baseado no dia da semana.');
        
        const dayMapping = {
            1: 0, // Segunda
            2: 1, // Terça
            3: 2, // Quarta
            4: 3, // Quinta
            5: 4  // Sexta
        };
        
        dayIndex = dayMapping[dayOfWeek];
        activeWeek = 1;
        
        console.log('Usando fallback - Semana:', activeWeek, 'Índice do dia:', dayIndex);
    }
    
    if (activeWeek && dayIndex >= 0) {
        const tabElement = document.getElementById(`week${activeWeek}-tab`);
        if (tabElement) {
            tabElement.click();
        }
        
        const columnIndex = dayIndex + 2;
        
        const headerSelector = `#week${activeWeek}Table thead th:nth-child(${columnIndex + 1})`;
        const headerElement = document.querySelector(headerSelector);
        
        console.log('Seletor do cabeçalho:', headerSelector);
        console.log('Elemento do cabeçalho encontrado:', headerElement);
        
        if (headerElement) {
            headerElement.classList.add('bg-primary', 'text-white', 'current-day-highlight');
            
            const cellSelector = `#week${activeWeek}Table tbody td:nth-child(${columnIndex + 1})`;
            const cells = document.querySelectorAll(cellSelector);
            
            console.log('Seletor das células:', cellSelector);
            console.log('Células encontradas:', cells.length);
            
            cells.forEach(cell => {
                cell.classList.add('current-day-highlight');
                cell.style.backgroundColor = '#007bff';
                cell.style.color = 'white';
                cell.style.fontWeight = 'bold';
            });
            
            console.log('Destaque aplicado com sucesso!');
        } else {
            console.log('Elemento do cabeçalho não encontrado');
        }
    } else {
        console.log('Não foi possível determinar semana ativa ou índice do dia');
    }
}

async function initializeApp() {
    console.log('Carregando aplicação...');
    
    try {
        // Carregar dados do CSV externo
        const csvText = await loadCSVFile();
        const data = processCSV(csvText);
        
        // Preencher as tabelas
        fillTable(data.week1, 'week1Body');
        fillTable(data.week2, 'week2Body');
        
        // Atualizar os cabeçalhos com as datas dinâmicas
        updateTableHeaders(data.week1Dates, 1);
        updateTableHeaders(data.week2Dates, 2);
        
        // Inicializar DataTables
        $('#week1Table').DataTable({
            responsive: true,
            paging: false,
            info: false,
            searching: false,
            language: {
                zeroRecords: "Nenhum registro encontrado",
                infoEmpty: "Mostrando 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totais)"
            }
        });
        
        $('#week2Table').DataTable({
            responsive: true,
            paging: false,
            info: false,
            searching: false,
            language: {
                zeroRecords: "Nenhum registro encontrado",
                infoEmpty: "Mostrando 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totais)"
            }
        });
        
        // Aguardar um pouco para garantir que as tabelas foram renderizadas
        setTimeout(async () => {
            await highlightCurrentDate();
        }, 500);
        
        // Adicionar CSS personalizado para o destaque
        const style = document.createElement('style');
        style.textContent = `
            .current-day-highlight {
                box-shadow: inset 26px 0px 42px 0px rgba(0,0,0,0.1),inset -46px 0px 22px -3px rgba(0,0,0,0.1);
                border-right: 3px solid #0056b3 !important;
                border-left: 3px solid #0056b3 !important;
                font-weight: bold !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('Aplicação carregada com sucesso!');
        
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
    }
}

// Inicialização quando o documento estiver pronto
$(document).ready(function() {
    initializeApp();
});