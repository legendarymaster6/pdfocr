up:
alter table rules add column `index` int(11) after destination;
down:
alter table rules drop column `index`;