# Calculadora de Autonomia de Nobreak

Ferramenta web bidirecional para dimensionar autonomia de nobreak a partir dos equipamentos de um rack.

Acesse em: `https://SEU_USUARIO.github.io/NOME_DO_REPO/` (depois de ativar o GitHub Pages — veja abaixo).

## O que a ferramenta faz

- **Modo 1 — Já tenho um nobreak**: você informa a lista de equipamentos do rack e as especificações do nobreak (VA, fator de potência, bateria, eficiência) e ela calcula o tempo de autonomia estimado.
- **Modo 2 — Quero dimensionar um nobreak**: você informa quanto tempo de autonomia precisa e ela calcula a capacidade de bateria (Ah) e potência (VA) mínimas necessárias, além de sugerir como distribuir os equipamentos entre múltiplas unidades de nobreak (bin packing) usando modelos que você já possui.
- **Catálogo de nobreaks**: modelos das linhas XNB, ATTIV, ATTIV SENO, Gamer, Rack/Torre (DLI/DLS) e Online já cadastrados, com preenchimento automático de VA/W/bateria ao selecionar. Dá pra cadastrar nobreaks personalizados, que ficam salvos no navegador.
- **Catálogo de equipamentos**: 554 equipamentos filtrados da planilha de referência (aba GERAL) — apenas o que liga direto na tomada (nobreaks, switches, centrais, fontes, DVR/NVR, servidores, monitores, catracas, roteadores). Câmeras, leitores, sensores, cabos e outros acessórios/itens alimentados por outro equipamento **não aparecem** — eles nunca contam separado. 136 itens já têm a potência (W) validada: os 55 nobreaks (extraída da VA/W da descrição, com estimativa por fator de potência típico quando só havia VA) e 81 equipamentos de rede (switches/roteadores/modems), sendo a maior parte confirmada em datasheet oficial do fabricante (consumo máximo). Os demais itens continuam sem watts porque a planilha de origem não traz essa informação — edite `js/data-equipamentos.js` para completar aos poucos.
- **Equipamentos PoE**: qualquer equipamento alimentado via PoE por um switch (ex: câmeras IP) pode ser marcado como tal — ele aparece na lista só como referência, mas não soma na carga total, já que o consumo dele já está dentro do switch que o alimenta.
- **Editar e remover** qualquer item da lista de equipamentos, com busca para listas grandes.
- **Tour guiado**: explica o funcionamento na primeira visita; pode ser revisto a qualquer momento pelo botão "Tour guiado" no topo.
- Navegação rápida (menu fixo) entre as seções Equipamentos / Configuração / Resultado.
- Lista de equipamentos e nobreaks personalizados salvos no `localStorage` do navegador (não há backend).

## Estrutura do projeto

Os arquivos são separados por responsabilidade, para facilitar atualizações pontuais sem mexer no resto:

```
.
├── index.html               # marcação da página (estrutura, sem estilo/lógica)
├── css/
│   └── styles.css           # todo o visual (cores, tipografia, layout, tour, toasts)
├── js/
│   ├── data-nobreaks.js     # catálogo de modelos de nobreak (editar aqui para add/remover modelos)
│   ├── data-equipamentos.js # catálogo de equipamentos filtrado da planilha (aba GERAL)
│   └── app.js                # toda a lógica da aplicação (cálculo, UI, tour, persistência)
├── README.md
└── .gitignore
```

Isso permite, por exemplo: atualizar só `js/data-nobreaks.js` quando sair um nobreak novo, ou só `css/styles.css` para mudar uma cor, sem tocar na lógica em `app.js`.

## Rodar localmente

Basta abrir `index.html` no navegador — não precisa de servidor, build ou dependências. Os arquivos CSS/JS são carregados por caminho relativo.

## Publicar no GitHub Pages

### Opção rápida: `criar-repositorio.bat`

Dê duplo clique em `criar-repositorio.bat` (nesta mesma pasta). Ele:

1. Inicializa o git local (se ainda não existir) e faz o commit dos arquivos.
2. Se você tiver o [GitHub CLI](https://cli.github.com/) instalado (`gh`), cria o repositório no GitHub, faz o push e **já tenta ativar o GitHub Pages automaticamente** — só pede o nome do repositório e se é público ou privado.
3. Se não tiver o GitHub CLI, pede para você colar a URL de um repositório vazio criado manualmente em github.com/new, e faz o push para ele.
4. No fim, mostra o link onde o site vai ficar disponível (`https://SEU_USUARIO.github.io/NOME_DO_REPO/`).

Pode rodar de novo sempre que quiser (ele detecta o que já foi feito e só falta configurar o Pages manualmente se a ativação automática não funcionar).

### Opção manual

1. Crie um repositório no GitHub (pode ser público ou privado, desde que seu plano permita Pages em repositório privado).
2. Suba os arquivos desta pasta para o repositório:
   ```
   cd "C:\Users\Adalto\Documents\PROJETOS\CALCULADORA DE AUTONOMIA"
   git init
   git add .
   git commit -m "Calculadora de autonomia de nobreak"
   git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**.
4. Em "Build and deployment", selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`.
5. Salve. Em alguns minutos o site fica disponível em `https://SEU_USUARIO.github.io/NOME_DO_REPO/`.

## Atualizando depois

- **Trocar/adicionar um modelo de nobreak**: edite o array em `js/data-nobreaks.js`.
- **Atualizar o catálogo de equipamentos**: reexporte a lista filtrada da planilha para `js/data-equipamentos.js` (formato `{l: "[Categoria] Marca Modelo", w: potência_em_W_ou_null, c: "Categoria"}`).
- **Mudar cores/fontes/espaçamento**: tudo em `css/styles.css`, organizado por seção com comentários.
- **Mudar comportamento/cálculos/tour**: tudo em `js/app.js`.

Depois de editar, é só commitar e dar push — o GitHub Pages atualiza sozinho em 1–2 minutos.

## Roadmap / próximos passos possíveis

- Vincular formalmente cada equipamento PoE ao switch que o alimenta (hoje a exclusão é manual via checkbox).
- Exportar/importar a lista de equipamentos em JSON.
- Adicionar mais categorias do catálogo (controle de acesso, CFTV) como equipamentos "sub" vinculados, em vez de simplesmente ocultos.
