SELECT client_id,
first_name as "firstName",
last_name as "lastName",
email,
phone_number as "phoneNumber",
street_address as "streetAddress",
city,
state,
zip 
FROM client WHERE client_id= $1;

