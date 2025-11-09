# Proxeon - instrukcja instalacji (server)

## Plik config.json

Zawartość:

* connectionString : "mongodb://nazwa_uzytkownika:haslo@server/baza"
* secret : string używany przez JWT

## Plik swagger.yaml

Dokumentacja api, opis każdego z endpointów

## Plik messages.json

Komunikaty informacyjne w języku polskim i angielskim

## Plik package.json

Zawartość:

* name - nazwa aplikacji
* version - wersja
* description - opis
* license - licencja
* scripts - słownik zawierający polecenia skryptów
* dependencies - używane zależności

## Kroki:
* Sklonowanie lub pobranie projektu
* Uruchomienie z poziomu folderu komendy

```
npm install
```

Konieczne może być również odpalenie komendy:
```
npm i express-jwt
npm audit fix
```

Serwer odpalamy za pomocą polecenia:
```
node app.js
```



