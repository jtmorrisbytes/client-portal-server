do $update_client$
declare
 new_first_name text:= (select coalesce($2,(select first_name from client where client_id = $1),''));
 new_last_name text:= (select coalesce($3,(select last_name from client where client_id = $1),''));
 new_email text:= (select lower(coalesce($4, (select email from client where client_id = $1))));
 new_phone_number text := (select coalesce($5,(select phone_number from client where client_id = $1),''));
 new_street_address text := (select coalesce($6, (select street_address from client where client_id = $1),''));
 new_city text := (select coalesce($7,(select city from client where client_id = $1),''));
 new_state text := (select coalesce($8, (select state from client where client_id = $1),''));
 new_zip text := (select coalesce(cast ($9 as text),(select zip from client where client_id = $1),''));
begin
  if exists(select client_id from client where client_id = $1) then
    raise notice 'the client exists';
    if new_email is null then
      raise exception 'Email can not be null' using COLUMN='email',ERRCODE=23502;
    elsif 
      exists (select client_id from client
        where client_id = $1 and client.email <> new_email) and
      exists 
        (select client_id from client 
          where client_id <> 1 and client.email = new_email) then
    raise exception 'Email ''%'' already exists', new_email using COLUMN = 'email',
     TABLE='clientPortal', ERRCODE = 23505, HINT=new_email ;
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