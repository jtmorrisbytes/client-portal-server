
-- include column aliases that convert
-- snake case to camel case, eliminating
-- the need for post processing on the
-- server
SELECT users_id as id,
       first_name as "firstName",
       last_name as "lastName",
       email,
       street_address as "streetAddress",
       city, 
       state, 
       zip 
from users 
where users_id = $1;