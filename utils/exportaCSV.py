import pandas as pd
import gspread
import os
import logging
import requests

# --- Configurações ---
BASE_DIR = os.path.dirname(os.path.realpath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'service_account.json')
OUTPUT_CSV_FILENAME = os.path.join(BASE_DIR, 'planilha_exportada.csv')
SPREADSHEET_ID = '17AhmFnhjVGqSyCqa-BDu7Mk4JyvS21H0FCNuH5RhpYc'
WORKSHEET_NAME = 'APOIO TÉCNICO'

# Configuração do logging
logging.basicConfig(filename=os.path.join(BASE_DIR, 'logs.txt'), level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuração do Google Chat ---
URL_CHAT = os.environ.get('URL_CHAT')

def enviar_mensagem_google_chat(mensagem):
    if not URL_CHAT:
        print("URL_CHAT não configurada. Não é possível enviar mensagem.")
        logging.warning("URL_CHAT não configurada.")
        return
    try:
        json_payload = {'text': mensagem}
        requests.post(url=URL_CHAT, json=json_payload)
    except Exception as e:
        print(f"Erro ao enviar mensagem para o Google Chat: {e}")
        logging.error(f"Erro ao enviar mensagem para o Google Chat: {e}", exc_info=True)


def enviar_mensagem_erro(mensagem):
    print(mensagem) 
    logging.error(mensagem, exc_info=True)
    enviar_mensagem_google_chat(mensagem)

try:
    gc = gspread.service_account(filename=CREDENTIALS_FILE)
except Exception as e:
    mensagem_erro = (f"Erro ao carregar as credenciais do Google Sheets: {e}\n"
                     "Verifique se o segredo SERVICE_ACCOUNT_JSON está configurado corretamente no GitHub Actions.")
    enviar_mensagem_erro(mensagem_erro)
    exit(1)

def get_sheet_data_as_dataframe(spreadsheet_id, worksheet_name):
    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet(worksheet_name)
        data = worksheet.get_all_values()
        
        if not data:
            print(f"A aba '{worksheet_name}' está vazia.")
            return pd.DataFrame()

        # Usar apenas as 9 primeiras colunas (A até I)
        data_limitada = [row[:9] for row in data]
        
        df = pd.DataFrame(data_limitada[1:], columns=data_limitada[0])
        df = df.fillna('')
        return df
    except gspread.exceptions.SpreadsheetNotFound:
        mensagem_erro = f"Erro: Planilha com o ID '{spreadsheet_id}' não encontrada ou você não tem acesso."
        enviar_mensagem_erro(mensagem_erro)
        return None
    except gspread.exceptions.WorksheetNotFound:
        mensagem_erro = f"Erro: Aba com o nome '{worksheet_name}' não encontrada na planilha."
        enviar_mensagem_erro(mensagem_erro)
        return None
    except Exception as e:
        mensagem_erro = f"Ocorreu um erro ao obter os dados da planilha: {e}"
        enviar_mensagem_erro(mensagem_erro)
        return None


def compare_and_save_csv(output_filename, new_dataframe):
    if not os.path.exists(output_filename):
        print(f"Arquivo '{output_filename}' não encontrado. Criando arquivo inicial.")
        new_dataframe.to_csv(output_filename, index=False, encoding='utf-8')
        print(f"Planilha exportada com sucesso para '{output_filename}'")
        return True
    
    try:
        # Ler apenas as 9 primeiras colunas do arquivo existente
        existing_df = pd.read_csv(output_filename, encoding='utf-8', usecols=range(9))
        existing_df = existing_df.fillna('')
    except Exception as e:
        mensagem_erro = f"Erro ao ler o arquivo CSV existente '{output_filename}': {e}. Sobrescrevendo o arquivo."
        enviar_mensagem_erro(mensagem_erro)
        new_dataframe.to_csv(output_filename, index=False, encoding='utf-8')
        return True

    # Compara os DataFrames
    if existing_df.equals(new_dataframe):
        mensagem_info = "Não há alterações entre a planilha atual e o arquivo CSV existente. Download cancelado."
        print(mensagem_info)
        logging.info(mensagem_info)
        return False
    else:
        mensagem_info = "Alterações detectadas. Atualizando o arquivo CSV."
        print(mensagem_info)
        logging.info(mensagem_info)
        new_dataframe.to_csv(output_filename, index=False, encoding='utf-8')
        print(f"Planilha exportada com sucesso para '{output_filename}'")
        logging.info(f"Planilha exportada com sucesso para '{output_filename}'")
        return True


# --- Lógica principal ---
print("Obtendo dados da planilha do Google Sheets...")
new_df = get_sheet_data_as_dataframe(SPREADSHEET_ID, WORKSHEET_NAME)

if new_df is not None:
    if not new_df.empty:
        compare_and_save_csv(OUTPUT_CSV_FILENAME, new_df)
    else:
        mensagem_info = "Os dados da planilha estão vazios. Nenhum CSV será gerado ou atualizado."
        print(mensagem_info)
        logging.info(mensagem_info)
else:
    mensagem_info = "Não foi possível obter os dados da planilha. Verifique as mensagens de erro acima."
    logging.error(mensagem_info)
    print(mensagem_info)