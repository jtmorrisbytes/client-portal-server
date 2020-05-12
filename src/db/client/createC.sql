insert into client (first_name,last_name,email,phone_number,street_address,city,state,zip)
values(
  (select coalesce($1,'')),
  (select coalesce($2,'')),
  (select coalesce($3,'')),
  $4,$5,$6,$7,$8) returning *;