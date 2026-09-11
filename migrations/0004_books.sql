alter table expenses add column if not exists invoice_no text not null default '';
alter table expenses add column if not exists invoice_date text not null default '';
alter table expenses add column if not exists restocked boolean not null default false;
