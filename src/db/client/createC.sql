insert into client (first_name,last_name,email,phone_number,street_address,city,state,zip)
select coalesce($1,'') as "first_name",
       coalesce($2,'') as "last_name",
       coalesce($3,null) as "email",
       coalesce($4,'') as "phone_number",
       coalesce($5,'') as "street_address",
       coalesce($6,'') as "city",
       coalesce($7,'') as "state",
       coalesce($8,'') as "zip"
