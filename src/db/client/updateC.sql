update client set 
  first_name = $2,
  last_name = $3,
  email = $4,
  phone_number = $5,
  street_address = $6,
  city = $7,
  state= $8,
  zip= $9
where client_id = $1
RETURNING 
 client_id,
 first_name,
 last_name,
 email,
 phone_number,
 street_address,
 city,
 state,
 zip;
