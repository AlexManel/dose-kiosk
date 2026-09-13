update products set price = 4.80 where id in ('marl', 'marlg', 'marls');
update products set price = 4.20 where id in ('winst', 'winst-r', 'winstb', 'winst-fw', 'winst-ts');
update products set price = 4.00 where id = 'winst-gr';
update products set price = 4.60 where id in ('davi', 'davic');
update products set price = 3.20 where id like 'v1-%';
update products set price = 4.00 where id like 'ter-%';

insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('marl-soft', 'Marlboro Red Soft', 'Μαλακό πακέτο · 20άδα', 4.8, 'smokes', '/images/products/marlboro-red.jpg?v=23', 206, 36),
  ('marl-23', 'Marlboro Red 23', '23άδα', 5.0, 'smokes', '/images/products/marlboro-red.jpg?v=23', 207, 36),
  ('marl-30', 'Marlboro τούβλο 30', '30άδα', 6.0, 'smokes', '/images/products/marlboro-red.jpg?v=23', 208, 36),
  ('winst-24', 'Winston 24άδα', '24άδα', 5.0, 'smokes', '/images/products/winston-classic-red.jpg?v=23', 209, 36),
  ('winst-tb', 'Winston τούβλο', 'Μεγάλη συσκευασία', 5.0, 'smokes', '/images/products/winston-classic-red.jpg?v=23', 210, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo;
