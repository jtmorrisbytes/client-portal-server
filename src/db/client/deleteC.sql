begin transaction
delete from users_client where client_id = $1;
delete from client where client_id = $1
commit
select client_id from client where client_id = $1