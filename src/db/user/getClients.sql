SELECT
 cl.client_id as id,
 cl.first_name as "firstName",
 cl.last_name as "lastName",
 cl.email,
 cl.phone_number as "phoneNumber",
 cl.street_address as "streetAddress",
 cl.city,
 cl.state,
 cl.zip 
FROM client AS cl
INNER JOIN users_client AS u_c ON
cl.client_id = u_c.client_id
INNER JOIN users AS u ON
u.users_id =u_c.users_id where u.users_id = $1;
