delete from products where id = 'gum';

insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('xixo-p', 'XIXO Ice Tea Ροδάκινο', '250ml', 1.2, 'drinks', '/images/products/xixo-peach.jpg?v=15', 50, 36),
  ('xixo-pz', 'XIXO Ice Tea Ροδάκινο Zero', '250ml, χωρίς ζάχαρη', 1.2, 'drinks', '/images/products/xixo-peach-zero.jpg?v=15', 51, 36),
  ('xixo-l', 'XIXO Ice Tea Λεμόνι', '250ml', 1.2, 'drinks', '/images/products/xixo-lemon.jpg?v=15', 52, 36),
  ('xixo-s', 'XIXO Ice Tea Φράουλα', '250ml', 1.2, 'drinks', '/images/products/xixo-berry.jpg?v=15', 53, 36),
  ('xixo-rb', 'XIXO Ice Tea Raspberry Blueberry', '250ml', 1.2, 'drinks', '/images/products/xixo-raspberry.jpg?v=15', 54, 36),
  ('xixo-gt', 'XIXO Ice Tea Green Fusion Zero', '250ml, χωρίς ζάχαρη', 1.2, 'drinks', '/images/products/xixo-green.jpg?v=15', 55, 36),
  ('xixo-t', 'XIXO Tutti Fruity', '250ml', 1.2, 'drinks', '/images/products/xixo-tutti.jpg?v=15', 56, 36),
  ('xixo-bc', 'XIXO Tutti Fruity Black Cherry', '250ml', 1.2, 'drinks', '/images/products/xixo-cherry.jpg?v=15', 57, 36),
  ('xixo-ap', 'XIXO Tutti Fruity Apple', '250ml', 1.2, 'drinks', '/images/products/xixo-apple.jpg?v=15', 58, 36),
  ('xixo-kw', 'XIXO Tutti Fruity Kiwi', '250ml', 1.2, 'drinks', '/images/products/xixo-kiwi.jpg?v=15', 59, 36),
  ('xixo-pl', 'XIXO Pink Lemonade', '250ml, φράουλα λάιμ', 1.2, 'drinks', '/images/products/xixo-pink.jpg?v=15', 60, 36),
  ('xixo-mo', 'XIXO Mojito Lemonade', '250ml, λάιμ μέντα', 1.2, 'drinks', '/images/products/xixo-mojito.jpg?v=15', 61, 36),
  ('trid-ss', 'Trident Senses Δυόσμος', '27g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-senses-spearmint.jpg?v=15', 130, 36),
  ('trid-sw', 'Trident Senses Καρπούζι', '27g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-senses-watermelon.jpg?v=15', 131, 36),
  ('trid-sf', 'Trident Senses Φράουλα', '27g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-senses-strawberry.jpg?v=15', 132, 36),
  ('trid-ms', 'Trident Max Δυόσμος', '27g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-max-spearmint.jpg?v=15', 133, 36),
  ('trid-mp', 'Trident Max Peppermint', '27g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-max-peppermint.jpg?v=15', 134, 36),
  ('trid-ls', 'Trident Long Lasting Δυόσμος', '22g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-long-spearmint.jpg?v=15', 135, 36),
  ('trid-lm', 'Trident Long Lasting Μέντα', '22g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-long-mint.jpg?v=15', 136, 36),
  ('trid-ll', 'Trident Long Lasting Φράουλα Λάιμ', '22g, χωρίς ζάχαρη', 1.0, 'market', '/images/products/trident-long-strawberry.jpg?v=15', 137, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo,
  sort_order = excluded.sort_order;
