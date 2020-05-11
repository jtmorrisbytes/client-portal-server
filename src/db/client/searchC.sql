select 
 client_id,
 first_name,
 last_name,
 email,
 phone_number,
 street_address,
 city,
 state,
 zip
 from client
where 
 first_name   ILIKE $1 OR 
 last_name    ILIKE $1 OR 
 email        ILIKE $1 OR 
 phone_number ILIKE $1
ORDER BY first_name, last_name ASC;