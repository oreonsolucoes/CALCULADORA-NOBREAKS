@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Calculadora de Autonomia de Nobreak - Criar repositorio GitHub

echo ============================================================
echo  Calculadora de Autonomia de Nobreak
echo  Criar repositorio no GitHub + subir commit + ativar Pages
echo ============================================================
echo.

cd /d "%~dp0"

REM ---------- checar git ----------
where git >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Git nao encontrado. Instale em https://git-scm.com/download/win
    echo e execute este arquivo novamente.
    exit /b 1
)

REM ---------- inicializar repositorio local ----------
if not exist ".git" (
    echo [1/5] Inicializando repositorio git local...
    git init
    git branch -M main
) else (
    echo [1/5] Repositorio git ja inicializado, pulando...
)

echo.
echo [2/5] Adicionando arquivos...
git add .

git diff --cached --quiet
if not errorlevel 1 (
    echo Nenhuma alteracao nova para commitar.
) else (
    git commit -m "Calculadora de autonomia de nobreak"
)

echo.

REM ---------- checar se ja existe remoto ----------
git remote get-url origin >nul 2>nul
if not errorlevel 1 (
    echo [3/5] Remoto "origin" ja configurado, pulando criacao...
    goto :push
)

REM ---------- checar GitHub CLI (gh) ----------
where gh >nul 2>nul
if errorlevel 1 goto :manual_remote

echo [3/5] GitHub CLI encontrado. Vamos criar o repositorio no GitHub.
gh auth status >nul 2>nul
if errorlevel 1 (
    echo.
    echo Voce ainda nao esta logado no GitHub CLI. Abrindo login...
    gh auth login
)

set /p REPO_NAME="Nome do repositorio no GitHub (ex: calculadora-autonomia-nobreak): "
if "%REPO_NAME%"=="" set REPO_NAME=calculadora-autonomia-nobreak

set /p VISIBILIDADE="Repositorio publico ou privado? (public/private) [public]: "
if "%VISIBILIDADE%"=="" set VISIBILIDADE=public

echo.
echo Criando repositorio "%REPO_NAME%" (%VISIBILIDADE%) e enviando o codigo...
gh repo create "%REPO_NAME%" --%VISIBILIDADE% --source=. --remote=origin --push

if errorlevel 1 (
    echo [ERRO] Nao foi possivel criar o repositorio automaticamente.
    goto :manual_remote
)

echo.
echo [4/5] Ativando GitHub Pages (branch main, pasta raiz)...
for /f "tokens=*" %%i in ('gh api user --jq .login') do set GH_USER=%%i
gh api -X POST "repos/%GH_USER%/%REPO_NAME%/pages" -f "source[branch]=main" -f "source[path]=/" >nul 2>nul

if errorlevel 1 (
    echo Nao foi possivel ativar o Pages automaticamente via API
    echo ^(pode ser que ja esteja ativo, ou que sua conta exija ativacao manual^).
    echo Ative manualmente em: Settings -^> Pages -^> Deploy from a branch -^> main -^> / ^(root^)
) else (
    echo GitHub Pages ativado!
)

echo.
echo [5/5] Pronto! Seu site deve ficar disponivel em alguns minutos em:
echo   https://%GH_USER%.github.io/%REPO_NAME%/
echo.
goto :fim

:manual_remote
echo.
echo [3/5] GitHub CLI nao encontrado (ou criacao automatica falhou).
echo Voce pode instalar o GitHub CLI em https://cli.github.com/ para
echo automatizar tudo, ou continuar manualmente agora:
echo.
echo 1. Crie um repositorio vazio em https://github.com/new
echo 2. Cole aqui a URL dele (ex: https://github.com/SEUUSUARIO/NOMEREPO.git)
echo.
set /p REPO_URL="URL do repositorio: "
if "%REPO_URL%"=="" (
    echo Nenhuma URL informada. Encerrando sem enviar ao GitHub.
    goto :fim
)
git remote add origin "%REPO_URL%"

:push
echo.
echo [4/5] Enviando para o GitHub...
git push -u origin main

echo.
echo [5/5] Pronto! Agora ative o GitHub Pages manualmente:
echo   No GitHub: Settings -^> Pages -^> Deploy from a branch -^> main -^> / ^(root^)
echo   O site fica disponivel em: https://SEUUSUARIO.github.io/NOMEREPO/
echo.

:fim
echo ============================================================
timeout /t 5 >nul
exit /b 0
