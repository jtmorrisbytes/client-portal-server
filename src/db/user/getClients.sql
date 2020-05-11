SELECT 
 cl.first_name,
 cl.last_name,
 cl.email,
 cl.phone_number,
 cl.street_address,
 cl.city,
 cl.state,
 cl.zip 
FROM client AS cl
INNER JOIN users_client AS u_c
u_c.cl.client_id== u_c.client_id
INNER JOIN users AS u ON
u.user_id==u_c.users_id
