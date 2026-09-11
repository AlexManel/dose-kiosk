create table if not exists products (
  id          text primary key,
  name        text not null,
  description text not null default '',
  price       numeric(10,2) not null,
  cat         text not null,
  photo       text not null default '',
  sort_order  integer not null default 0
);

create table if not exists shop_settings (
  id            integer primary key,
  name          text not null,
  tagline       text not null,
  whatsapp      text not null,
  phone         text not null,
  min_order     numeric(10,2) not null,
  delivery_fee  numeric(10,2) not null,
  address_line  text not null,
  city          text not null,
  hours         text not null,
  hours_note    text not null,
  pin_hash      text not null
);

insert into shop_settings (
  id, name, tagline, whatsapp, phone, min_order, delivery_fee,
  address_line, city, hours, hours_note, pin_hash
) values (
  1, 'Dose', 'Coffee & More', '306900000000', '6900000000', 5, 1.5,
  'Γωνιακό κατάστημα, πεζόδρομος & φανάρι', 'Θεσσαλονίκη',
  '07:00 – 22:00', 'Καθημερινά',
  'eade0d0b5b098d0cab945893692eef496a50b6ac15c4e59a4b8442355bf21593'
) on conflict (id) do nothing;

insert into products (id, name, description, price, cat, photo, sort_order) values
  ('esp', 'Espresso', 'Μονός, κοντός, με κρέμα', 1.8, 'coffee', '/images/espresso.jpg', 0),
  ('espd', 'Espresso διπλός', 'Όταν η μέρα το απαιτεί', 2.3, 'coffee', '/images/products/espresso-double.jpg', 1),
  ('cap', 'Cappuccino', 'Γάλα, μικροαφρός', 2.5, 'coffee', '/images/products/cappuccino.jpg', 2),
  ('fe', 'Freddo espresso', 'Κρύος, σφιχτός', 2.4, 'coffee', '/images/freddo.jpg', 3),
  ('fc', 'Freddo cappuccino', 'Με αφρόγαλα', 2.8, 'coffee', '/images/products/freddo-cap.jpg', 4),
  ('el', 'Ελληνικός', 'Μεζές της υπομονής', 1.8, 'coffee', '/images/products/ellinikos.jpg', 5),
  ('fil', 'Φίλτρου', 'Καθαρός, αργός', 2.2, 'coffee', '/images/products/filter.jpg', 6),
  ('lat', 'Latte', 'Πιο γάλα, πιο μαλακός', 3, 'coffee', '/images/products/latte.jpg', 7),
  ('koul', 'Κουλούρι Θεσσαλονίκης', 'Σουσάμι, ζεστό αν προλάβεις', 0.8, 'bread', '/images/bread.jpg', 8),
  ('loaf', 'Σταρένιο καρβέλι', 'Της ημέρας', 2.5, 'bread', '/images/products/loaf.jpg', 9),
  ('seed', 'Πολύσπορο', 'Για το βράδυ στο σπίτι', 2.8, 'bread', '/images/products/seeded.jpg', 10),
  ('cro', 'Croissant', 'Απλό, σωστό', 1.8, 'bread', '/images/products/croissant.jpg', 11),
  ('tyr', 'Τυρόπιτα', 'Φύλλο, φέτα', 2.2, 'bread', '/images/products/tyropita.jpg', 12),
  ('spa', 'Σπανακόπιτα', 'Χόρτα, άνηθος', 2.2, 'bread', '/images/products/spanakopita.jpg', 13),
  ('wat', 'Νερό', '500ml, κρύο', 0.5, 'market', '/images/products/water.jpg', 14),
  ('cola', 'Αναψυκτικό', 'Κόλα / πορτοκαλάδα / σόδα', 1.5, 'market', '/images/products/soda.jpg', 15),
  ('choco', 'Σοκολάτα', 'Μπάρα', 1.8, 'market', '/images/products/chocolate.jpg', 16),
  ('chips', 'Πατατάκια', 'Κλασική σακούλα', 1.5, 'market', '/images/products/chips.jpg', 17),
  ('gum', 'Τσίχλες', 'Για μετά τον καφέ', 0.8, 'market', '/images/products/gum.jpg', 18)
on conflict (id) do nothing;
