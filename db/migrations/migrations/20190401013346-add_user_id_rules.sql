up:
alter table rules add column user_id int after rule_id;
down:
alter table rules drop column user_id;
