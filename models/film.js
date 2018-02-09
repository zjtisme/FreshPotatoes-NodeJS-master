module.exports = function(sequelize, DataTypes) {
	return sequelize.define('film', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING
		},
		release_date: {
			type: DataTypes.DATE
		},
		tagline: {
			type: DataTypes.STRING
		},
		revenue: {
			type: DataTypes.BIGINT
		},
		budget: {
			type: DataTypes.BIGINT
		},
		runtime: {
			type: DataTypes.INTEGER
		},
		original_language: {
			type: DataTypes.STRING
		},
		status: {
			type: DataTypes.STRING
		},
		genre_id: {
			type: DataTypes.INTEGER
		}
	}, {timestamps: false}, {underscored: true});
}