yarn install
rmdir /s /q dist
yarn webpack --mode production
copy src\package.json .\dist
copy src\package-lock.json .\dist
copy src\client.js .\dist
copy src\db.ca-certificate.pem