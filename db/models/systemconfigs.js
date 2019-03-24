const moment = require('moment');

module.exports = function(sequelize, DataTypes) {
    return sequelize
        .define('systemconfigs', {
            system_config_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            ref_id: DataTypes.INTEGER,
            value: DataTypes.STRING(500),
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
