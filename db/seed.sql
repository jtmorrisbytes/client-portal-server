-- create table setting (
-- setting_id int primary key
-- );
drop table if exists users cascade;
create table users (
  users_id serial primary key,
  email varchar(254) UNIQUE NOT NULL,
  email_verified boolean not null default false,
  hash text,
  first_name text,
  last_name text,
  phone_number varchar(25),
  -- setting_id int references setting(setting_id),
  street_address text,
  city text,
  state text,
  zip text
);
drop table if exists client cascade;
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

drop table if exists users_client cascade;
create table users_client (
  users_client_id serial primary key,
  users_id int references users(users_id),
  client_id int references client(client_id)
);

insert into users(email, email_verified, hash) values('jthecybertinkerer@gmail.com', false, 'the hash');