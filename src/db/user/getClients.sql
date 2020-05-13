SELECT
 cl.client_id,
 cl.first_name,
 cl.last_name,
 cl.email,
 cl.phone_number,
 cl.street_address,
 cl.city,
 cl.state,
 cl.zip 
FROM client AS cl
INNER JOIN users_client AS u_c ON
cl.client_id = u_c.client_id
INNER JOIN users AS u ON
u.users_id =u_c.users_id;
