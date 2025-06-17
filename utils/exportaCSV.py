#import pip
#pip.main(["install", "gspread", "pandas", "python-dotenv", "PyGithub"])

import pandas as pd
from dotenv import load_dotenv
from github import Github, GithubException
import gspread
import os

CREDENTIALS_FILE = '/home/suporte/escalaPGD/utils/service_account.json'
OUTPUT_CSV_FILENAME = 'planilha_exportada.csv'

# --- Configurações do GitHub ---
load_dotenv()
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_OWNER = 'ti-fct'
GITHUB_REPO_NAME = 'escalaPGD'
GITHUB_BRANCH = 'main'
GITHUB_FILE_PATH = 'utils/'+OUTPUT_CSV_FILENAME

try:
    gc = gspread.service_account(filename=CREDENTIALS_FILE)
except Exception as e:
    print(f"Erro ao carregar as credenciais: {e}")
    print("Certifique-se de que o arquivo de credenciais está correto e no local especificado.")
    print("Se estiver usando uma conta de serviço, verifique se o e-mail da conta de serviço")
    print("foi adicionado como editor na planilha do Google Sheets.")
    exit()

SPREADSHEET_ID = '17AhmFnhjVGqSyCqa-BDu7Mk4JyvS21H0FCNuH5RhpYc'
WORKSHEET_NAME = 'APOIO TÉCNICO'

def get_sheet_data_as_dataframe(spreadsheet_id, worksheet_name):
    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet(worksheet_name)
        data = worksheet.get_all_values()
        
        if not data:
            print(f"A aba '{worksheet_name}' está vazia.")
            return pd.DataFrame() # Retorna um DataFrame vazio
        
        # A primeira linha é o cabeçalho
        df = pd.DataFrame(data[1:], columns=data[0])
        # Converte NaN para string vazia em todo o DataFrame
        df = df.fillna('')
        df.drop(columns=['Unnamed: 7'], inplace=True, errors='ignore')  # Remove a coluna H se existir
        return df
    except gspread.exceptions.SpreadsheetNotFound:
        print(f"Erro: Planilha com o ID '{spreadsheet_id}' não encontrada ou você não tem acesso.")
        return None
    except gspread.exceptions.WorksheetNotFound:
        print(f"Erro: Aba com o nome '{worksheet_name}' não encontrada na planilha.")
        return None
    except Exception as e:
        print(f"Ocorreu um erro ao obter os dados da planilha: {e}")
        return None

def upload_to_github(file_path, owner, repo_name, branch, github_file_path):

    if not GITHUB_TOKEN:
        print("Erro: GITHUB_TOKEN não encontrado nas variáveis de ambiente.")
        return False
    
    g = Github(GITHUB_TOKEN)
    
    try:
        repo = g.get_repo(f"{owner}/{repo_name}")
    except GithubException as e:
        print(f"Erro ao acessar o repositório '{owner}/{repo_name}': {e}")
        print("Verifique se o nome do repositório/proprietário está correto e se o token tem permissões adequadas.")
        return False
    except Exception as e:
        print(f"Erro inesperado ao obter repositório: {e}")
        return False

    # Verifica se o arquivo existe antes de tentar lê-lo
    if not os.path.exists(file_path):
        print(f"Erro: Arquivo '{file_path}' não encontrado.")
        return False

    with open(file_path, 'rb') as f:
        content = f.read()

    commit_message = f"Atualizado {github_file_path} via script Python"

    try:
        # Tenta obter o arquivo para verificar se existe e pegar o SHA
        file_in_github = repo.get_contents(github_file_path, ref=branch)
        repo.update_file(file_in_github.path, commit_message, content, file_in_github.sha, branch=branch)
        print(f"Arquivo '{github_file_path}' atualizado com sucesso no GitHub!")
    except GithubException as e:
        if e.status == 404:
            repo.create_file(github_file_path, commit_message, content, branch=branch)
            print(f"Arquivo '{github_file_path}' criado com sucesso no GitHub!")
        else:
            print(f"Erro do GitHub ao enviar arquivo: {e.status} - {e.data}")
            return False
    except Exception as e:
        print(f"Erro inesperado ao enviar arquivo para o GitHub: {e}")
        return False
    return True

def compare_and_download_csv(output_filename, new_dataframe):
    if not os.path.exists(output_filename):
        print(f"Arquivo '{output_filename}' não encontrado. Realizando o download inicial.")
        new_dataframe.to_csv(output_filename, index=False, encoding='utf-8')
        print(f"Planilha exportada com sucesso para '{output_filename}'")
        upload_to_github(output_filename, GITHUB_OWNER, GITHUB_REPO_NAME, GITHUB_BRANCH, GITHUB_FILE_PATH)
        return True
    
    try:
        existing_df = pd.read_csv(output_filename, encoding='utf-8')
        existing_df = existing_df.fillna('')  # Converte NaN para string vazia
        existing_df.drop(columns=['Unnamed: 7'], inplace=True, errors='ignore')  # Remove a coluna H se existir
    except Exception as e:
        print(f"Erro ao ler o arquivo CSV existente '{output_filename}': {e}")
        print("Prosseguindo com o download do novo arquivo.")
        new_dataframe.to_csv(output_filename, index=False, encoding='utf-8')
        print(f"Planilha exportada com sucesso para '{output_filename}'")
        upload_to_github(output_filename, GITHUB_OWNER, GITHUB_REPO_NAME, GITHUB_BRANCH, GITHUB_FILE_PATH)
        return True

    # Compara os DataFrames
    if existing_df.equals(new_dataframe):
        print("Não há alterações entre a planilha atual e o arquivo CSV existente. Download cancelado.")
        return False
    else:
        print("Alterações detectadas! Realizando o download do novo arquivo CSV.")
        new_dataframe.to_csv(output_filename, index=False, encoding='utf-8')
        print(f"Planilha exportada com sucesso para '{output_filename}'")
        # CORRIGIDO: Passa o caminho do arquivo, não o DataFrame
        upload_to_github(output_filename, GITHUB_OWNER, GITHUB_REPO_NAME, GITHUB_BRANCH, GITHUB_FILE_PATH)
        
        print("Conteúdo do arquivo CSV existente:")
        print(existing_df)

        print("Conteúdo do novo arquivo:")
        print(new_dataframe)
        return True


# Lógica principal ---
print("Obtendo dados da planilha do Google Sheets...")
new_df = get_sheet_data_as_dataframe(SPREADSHEET_ID, WORKSHEET_NAME)

if new_df is not None:
    if not new_df.empty:
        compare_and_download_csv(OUTPUT_CSV_FILENAME, new_df)
    else:
        print("Os dados da planilha estão vazios. Nenhum CSV será gerado ou atualizado.")
else:
    print("Não foi possível obter os dados da planilha. Verifique as mensagens de erro acima.")