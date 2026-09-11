insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('winst', 'Winston Classic Red Greece', 'Limited Edition · 20άδα', 5.2, 'smokes', '/images/products/winston-greece-red.jpg?v=18', 200, 36),
  ('winstb', 'Winston Legend Blue', '20άδα', 5.2, 'smokes', '/images/products/winston-legend-blue.jpg?v=18', 201, 36),
  ('winst-fw', 'Winston 100s Fine White', '100s', 5.4, 'smokes', '/images/products/winston-fine-white.jpg?v=18', 202, 36),
  ('winst-ts', 'Winston 100s True Silver', '100s', 5.4, 'smokes', '/images/products/winston-true-silver.jpg?v=18', 203, 36),
  ('winst-gr', 'Winston 100s Classic Red Greece', 'Limited Edition · 100s', 5.4, 'smokes', '/images/products/winston-greece-100s.jpg?v=18', 204, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo;
