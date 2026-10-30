# RestoMatch roadmap

## Fundal editorial — cerință restrânsă de Peter
Redesignul complet a fost retras: modelul actual al site-ului rămâne neschimbat.
- [x] Analiza videoclipului de referință
- [x] Adăugarea punctelor halftone discrete doar pe fundal
- [x] Verificarea aspectului și păstrarea interacțiunilor existente

## Monetizare — sarcini anterioare

- [x] Bază de date: planuri, abonamente, plăți, campanii, comisioane, oferte, cupoane, rezervări, vizualizări, cereri de proprietar + reguli de securitate
- [x] Logică server: revendicare ofertă (cod unic), verificare/validare cupon (anti-reutilizare, limită încercări), comision unic per rezervare, confirmare plată (manual admin + webhook viitor), statistici restaurant/admin
- [x] Conturi reale: email + Google activate; context de autentificare și semnale publice (badge, promovat, oferte)
- [x] Pagina Login reală (email/parolă + Google)
- [x] „Contul meu”: Cupoanele mele, Rezervările mele
- [x] Panou restaurant: cerere proprietar, oferte (CRUD), Validează cupon (cod manual), rezervări, abonament, promovare, statistici
- [x] Pagina restaurantului: secțiune oferte + „Revendică oferta” (fără QR — doar cod text, la cererea utilizatorului); badge-uri „Promovat” / „Restaurant Premium”
- [ ] Rezultate: filtru „Doar cu oferte”, poziționare promovată etichetată; secțiunea „Oferte pentru tine”
- [x] Formular rezervare real cu selecție cupon
- [ ] Admin: venituri, comisioane, prețuri editabile, confirmare plăți, suspendări, aprobare proprietari
- [ ] Webhook procesator de plăți (blocat: plăți neactivate)
- [ ] Testare end-to-end a scenariilor
