alter table expenses add column if not exists pay text not null default 'transfer';

create table if not exists till_sessions (
  id           text primary key,
  opened_at    timestamptz not null default now(),
  closed_at    timestamptz,
  open_float   numeric(10,2) not null default 0,
  counted_cash numeric(10,2),
  note         text not null default '',
  closed       boolean not null default false
);

create table if not exists till_moves (
  id         text primary key,
  session_id text not null,
  at         timestamptz not null default now(),
  kind       text not null,
  amount     numeric(10,2) not null,
  reason     text not null default ''
);

create table if not exists till_checks (
  id         text primary key,
  session_id text not null,
  at         timestamptz not null default now(),
  z_cash     numeric(10,2),
  z_card     numeric(10,2),
  pos_card   numeric(10,2),
  note       text not null default ''
);

create index if not exists till_sessions_open_idx on till_sessions (closed, opened_at desc);
create index if not exists till_moves_session_idx on till_moves (session_id, at desc);
create index if not exists till_checks_session_idx on till_checks (session_id, at desc);
