
copy .\src\package.json .\dist
copy .\src\yarn.lock .\dist
copy .\src\client.js .\dist
copy .\src\db.ca-certificate.crt .\dist
copy .\src\*.pem .\dist
xcopy /s /Y spec .\dist\spec\
xcopy /s /Y .\src\db .\dist\db\