insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('frap', 'Frappe', 'Κρύος, χτυπημένος', 2.3, 'coffee', '/images/products/frappe.jpg', 5, 40),
  ('marl', 'Marlboro', 'Κόκκινο πακέτο', 5.5, 'smokes', '/images/products/marlboro.jpg', 19, 24),
  ('winst', 'Winston', 'Classic', 5.2, 'smokes', '/images/products/winston.jpg', 20, 24),
  ('davi', 'Davidoff', 'Slim', 5.8, 'smokes', '/images/products/davidoff.jpg', 21, 24)
on conflict (id) do nothing;
