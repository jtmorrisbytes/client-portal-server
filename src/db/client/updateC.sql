-- update client set 
--   first_name = $2,
--   last_name = $3,
--   email = $4,
--   phone_number = $5,
--   street_address = $6,
--   city = $7,
--   state= $8,
--   zip= $9
-- where client_id = $1 returning *;
do $update_client$
declare
 new_first_name text:= (select coalesce($2,(select first_name from client where client_id = $1),''));
 new_last_name text:= (select coalesce($3,(select last_name from client where client_id = $1),''));
 new_email text:= (select coalesce($4, (select email from client where client_id = $1)));
 new_phone_number text := (select coalesce($5,(select phone_number from client where client_id = $1),''));
 new_street_address text := (select coalesce($6, (select street_address from client where client_id = $1),''));
 new_city text := (select coalesce($7,(select city from client where client_id = $1),''));
 new_state text := (select coalesce($8, (select state from client where client_id = $1),''));
 new_zip text := (select coalesce($9,(select zip from client where client_id = $1),''));
begin
  if exists(select client_id from client where client_id = $1) then
    raise notice 'the client exists';
    if new_email is null then
      raise exception 'Email can not be null';
    elsif 
      exists (select client_id from client
        where client_id = $1 and client.email <> new_email) and
      exists 
        (select client_id from client 
          where client_id <> 1 and client.email = new_email) then
    raise exception 'Email already exists',new_email;
    else
    update client set 
      first_name = new_first_name,
      last_name = new_last_name,
      email = new_email,
      phone_number = new_phone_number,
      street_address = new_street_address,
      city = new_city,
      state = new_state,
      zip = new_zip
    where client_id = $1;
    end if;
  else
    raise exception 'Client id % does not exist', 1;
  end if;
end $update_client$;
select client_id, first_name,
      last_name,
      email ,
      phone_number ,
      street_address ,
      city,
      state ,
      zip
      from client where client_id = $1;