// Dados do CSV
const csvData = `
SEMANA 1,  ,26/05/2025,27/05/2025,28/05/2025,29/05/2025,30/05/2025,
Técnico,Modalidade,Segunda,Terça ,Quarta,Quinta,Sexta,
Antônio R.,PGD,REMOTO,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,
Edna F.,PGD,PRESENCIAL,PRESENCIAL,PRESENCIAL,REMOTO,PRESENCIAL,
Francisco F.,PGD,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,REMOTO,
Guilherme R.,PGD,PRESENCIAL,REMOTO,PRESENCIAL,FÉRIAS,FÉRIAS,
Heron C.,CONT. DE FREQ.,PRESENCIAL,ATIVIDADE EXTERNA,PRESENCIAL,PRESENCIAL,PRESENCIAL,
Igor S.,PGD,REMOTO,PRESENCIAL,PRESENCIAL,ATIVIDADE EXTERNA,ATIVIDADE EXTERNA,
Iuri B.,PGD,PRESENCIAL,PRESENCIAL,REMOTO,PRESENCIAL,PRESENCIAL,
Lara B.,CONT. DE FREQ.,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,
Mateus R.,CONT. DE FREQ.,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,
Matheus M.,PGD,PRESENCIAL,PRESENCIAL,ATIVIDADE EXTERNA,ATIVIDADE EXTERNA,ATIVIDADE EXTERNA,
Nelson D.,CONT. DE FREQ.,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,
Valmir R.,PGD,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,REMOTO,
,,,,,,,
SEMANA 2, ,02/06/2025,03/06/2025,04/06/2025,05/06/2025,06/06/2025,
Técnico,Modalidade,Segunda,Terça ,Quarta,Quinta,Sexta,
Antônio R.,PGD,PRESENCIAL,PRESENCIAL,REMOTO,PRESENCIAL,PRESENCIAL,
Edna F.,PGD,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,REMOTO,
Francisco F.,PGD,REMOTO,ATIVIDADE EXTERNA,PRESENCIAL,PRESENCIAL,PRESENCIAL,
Guilherme R.,PGD,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,REMOTO,
Heron C.,CONT. DE FREQ.,PRESENCIAL,ATIVIDADE EXTERNA,PRESENCIAL,PRESENCIAL,PRESENCIAL,
Igor S.,PGD,REMOTO,LICENÇA,PRESENCIAL,PRESENCIAL,PRESENCIAL,
Iuri B.,PGD,PRESENCIAL,PRESENCIAL,REMOTO,PRESENCIAL,PRESENCIAL,
Lara B.,CONT. DE FREQ.,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,
Mateus R.,CONT. DE FREQ.,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,AFASTAMENTO,
Matheus M.,PGD,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,REMOTO,
Nelson D.,CONT. DE FREQ.,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,
Valmir R.,PGD,PRESENCIAL,PRESENCIAL,PRESENCIAL,PRESENCIAL,REMOTO,
,,,,,,,
Obsvervações:                     ,,,,,,,
- Horário de funcionamento do setor: 07h30 ás 16h30,,,,,,,
"- Sujeito a alteração conforme RESOLUÇÃO CONSUNI/UFG Nº 264, DE 14 DE JUNHO DE 2024",,,,,,,
"- Lara B.: Afastamento conforme a Portaria SIG n° 345/2024, no Processo SEI n° 23070.071858/2023-25",,,,,,,
"- Mateus R.: Afastamento conforme a Portaria SIG nº 6388/2024, no Processo SEI nº 23070.048422/2024-13",,,,,,,

`;

