alter table products add column if not exists stock integer not null default 24;

update products set stock = case
  when cat = 'coffee' then 40
  when cat = 'bread' then 18
  else 36
end
where stock = 24;

create table if not exists sales (
  id      text primary key,
  at      timestamptz not null default now(),
  channel text not null default 'delivery',
  pay     text not null default 'cash',
  sub     numeric(10,2) not null,
  fee     numeric(10,2) not null default 0,
  grand   numeric(10,2) not null
);

create table if not exists sale_items (
  id         serial primary key,
  sale_id    text not null,
  product_id text,
  name       text not null,
  qty        integer not null,
  price      numeric(10,2) not null
);

create table if not exists expenses (
  id     text primary key,
  at     timestamptz not null default now(),
  vendor text not null default '',
  note   text not null default '',
  photo  text not null default '',
  total  numeric(10,2) not null
);

create table if not exists expense_items (
  id          serial primary key,
  expense_id  text not null,
  name        text not null,
  qty         numeric(10,2) not null default 1,
  unit_cost   numeric(10,2) not null,
  product_id  text
);

create index if not exists sales_at_idx on sales (at desc);
create index if not exists expenses_at_idx on expenses (at desc);
create index if not exists sale_items_sale_idx on sale_items (sale_id);
create index if not exists expense_items_expense_idx on expense_items (expense_id);
