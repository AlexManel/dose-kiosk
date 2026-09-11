-- Red Bull editions, Vikos waters/sodas, Greek kiosk chocolates.
delete from products where id = 'choco';

insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('rb', 'Red Bull', '250ml', 2.2, 'energy', '/images/products/redbull.jpg?v=14', 78, 36),
  ('rbsf', 'Red Bull Sugarfree', '250ml, χωρίς ζάχαρη', 2.2, 'energy', '/images/products/redbull-sf.jpg?v=14', 79, 36),
  ('rbz', 'Red Bull Zero', '250ml, χωρίς ζάχαρη', 2.2, 'energy', '/images/products/redbull-zero.jpg?v=14', 80, 36),
  ('rb-pe', 'Red Bull Peach Edition', '250ml, white peach', 2.2, 'energy', '/images/products/redbull-peach.jpg?v=14', 81, 36),
  ('rb-wm', 'Red Bull Red Edition', '250ml, καρπούζι', 2.2, 'energy', '/images/products/redbull-red.jpg?v=14', 82, 36),
  ('rb-su', 'Red Bull Summer Edition', '250ml, pink grapefruit', 2.2, 'energy', '/images/products/redbull-summer.jpg?v=14', 83, 36),
  ('rb-ch', 'Red Bull Cherry Edition', '250ml, κεράσι', 2.2, 'energy', '/images/products/redbull-cherry.jpg?v=14', 84, 36),
  ('vikos-cola', 'Βίκος Cola', '330ml', 1.2, 'drinks', '/images/products/vikos-cola.jpg?v=14', 45, 36),
  ('vikos-cz', 'Βίκος Cola Zero', '330ml, χωρίς ζάχαρη', 1.2, 'drinks', '/images/products/vikos-colaz.jpg?v=14', 46, 36),
  ('vikos-pg', 'Βίκος Pink Grapefruit', '330ml', 1.2, 'drinks', '/images/products/vikos-pg.jpg?v=14', 47, 36),
  ('vikos-vys', 'Βίκος Βυσσινάδα', '330ml', 1.2, 'drinks', '/images/products/vikos-vys.jpg?v=14', 48, 36),
  ('vikos-soda', 'Βίκος Soda Water', '330ml', 1.0, 'drinks', '/images/products/vikos-soda.jpg?v=14', 49, 36),
  ('wat', 'Βίκος Νερό', '500ml, κρύο', 0.5, 'market', '/images/products/vikos-500.jpg?v=14', 103, 36),
  ('vikos15', 'Βίκος Νερό 1.5L', 'Φυσικό μεταλλικό', 0.8, 'market', '/images/products/vikos-15.jpg?v=14', 104, 36),
  ('ion-m', 'ION Γάλακτος', '70g', 1.5, 'market', '/images/products/ion-milk.jpg?v=14', 110, 36),
  ('ion-al', 'ION Αμυγδάλου', '30g', 0.9, 'market', '/images/products/ion-almond.jpg?v=14', 111, 36),
  ('ion-br', 'ION Break', '85g, φουντούκι', 1.8, 'market', '/images/products/ion-break.jpg?v=14', 112, 36),
  ('ion-sf', 'ION Σοκοφρέτα', '38g', 1.0, 'market', '/images/products/ion-sokofreta.jpg?v=14', 113, 36),
  ('ion-de', 'ION Derby', '38g, καρύδα', 0.8, 'market', '/images/products/ion-derby.jpg?v=14', 114, 36),
  ('kbuen', 'Kinder Bueno', '43g', 1.5, 'market', '/images/products/kinder-bueno.jpg?v=14', 115, 36),
  ('kbuenw', 'Kinder Bueno White', '39g', 1.5, 'market', '/images/products/kinder-bueno-white.jpg?v=14', 116, 36),
  ('kitkat', 'KitKat', '41.5g', 1.2, 'market', '/images/products/kitkat.jpg?v=14', 117, 36),
  ('lacta', 'Lacta Γάλακτος', '85g', 1.5, 'market', '/images/products/lacta.jpg?v=14', 118, 36),
  ('snick', 'Snickers', '50g', 1.2, 'market', '/images/products/snickers.jpg?v=14', 119, 36),
  ('mars', 'Mars', '51g', 1.2, 'market', '/images/products/mars.jpg?v=14', 120, 36),
  ('twix', 'Twix', '50g', 1.2, 'market', '/images/products/twix.jpg?v=14', 121, 36),
  ('bounty', 'Bounty', '57g', 1.2, 'market', '/images/products/bounty.jpg?v=14', 122, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo,
  sort_order = excluded.sort_order;
