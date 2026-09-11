-- Tsakiris chips + kiosk snacks. Drop generic chips SKU.
delete from products where id = 'chips';

insert into products (id, name, description, price, cat, photo, sort_order, stock) values
  ('tsak-salt', 'Tsakiris Chips Αλάτι', '90g', 1.5, 'snacks', '/images/products/tsak-salt.jpg?v=13', 200, 36),
  ('tsak-ore', 'Tsakiris Chips Ρίγανη', '90g', 1.5, 'snacks', '/images/products/tsak-ore.jpg?v=13', 201, 36),
  ('tsak-light', 'Tsakiris Chips 0% Αλάτι', '90g, χωρίς προσθήκη αλατιού', 1.5, 'snacks', '/images/products/tsak-light.jpg?v=13', 202, 36),
  ('tsak-vin', 'Tsakiris Chips Αλάτι & Ξίδι', '90g', 1.5, 'snacks', '/images/products/tsak-vin.jpg?v=13', 203, 36),
  ('tsak-pap', 'Tsakiris Chips Πάπρικα', '90g', 1.5, 'snacks', '/images/products/tsak-pap.jpg?v=13', 204, 36),
  ('tsak-sc', 'Tsakiris Chips Sour Cream', '90g', 1.5, 'snacks', '/images/products/tsak-sc.jpg?v=13', 205, 36),
  ('tsak-bbq', 'Tsakiris Κυματιστά BBQ', '90g', 1.5, 'snacks', '/images/products/tsak-bbq.jpg?v=13', 206, 36),
  ('tsak-wore', 'Tsakiris Κυματιστά Ρίγανη', '90g', 1.5, 'snacks', '/images/products/tsak-wavy-ore.jpg?v=13', 207, 36),
  ('tsak-stix', 'Tsakiris Sticks Αλάτι', '90g σακούλα', 1.5, 'snacks', '/images/products/tsak-sticks.jpg?v=13', 208, 36),
  ('tsak-c50', 'Tsakiris Sticks Cup 50g', 'Κύπελλο αλάτι', 1.4, 'snacks', '/images/products/tsak-cup50.jpg?v=13', 209, 36),
  ('tsak-c105', 'Tsakiris Sticks Cup 105g', 'Κύπελλο αλάτι', 1.8, 'snacks', '/images/products/tsak-cup105.jpg?v=13', 210, 36),
  ('tsak-ccb', 'Tsakiris Sticks Cheese Burger', 'Κύπελλο 105g', 1.8, 'snacks', '/images/products/tsak-cup-cb.jpg?v=13', 211, 36),
  ('tsak-chot', 'Tsakiris Sticks Spicy Hot', 'Κύπελλο 105g', 1.8, 'snacks', '/images/products/tsak-cup-hot.jpg?v=13', 212, 36),
  ('chee-lot', 'Cheetos Γαριδάκια Lotto', '80g', 1.2, 'snacks', '/images/products/cheetos-lotto.jpg?v=13', 213, 36),
  ('chee-piz', 'Cheetos Pizza', '70g', 1.2, 'snacks', '/images/products/cheetos-pizza.jpg?v=13', 214, 36),
  ('extra-g', 'Extra Τυρογαριδάκια', '80g', 1.0, 'snacks', '/images/products/extra-gari.jpg?v=13', 215, 36),
  ('chee-pako', 'Cheetos Πακοτίνια', '95g', 1.2, 'snacks', '/images/products/cheetos-pako.jpg?v=13', 216, 36),
  ('chee-drak', 'Cheetos Δρακουλίνα', '75g', 1.2, 'snacks', '/images/products/cheetos-drakou.jpg?v=13', 217, 36),
  ('tasty-f', 'Tasty Φουντούνια', '90g', 1.0, 'snacks', '/images/products/tasty-foun.jpg?v=13', 218, 36)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  cat = excluded.cat,
  photo = excluded.photo,
  sort_order = excluded.sort_order;
