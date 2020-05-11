insert into users_client (users_id, client_id) (select $1, $2 where 
       (select count(*) from users_client where users_id = $1 and client_id = $2) = 0 and 
       exists (select users_id from users where users_id=$1)) and 
       exists (select client_id from client where client_id = $2) returning users_id, client_id;