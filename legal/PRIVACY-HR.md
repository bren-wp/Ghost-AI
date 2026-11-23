# Ghost AI — Pravila privatnosti

**Izdavatelj proizvoda:** Brendigo · **Službena mrežna stranica:** https://brendigo.com  
**Verzija dokumenta:** 1.0 · **Datum:** 21. studenoga 2026.

## Lokalna pohrana
Aplikacija može obrađivati i pohranjivati razgovore, postavke, konfiguracije modela, povijest i radne datoteke lokalno na uređaju. Korisnik kontrolira datoteke i odobrenja funkcija s pristupom uređaju. Samo deinstaliranje ne jamči automatsko uklanjanje svih korisničkih podataka iz profilnih direktorija.

## Prijenos podataka
Kada korisnik odabere vanjskog AI pružatelja, promptovi i odabrani dokumenti ili drugi sadržaji mogu se prenijeti na njegovu infrastrukturu. Obrada podliježe pravilima tog pružatelja. Povezivanje s lokalnim modelima i vanjskim pružateljima ostaje dostupno, ali korisnik odabire na što se spaja. Za lokalne modele prijenos prema vanjskom API-ju nije potreban za samu inferenciju, ali mrežno pretraživanje, sinkronizacija i druge korisnički aktivirane funkcije mogu koristiti mrežu. Ne tvrdi se da odabrani vanjski pružatelj zadržava podatke lokalno.

## API ključevi i sigurnost
Autentikacijski podaci trebaju se pohranjivati zaštićeno, s pristupom ograničenim na aplikaciju i odgovarajuće funkcije operacijskog sustava. Nije dopušteno upisivati tajne u izvještaje o pogreškama ili javne zapisnike. Prije prijave problema korisnik mora ukloniti osobne i povjerljive podatke.

## Automatska ažuriranja
Automatska provjera ažuriranja prema zadanim je postavkama isključena i aktivira se samo nakon korisnikova odabira. Korisnik i bez aktivacije može ručno provjeriti ažuriranja. Kada korisnik zatraži provjeru ili uključi automatsku provjeru, aplikacija može zatražiti javni statički manifest na domeni https://brendigo.com radi usporedbe verzija. Poslužitelj može tehnički obraditi podatke tipične za HTTP zahtjev (npr. IP adresu) prema vlastitim pravilima i zakonskim obvezama. Manifest ne zahtijeva račun korisnika ni bazu podataka.

## Zadržavanje i brisanje
Lokalnim podatcima korisnik upravlja putem mogućnosti aplikacije i operacijskog sustava. Brisanje na uređaju ne znači automatsko brisanje ranije poslanih podataka u sustavima vanjskih pružatelja.

## Prava korisnika i kontakt
Za pitanja o zaštiti podataka obratite se Brendigu putem službene stranice https://brendigo.com. Kada su primjenjivi, korisnici imaju prava propisana GDPR-om i nacionalnim pravom, uključujući prava na pristup, ispravak, brisanje i prigovor, uz pripadajuća ograničenja. Korisnik se može obratiti i nadležnom nadzornom tijelu.

**Napomena:** Prije javne distribucije potrebno je potvrditi identitet voditelja obrade, kontakt, stvarne tokove podataka, pravne osnove, rokove zadržavanja, međunarodne prijenose i ugovore s izvršiteljima obrade. Ovaj tekst nije potvrda usklađenosti.