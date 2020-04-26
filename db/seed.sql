DROP TABLE IF EXISTS users_client;
drop table if exists setting;
create table setting (
setting_id int primary key
);
create table users (
  users_id serial primary key,
  email varchar(254) UNIQUE NOT NULL,
  email_verified boolean not null default false,
  hash text,
  first_name text,
  last_name text,
  phone_number varchar(25),
  setting_id int references setting(setting_id),
  street_address text,
  city text,
  state text,
  zip text
);


drop table if exists client;
create table client (
  client_id serial Primary Key,
  email varchar(254) UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone_number varchar(25),
  street_address text,
  city text,
  state text,
  zip text
);


create table users_client (
  users_client_id serial primary key,
  users_id int references users(users_id),
  client_id int references client(client_id)
);
