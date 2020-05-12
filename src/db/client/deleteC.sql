do $delete_client$
declare
  v_client_id int = (select coalesce($1,-1));
begin
if exists(select client_id from client where client_id = v_client_id) then
  delete from users_client where client_id = v_client_id;
  delete from client where client_id = v_client_id;
else
  raise Exception 'No client exists with id ''%''', v_client_id USING COLUMN='client_id', TABLE='client',HINT=v_client_id, DETAIL='Client does not exist.';
end if;
end $delete_client$;
select exists(select client_id from client where client_id = $1);