// Função para processar o CSV e extrair dados
function processCSV(csvText) {
    const result = Papa.parse(csvText, {
        skipEmptyLines: true,
        dynamicTyping: false,
        // Ajustar o delimitador para resolver problemas de parsing
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
            // Capturar a linha de datas (deve ser a próxima linha ou a mesma)
            if (row.length > 2 && row[2]) {
                week1Dates = row.slice(2).filter(item => item && item.trim() !== "");
            } else if (i + 1 < result.data.length) {
                // Se não encontrar na mesma linha, procurar na próxima
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
            // Para semana 2, procurar por uma linha com datas (formato DD/MM/YYYY)
            // Primeiro verificar se há datas na linha atual
            let foundDates = false;
            if (row.length > 2) {
                const potentialDates = row.slice(2).filter(item => item && item.trim() !== "");
                if (potentialDates.some(item => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(item))) {
                    week2Dates = potentialDates;
                    foundDates = true;
                }
            }
            
            // Se não encontrou datas, procurar nas próximas linhas
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
            break; // Parar de processar a partir daqui
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
        // Atualizar o texto do intervalo de datas na aba
        const firstDate = weekDates[0];
        const lastDate = weekDates[weekDates.length - 1];
        document.getElementById(`week${weekNumber}-dates`).textContent = `${firstDate} - ${lastDate}`;
        
        // Atualizar os cabeçalhos de cada coluna com as datas
        for (let i = 0; i < Math.min(dias.length, weekDates.length); i++) {
            const dia = dias[i];
            const header = document.getElementById(`week${weekNumber}-${dia}`);
            if (header) {
                const diaNome = dia.charAt(0).toUpperCase() + dia.slice(1);
                header.textContent = `${diaNome} (${weekDates[i]})`;
            }
        }
    } else {
        // Fallback para caso não tenhamos datas no CSV
        document.getElementById(`week${weekNumber}-dates`).textContent = `Semana ${weekNumber}`;
    }
}

// Função para remover destaque anterior
function removeHighlight() {
    // Remove destaque de todas as colunas de ambas as tabelas
    const allHeaders = document.querySelectorAll('#week1Table thead th, #week2Table thead th');
    allHeaders.forEach(header => {
        header.classList.remove('bg-primary', 'text-white', 'current-day-highlight');
    });
    
    // Remove destaque das células do corpo das tabelas
    const allCells = document.querySelectorAll('#week1Table tbody td, #week2Table tbody td');
    allCells.forEach(cell => {
        cell.classList.remove('current-day-highlight');
    });
}

// Função para destacar a data atual na tabela
function highlightCurrentDate() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    
    console.log('Dia da semana atual:', dayOfWeek); // Debug
    console.log('Data atual:', today.toLocaleDateString('pt-BR')); // Debug
    
    // Exibir data atual formatada
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = today.toLocaleDateString('pt-BR', options);
    }
    
    // Função para verificar se a data está no formato DD/MM/YYYY
    function isDateFormat(str) {
        return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str);
    }
    
    // Função para converter string de data (DD/MM/YYYY) em objeto Date
    function parseDate(dateStr) {
        if (!isDateFormat(dateStr)) return null;
        const parts = dateStr.split('/');
        // Mês em JavaScript é 0-indexed (0 = Janeiro)
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    function isDateInRange(date, startDateStr, endDateStr) {
        const startDate = parseDate(startDateStr);
        const endDate = parseDate(endDateStr);
        
        if (!startDate || !endDate) return false;
        
        // Ajustar endDate para incluir todo o dia
        endDate.setHours(23, 59, 59, 999);
        
        return date >= startDate && date <= endDate;
    }
    
    // Função para encontrar qual data específica corresponde ao dia atual
    function findCurrentDateInWeek(weekDates, currentDate) {
        console.log('Procurando data atual em:', weekDates); // Debug
        for (let i = 0; i < weekDates.length; i++) {
            const dateObj = parseDate(weekDates[i]);
            console.log(`Comparando ${weekDates[i]} com ${currentDate.toLocaleDateString('pt-BR')}`); // Debug
            if (dateObj && 
                dateObj.getDate() === currentDate.getDate() &&
                dateObj.getMonth() === currentDate.getMonth() &&
                dateObj.getFullYear() === currentDate.getFullYear()) {
                console.log(`Data encontrada no índice ${i}`); // Debug
                return i; // Retorna o índice da data encontrada
            }
        }
        return -1; // Não encontrou
    }
    
    // Remover destaque anterior
    removeHighlight();
    
    // Verificar se é dia da semana (segunda a sexta)
    if (dayOfWeek < 1 || dayOfWeek > 5) {
        console.log('Fim de semana - não há destaque'); // Debug
        return; // Não destacar em finais de semana
    }
    
    // Processar dados para obter as datas corretas
    const data = processCSV(csvData);
    console.log('Datas da semana 1:', data.week1Dates); // Debug
    console.log('Datas da semana 2:', data.week2Dates); // Debug
    
    let activeWeek = null;
    let dayIndex = -1;
    
    // Verificar se a data atual está na semana 1
    if (data.week1Dates && data.week1Dates.length >= 5) {
        dayIndex = findCurrentDateInWeek(data.week1Dates, today);
        if (dayIndex >= 0) {
            activeWeek = 1;
            console.log('Semana 1 ativa, índice do dia:', dayIndex); // Debug
        }
    }
    
    // Se não encontrou na semana 1, verificar semana 2
    if (activeWeek === null && data.week2Dates && data.week2Dates.length >= 5) {
        dayIndex = findCurrentDateInWeek(data.week2Dates, today);
        if (dayIndex >= 0) {
            activeWeek = 2;
            console.log('Semana 2 ativa, índice do dia:', dayIndex); // Debug
        }
    }
    
    // Se ainda não encontrou, tentar destacar baseado no dia da semana atual
    // (fallback para quando as datas do CSV não correspondem à data atual)
    if (activeWeek === null) {
        console.log('Data atual não encontrada nas semanas. Usando fallback baseado no dia da semana.'); // Debug
        
        // Mapear dia da semana para índice (Segunda=0, Terça=1, etc.)
        const dayMapping = {
            1: 0, // Segunda
            2: 1, // Terça
            3: 2, // Quarta
            4: 3, // Quinta
            5: 4  // Sexta
        };
        
        dayIndex = dayMapping[dayOfWeek];
        activeWeek = 1; // Usar semana 1 como padrão
        
        console.log('Usando fallback - Semana:', activeWeek, 'Índice do dia:', dayIndex); // Debug
    }
    
    if (activeWeek && dayIndex >= 0) {
        // Ativar a aba correta
        const tabElement = document.getElementById(`week${activeWeek}-tab`);
        if (tabElement) {
            tabElement.click();
        }
        
        // Destacar o cabeçalho da coluna
        // Índice da coluna: 0=Técnico, 1=Modalidade, 2=Segunda, 3=Terça, 4=Quarta, 5=Quinta, 6=Sexta
        const columnIndex = dayIndex + 2; // +2 para pular as colunas Técnico e Modalidade
        
        const headerSelector = `#week${activeWeek}Table thead th:nth-child(${columnIndex + 1})`;
        const headerElement = document.querySelector(headerSelector);
        
        console.log('Seletor do cabeçalho:', headerSelector); // Debug
        console.log('Elemento do cabeçalho encontrado:', headerElement); // Debug
        
        if (headerElement) {
            headerElement.classList.add('bg-primary', 'text-white', 'current-day-highlight');
            
            // Destacar também todas as células dessa coluna no corpo da tabela
            const cellSelector = `#week${activeWeek}Table tbody td:nth-child(${columnIndex + 1})`;
            const cells = document.querySelectorAll(cellSelector);
            
            console.log('Seletor das células:', cellSelector); // Debug
            console.log('Células encontradas:', cells.length); // Debug
            
            cells.forEach(cell => {
                cell.classList.add('current-day-highlight');
                // Adicionar um estilo inline como fallback
                cell.style.backgroundColor = '#007bff';
                cell.style.color = 'white';
                cell.style.fontWeight = 'bold';
            });
            
            console.log('Destaque aplicado com sucesso!'); // Debug
        } else {
            console.log('Elemento do cabeçalho não encontrado'); // Debug
        }
    } else {
        console.log('Não foi possível determinar semana ativa ou índice do dia'); // Debug
    }
}

// Inicialização quando o documento estiver pronto
$(document).ready(function() {
    console.log('Documento carregado'); // Debug
    
    // Processar os dados CSV
    const data = processCSV(csvData);
    
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
            //search: "Buscar:",
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
            //search: "Buscar:",
            zeroRecords: "Nenhum registro encontrado",
            infoEmpty: "Mostrando 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totais)"
        }
    });
    
    // Aguardar um pouco para garantir que as tabelas foram renderizadas
    setTimeout(() => {
        highlightCurrentDate();
    }, 500);
    
    // Adicionar CSS personalizado para o destaque
    const style = document.createElement('style');
    style.textContent = `
        .current-day-highlight {
            border-right: 3px solid #0056b3 !important;
            border-left: 3px solid #0056b3 !important;
            font-weight: bold !important;
            
        }
    `;
    document.head.appendChild(style);
});