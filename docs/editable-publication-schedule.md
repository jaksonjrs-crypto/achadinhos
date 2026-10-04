# Programação editável — 04/10/2026

Padrão preservado: cinco envios por canal às 09:00, 13:00, 16:00, 19:00 e 20:30, America/Sao_Paulo.

No Autopiloto, “Envios por dia em cada canal” determina quantos campos de horário aparecem (1–20). Todos os horários devem estar preenchidos, distintos e dentro da janela permitida. “Restaurar horários padrão” repõe os cinco horários; salvar confirma a alteração. Telegram, Instagram e Facebook usam a mesma programação quando habilitados.

A quantidade de envios é independente do máximo de novas ofertas que entram na Vitrine. Envios manuais e incertos também consomem o limite diário por canal. Preço conferido antes de publicar, cooldown e reserva por data/horário/canal permanecem ativos. A atualização geral dos preços continua no agendamento existente.

GitHub Actions consulta a rotina a cada 15 minutos, fora do minuto zero. Não é uma garantia de execução pontual: o GitHub pode atrasar ou omitir execuções. Só o horário mais recente com atraso inferior a 90 minutos é elegível; horários perdidos nunca são enviados em lote. A busca Shopee tem trava persistida de uma hora para não aumentar a frequência de descoberta.

A migração adiciona publication_times com o padrão atual, sem alterar flags de canais, limites de novas ofertas ou regras existentes. Configuração salva não comprova publicação real; verificar o próximo ciclo e seus contadores.
