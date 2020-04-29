update client set (first_name,last_name,email,phone_number, street_address, city, state, zip)
where client_id = $1;