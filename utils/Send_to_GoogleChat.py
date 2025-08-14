import os
import requests
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get('URL_CHAT')

def alert_erro(mensagem):
    try:
        json_erro = {'text': mensagem}
        requests.post(url=url, json=json_erro, stream=True, verify=False)
    except Exception as e:
        print(f"Erro ao enviar mensagem para o Google Chat: {e}")
