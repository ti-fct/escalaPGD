import os
from dotenv import load_dotenv
from github import Github, GithubException
import logging

logging.basicConfig(filename=os.path.dirname(os.path.realpath(__file__))+'/logs.txt', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configurações do GitHub ---
load_dotenv(dotenv_path='.env')
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')

def upload_to_github(file_path, owner, repo_name, branch, github_file_path):

    if not GITHUB_TOKEN:
        logging.error("Erro: GITHUB_TOKEN não encontrado nas variáveis de ambiente.")
        return False
    
    g = Github(GITHUB_TOKEN)
    
    try:
        repo = g.get_repo(f"{owner}/{repo_name}")
    except GithubException as e:
        logging.error(f"Erro ao acessar o repositório '{owner}/{repo_name}': {e}")
        logging.error("Verifique se o nome do repositório/proprietário está correto e se o token tem permissões adequadas.")
        return False
    except Exception as e:
        logging.error(f"Erro inesperado ao obter repositório: {e}")
        return False

    # Verifica se o arquivo existe antes de tentar lê-lo
    if not os.path.exists(file_path):
        logging.error(f"Erro: Arquivo '{file_path}' não encontrado.")
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
            logging.error(f"Erro ao enviar arquivo para o GitHub: {e.status} - {e.data}")
            return False
    except Exception as e:
        logging.error(f"Erro inesperado ao enviar arquivo para o GitHub: {e}")
        return False
    return True
