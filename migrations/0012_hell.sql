-- Hell energy range from official packshots. Skip Classic (already seeded).
-- Update Classic Zero photo; insert unique flavours only.
insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('hellz', 'Hell Classic Zero', '250ml, χωρίς ζάχαρη', 1.5, 'energy', '/images/products/hell-classic-zero.jpg?v=12', 78, 36),
  ('hell-ap', 'Hell Apple', '250ml', 1.5, 'energy', '/images/products/hell-apple.jpg?v=12', 78, 36),
  ('hell-bc', 'Hell Black Cherry', '250ml', 1.5, 'energy', '/images/products/hell-black-cherry.jpg?v=12', 78, 36),
  ('hell-ct', 'Hell Carnival Cactus Twist', '250ml, limited edition', 1.5, 'energy', '/images/products/hell-cactus.jpg?v=12', 78, 36),
  ('hell-cc', 'Hell Carnival Cotton Candy', '250ml, limited edition', 1.5, 'energy', '/images/products/hell-cotton.jpg?v=12', 78, 36),
  ('hell-foc', 'Hell Focus+', '250ml', 1.5, 'energy', '/images/products/hell-focus.jpg?v=12', 78, 36),
  ('hell-mul', 'Hell Multi+', '250ml', 1.5, 'energy', '/images/products/hell-multi.jpg?v=12', 78, 36),
  ('hell-lg', 'Hell Lemon Pink Grapefruit', '250ml', 1.5, 'energy', '/images/products/hell-lemon-grapefruit.jpg?v=12', 78, 36),
  ('hell-mp', 'Hell Melon Prickly Pear', '250ml', 1.5, 'energy', '/images/products/hell-melon.jpg?v=12', 78, 36),
  ('hell-pl', 'Hell Peach Lemon', '250ml', 1.5, 'energy', '/images/products/hell-peach-lemon.jpg?v=12', 78, 36),
  ('hell-sb', 'Hell Strawberry Banana', '250ml', 1.5, 'energy', '/images/products/hell-strawberry.jpg?v=12', 78, 36),
  ('hell-sf', 'Hell Strong Focus', '250ml', 1.5, 'energy', '/images/products/hell-strong-focus.jpg?v=12', 78, 36),
  ('hell-rg', 'Hell Strong Red Grape', '250ml', 1.5, 'energy', '/images/products/hell-redgrape.jpg?v=12', 78, 36),
  ('hell-wm', 'Hell Strong Watermelon', '250ml', 1.5, 'energy', '/images/products/hell-watermelon.jpg?v=12', 78, 36),
  ('hell-zb', 'Hell Zero Berry', '250ml, χωρίς ζάχαρη', 1.5, 'energy', '/images/products/hell-zero-berry.jpg?v=12', 78, 36),
  ('hell-zp', 'Hell Zero White Peach', '250ml, χωρίς ζάχαρη', 1.5, 'energy', '/images/products/hell-white-peach.jpg?v=12', 78, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo,
  sort_order = excluded.sort_order;
