up:
alter table users add column runs_per_day int default 0 after output_folder;
down:
alter table users drop column runs_per_day;