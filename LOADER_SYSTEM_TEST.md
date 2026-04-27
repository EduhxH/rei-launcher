# Teste do Sistema de Loaders

## Instruções de Teste

### 1. Iniciar o Launcher
```
npm start
```

### 2. Verificar se a Interface Carrega
- [ ] Aba "Jogar" exibe seletor de versão
- [ ] Seletor de versão contém versões válidas (1.20.1, 1.20, etc)
- [ ] Novo seletor "Tipo de Loader" aparece
- [ ] Seletor de loader mostra: Vanilla, Fabric, Forge, OptiFine, NeoForge, Iris

### 3. Testar Compatibilidade
- [ ] Selecionar versão 1.20.1
- [ ] Selecionar Fabric - deve estar habilitado
- [ ] Selecionar Vanilla - seletor de versão do loader desaparece
- [ ] Selecionar Fabric novamente - seletor de versão retorna
- [ ] Clicar em "Tipo de Loader" Fabric carrega versões

### 4. Testar Incompatibilidade
- [ ] Selecionar versão 1.8.9
- [ ] Selecionar NeoForge - deve estar desabilitado (não compatível)
- [ ] Selecionar Fabric - deve estar habilitado

### 5. Testar Lançamento (Sem Conta)
- [ ] Selecionar versão 1.20.1
- [ ] Selecionar Fabric
- [ ] Selecionar versão de loader (qualquer uma)
- [ ] Clicar JOGAR - deve aparecer barra de progresso
- [ ] Deve tentar lançar o jogo com o loader selecionado

### 6. Verificar Console
- [ ] Abrir DevTools (F12)
- [ ] Verificar se há erros na aba Console
- [ ] Verificar se há mensagens de loading dos loaders

## Funcionalidades Esperadas

### Backend (main.js)
✓ Handlers de loaders registrados:
  - loaders:getVersions
  - loaders:getSubVersions
  - loaders:isCompatible
  - loaders:getCompatible
  - loaders:install
  - loaders:isInstalled
  - loaders:getInstalled
  - loaders:remove

### Frontend (renderer.js)
✓ Lógica de seletores funcionando:
  - Mudança de versão atualiza compatibilidade
  - Mudança de loader atualiza UI
  - Carregamento de versões de loader
  - Lançamento do jogo com loader

### Compatibilidade
✓ Mapa de versões compatíveis:
  - Fabric: 1.20.1, 1.20, 1.19.4, 1.19.2, 1.19, 1.18.2, 1.18, 1.17.1, 1.16.5, 1.12.2
  - Forge: 1.20.1, 1.20, 1.19.4, 1.19.2, 1.19, 1.18.2, 1.18, 1.17.1, 1.16.5, 1.12.2
  - OptiFine: 1.20.1, 1.20, 1.19.4, 1.19.2, 1.19, 1.18.2, 1.18, 1.17.1, 1.16.5, 1.12.2
  - NeoForge: 1.20.1, 1.20.2
  - Iris: 1.20.1, 1.20, 1.19.4, 1.19.2, 1.19, 1.18.2, 1.18, 1.17.1

## Notas
- O sistema não requer ferramentas externas
- Tudo funciona dentro do launcher
- Download e instalação são automáticos
- A compatibilidade é validada em tempo real
