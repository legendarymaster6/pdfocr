up:
    CREATE TABLE `systemconfigs` (
        `system_config_id` int(11) NOT NULL AUTO_INCREMENT,
        `ref_id` int(11) NOT NULL,
        `value` varchar(500),
        `created_at` datetime NOT NULL,
        `updated_at` datetime NOT NULL,
        PRIMARY KEY (`system_config_id`),
        KEY `ref_id` (`ref_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
down:
    DROP TABLE `systemconfigs`;