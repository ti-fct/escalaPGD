# 📅 Escala PGD - UFG/FCT
Plataforma web responsiva desenvolvida para facilitar a visualização das escalas semanais dos técnicos administrativos da Faculdade de Ciência e Tecnologia da UFG. O sistema foi projetado para ser simples, acessível e otimizado para dispositivos como tablets Fire 7, Fire 8 e iPad.

## ✨ Funcionalidades
- Visualização intuitiva das escalas semanais por técnico.
- Interface responsiva, adaptada para tablets (Fire 7, Fire 8, iPad) e outros dispositivos móveis.
- Atualização automática de dados a partir de planilhas Google, com integração direta via API.
- Comparação inteligente de dados para evitar atualizações desnecessárias.
- Execução automatizada por meio de script Python, com suporte à automação via Cron no Linux.
- Monitoramento de erros e falhas através de um módulo de log dedicado.
- Notificação via Google Chat em caso de lapso do sistema

## 🛠️ Tecnologias Utilizadas
- Linguagens: Python, JavaScript, HTML, CSS
- APIs: GitHub API, Google Sheets API
- Hospedagem: GitHub Pages, Google Sites
- Automação: Script Python com integração ao GitHub e suporte ao Cron

## ⚙️ Instalação
A plataforma está hospedada no GitHub Pages e Google Sites, garantindo uma estrutura modular e eficiente para os arquivos HTML, CSS e JavaScript. Essa abordagem facilita a manutenção e melhora a organização do projeto.

### 🧭 Passos para Configuração
1. Clone o repositório:  
   ```bash
   git clone https://github.com/ti-fct/escalaPGD.git
   ```
2. Certifique-se de que o ambiente Python está configurado com as dependências necessárias listadas em [requirements.txt](https://github.com/ti-fct/escalaFCT/blob/main/utils/requirements.txt).
    - Acesse o repositório clonado depois acesse a pasta `utils` e digite o seguinte comando:
    - `pip install -r requirements.txt`
3. Execute o script principal (`exportaCSV.py`) para processar a planilha de escala e atualizar os dados.
4. Configure o Cron (no Linux) para automação, se desejar. 
    - Abra o terminal e digite o seguinte comando `crontab -e` 
    - Adicione o seguinte código no final
      ```bash
          00 07 * * *python3 /caminho/para/escalaFCT/utils/exportaCSV.py
      ```

