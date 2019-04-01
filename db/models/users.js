const moment = require('moment');

module.exports = function(sequelize, DataTypes) {
    return sequelize
        .define('users', {
            user_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            google_id: DataTypes.STRING(64),
            google_token: DataTypes.TEXT,
            input_folder: DataTypes.STRING(256),
            output_folder: DataTypes.STRING(256),
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE
        },
        {
            freezeTableName: true,

            hooks: {
                beforeCreate(instance) {
                    instance.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
                    instance.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
                },

                beforeUpdate(instance) {
                    instance.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
                }
            }
        });
};
