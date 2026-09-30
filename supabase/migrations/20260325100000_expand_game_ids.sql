-- Expand scores.game_id for social / card catalogue
alter table public.scores drop constraint if exists scores_game_id_check;

alter table public.scores
  add constraint scores_game_id_check
  check (
    game_id in (
      'solitaire',
      'blackjack',
      'uno',
      'undercover',
      'werewolf',
      'pulse-snake',
      'echo-memory',
      'drift-breaker'
    )
  );
