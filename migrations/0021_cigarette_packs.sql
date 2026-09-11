insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('camely', 'Camel Yellow', '20άδα', 5.2, 'smokes', '/images/products/camel-yellow.jpg?v=20', 210, 36),
  ('camelb', 'Camel Blue', '20άδα', 5.2, 'smokes', '/images/products/camel-blue.jpg?v=20', 211, 36),
  ('camelw', 'Camel White', '20άδα', 5.2, 'smokes', '/images/products/camel-white.jpg?v=20', 212, 36),
  ('camel-ly', 'Camel Legend Yellow', '1913 · 20άδα', 5.2, 'smokes', '/images/products/camel-legend-yellow.jpg?v=20', 213, 36),
  ('camel-lb', 'Camel Legend Blue', '1913 · 20άδα', 5.2, 'smokes', '/images/products/camel-legend-blue.jpg?v=20', 214, 36),
  ('camel-act', 'Camel Activate', '20άδα · κάψουλα', 5.2, 'smokes', '/images/products/camel-activate.jpg?v=20', 215, 36),
  ('lucky', 'Lucky Strike Original', '20άδα', 5.0, 'smokes', '/images/products/lucky-strike.jpg?v=20', 216, 36),
  ('prince-r', 'Prince Rich', '20άδα', 5.0, 'smokes', '/images/products/prince-rich.jpg?v=20', 217, 36),
  ('prince-m', 'Prince Mellow', '20άδα', 5.0, 'smokes', '/images/products/prince-mellow.jpg?v=20', 218, 36),
  ('west-s', 'West Silver', '20άδα', 4.7, 'smokes', '/images/products/west-silver.jpg?v=20', 219, 36),
  ('west-s100', 'West Silver 100s', '100s', 4.9, 'smokes', '/images/products/west-silver-100s.jpg?v=20', 220, 36),
  ('west-o100', 'West Original 100s', '100s', 4.9, 'smokes', '/images/products/west-original-100s.jpg?v=20', 221, 36),
  ('jps-r', 'JPS 100s Red', 'John Player Special · 100s', 5.0, 'smokes', '/images/products/jps-red-100s.jpg?v=20', 222, 36),
  ('jps-b', 'JPS 100s Blue', 'John Player Special · 100s', 5.0, 'smokes', '/images/products/jps-blue-100s.jpg?v=20', 223, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo;
