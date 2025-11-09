#!/bin/bash
# Skrypt uruchamiający backend Proxeon

echo "🚀 Uruchamianie backendu Proxeon..."
echo ""

# Przejdź do katalogu backendu
cd "$(dirname "$0")"

# Skopiuj plik konfiguracyjny
if [ ! -f .env ]; then
    echo "📝 Tworzę plik .env..."
    cp env.local .env
    echo "✅ Plik .env utworzony"
else
    echo "✅ Plik .env już istnieje"
fi

# Utwórz folder dla logo
if [ ! -d public/logos ]; then
    echo "📁 Tworzę folder public/logos..."
    mkdir -p public/logos
    echo "✅ Folder utworzony"
else
    echo "✅ Folder public/logos już istnieje"
fi

# Sprawdź node_modules
if [ ! -d node_modules ]; then
    echo "📦 Instaluję zależności..."
    npm install
else
    echo "✅ Zależności już zainstalowane"
fi

echo ""
echo "🎯 Uruchamiam serwer na porcie 1234..."
echo ""

# Uruchom serwer
node app.js

