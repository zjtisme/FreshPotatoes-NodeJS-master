module.exports = function(sequelize, DataTypes) {
	return sequelize.define('genre', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING
		}
	}, {timestamps: false}, {underscored: true});
}