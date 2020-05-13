do $add_client_to_user$
declare
v_users_id int := (select users_id from users where users_id = $1);
v_client_id int := (select client_id from client where client_id = $2);
v_row_exists boolean := 
  EXISTS(select users_client_id
    from users_client 
    where client_id = v_client_id 
    and users_id = v_users_id);
BEGIN
  IF v_users_id IS NULL THEN
       raise not_null_violation USING COLUMN='users_id', TABLE='users';
  elsif v_client_id IS NULL THEN
       raise not_null_violation USING COLUMN='client_id', TABLE='client';
  elsif v_row_exists THEN
       raise unique_violation using COLUMN='client_id,users_id', TABLE='users_client';
  ELSE
  INSERT INTO users_client (users_id, client_id) VALUES (v_users_id,v_client_id);
  END IF;
END $add_client_to_user$;




-- insert into users_client (users_id, client_id) (select $1, $2 where 
--        (select count(*) from users_client where users_id = $1 and client_id = $2) = 0 and 
--        exists (select users_id from users where users_id=$1)) and 
--        exists (select client_id from client where client_id = $2) returning users_id, client_id;
