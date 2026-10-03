# Arian Barber — protótipo

Site + painel administrativo da barbearia Arian. **Fase 1 (protótipo):** todos os dados são fictícios
e ficam salvos no navegador (localStorage). Nada vai para servidor.

## Rodar

```
npm install
npm run dev        # http://localhost:5173
npm run build      # gera /dist para deploy (Netlify: _redirects já incluso)
```

- Site: `/` · Painel: `/admin`
- Login simulado: botão **Entrar** → escolha "Cliente Demo", "Rodrigo Faltoso" (tem multa) ou "Arian (administrador)".
- WhatsApp: (31) 97327-4723 (config padrão em src/data/seed.js).
- Para recriar os dados de exemplo: Painel → Configurações → Resetar dados de exemplo.

## Estrutura

```
src/
  data/seed.js          dados fictícios + config padrão (serviços = os mesmos do Cadu)
  store/Store.jsx       "backend" do protótipo: todas as ações (agendar, falta, multa, pagar...)
  lib/schedule.js       geração de horários, conflitos, regras de agenda
  lib/stats.js          métricas dos relatórios
  lib/pix.js            gerador do Pix copia e cola (BR Code + CRC16)
  components/site/      seções do site público e modais do cliente
  components/admin/     cards, gráficos e componentes do painel
  pages/admin/          Visão geral, Agenda, Clientes, Multas, Relatórios, Catálogo, Configurações
```

## Multas e débitos (pendências)

- **Falta / cancelamento fora do prazo:** o admin marca "Não compareceu" ou "Cancelar com multa".
  O horário volta a ficar livre na agenda, mas gera multa de `multaPct`% (padrão 50%).
- **Débito manual:** o admin lança um valor devido (ex.: corte não pago) pela página Multas
  ou pela ficha do cliente. Pode ou não bloquear novos agendamentos.
- Cliente com pendência que bloqueia → não agenda → paga tudo junto via Pix no site →
  pendências baixadas, cliente liberado e barbeiro notificado no painel.
- O admin também pode marcar como paga (pagamento por fora) ou perdoar.

## Fase 2 (próximos passos)

- Firebase Auth (Google) + Firestore, substituindo `Store.jsx` mantendo as mesmas ações.
- Pix com confirmação automática: cobrança dinâmica no Mercado Pago/Asaas/Efí +
  webhook → Cloud Function que marca a multa como paga.
- Aviso ao barbeiro: notificação no painel (sino). WhatsApp automático descartado pelo cliente.
- Regras do Firestore: cliente lê só os próprios dados; horários ocupados ficam numa
  coleção sem dados pessoais.
