const moment = require('moment');

module.exports = function(sequelize, DataTypes) {
    return sequelize
        .define('rules', {
            rule_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: DataTypes.STRING(64),
            is_contained: DataTypes.INTEGER,
            text: DataTypes.STRING(256),
            destination: DataTypes.STRING(256),
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
