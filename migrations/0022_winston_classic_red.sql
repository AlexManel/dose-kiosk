insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('winst-r', 'Winston Classic Red', '20άδα', 5.2, 'smokes', '/images/products/winston-classic-red.jpg?v=22', 205, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo;

update products set
  photo = '/images/products/winston-legend-blue.jpg?v=22'
where id = 'winstb';

update products set
  name = 'Winston Fine White',
  description = '20άδα',
  price = 5.2,
  photo = '/images/products/winston-fine-white.jpg?v=22'
where id = 'winst-fw';

update products set
  name = 'Winston True Silver',
  description = '20άδα',
  price = 5.2,
  photo = '/images/products/winston-true-silver.jpg?v=22'
where id = 'winst-ts';
