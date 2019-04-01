up:
alter table users add column google_token text after google_id;
alter table users add column input_folder varchar(256) after google_token;
alter table users add column output_folder varchar(256) after input_folder;
down:
alter table users drop column google_token;
alter table users drop column input_folder;
alter table users drop column output_folder;