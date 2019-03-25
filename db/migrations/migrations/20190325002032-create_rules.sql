up:
    CREATE TABLE `rules` (
        `rule_id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(64) NOT NULL,
        `is_contained` tinyint(1) NOT NULL,
        `text` varchar(256) NOT NULL,
        `destination` varchar(256),
        `created_at` datetime NOT NULL,
        `updated_at` datetime NOT NULL,
        PRIMARY KEY (`rule_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
down:
    DROP TABLE `rules`;