-- Amita Regular 1L: one pack shot per flavour, white card. Shift later rows.
update products set sort_order = sort_order + 7 where sort_order >= 68;

insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('amita-a',    'Amita Μήλο',                    '1L χυμός',                   2.2, 'juice', '/images/products/amita-milo.jpg',          61, 36),
  ('amita-ga',   'Amita Πράσινο Μήλο',            '1L χυμός',                   2.2, 'juice', '/images/products/amita-prasino-milo.jpg',  62, 36),
  ('amita-ban',  'Amita Μπανάνα',                 '1L χυμός',                   2.2, 'juice', '/images/products/amita-banana.jpg',        63, 36),
  ('amita-p',    'Amita Ροδάκινο',                '1L χυμός',                   2.2, 'juice', '/images/products/amita-rodakino.jpg',      64, 36),
  ('amita-lem',  'Amita Λεμόνι',                  '1L χυμός',                   2.2, 'juice', '/images/products/amita-lemoni.jpg',        65, 36),
  ('amita-v',    'Amita Βύσσινο',                 '1L χυμός',                   2.2, 'juice', '/images/products/amita-vyssino.jpg',       66, 36),
  ('amita-o100', 'Amita Πορτοκάλι 100%',          '1L φυσικός χυμός',           2.5, 'juice', '/images/products/amita-portokali-100.jpg', 67, 36),
  ('amita-mix',  'Amita Πορτοκάλι Βερίκοκο Μήλο', '1L χυμός',                   2.2, 'juice', '/images/products/amita-triplo.jpg',        68, 36),
  ('amita-cran', 'Amita Κοκτέιλ Κράνμπερι',       '1L χυμός',                   2.2, 'juice', '/images/products/amita-cranberry.jpg',     69, 36),
  ('amita-pin',  'Amita Ανανάς',                  '1L χυμός',                   2.2, 'juice', '/images/products/amita-ananas.jpg',        70, 36),
  ('amita-car',  'Amita Μήλο Πορτοκάλι Καρότο',   '1L χυμός',                   2.2, 'juice', '/images/products/amita-karoto.jpg',        71, 36),
  ('amita-o',    'Amita Πορτοκάλι',               '1L χυμός',                   2.2, 'juice', '/images/products/amita-portokali.jpg',     72, 36),
  ('amita-m',    'Amita Motion',                  '1L, 9 φρούτα · 7 βιταμίνες', 2.5, 'juice', '/images/products/amita-motion.jpg',        73, 36),
  ('amita-b',    'Amita Boost Πορτοκάλι Νεκταρίνι','330ml',                     2.2, 'juice', '/images/products/amita-boost.jpg',         74, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo,
  sort_order = excluded.sort_order;
