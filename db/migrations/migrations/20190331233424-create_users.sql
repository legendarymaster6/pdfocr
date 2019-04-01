up:
    CREATE TABLE `users` (
        `user_id` int(11) NOT NULL AUTO_INCREMENT,
        `google_id` varchar(64) NOT NULL UNIQUE,
        `created_at` datetime NOT NULL,
        `updated_at` datetime NOT NULL,
        PRIMARY KEY (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
down:
    DROP TABLE `users`;