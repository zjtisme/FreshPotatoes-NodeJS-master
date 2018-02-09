const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// const API_URL = 'http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1';

// configure sequelize orm model
const sequelize = new Sequelize('','','', {
	host: '',
	dialect: 'sqlite',
	storage: './db/database.db'
});

// check if we connected to database or not
sequelize.authenticate().catch(err => {
	console.error('Unable to connect to the database:', err);
});

// import two models for future use
const film_table = sequelize.import('./models/film');
const genre_table = sequelize.import('./models/genre');

// define foreignkey explicitely, genres and films has one-to-many relationship
film_table.belongsTo(genre_table, {
	foreignKey: 'genre_id'
});

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('*', function(req, res){
	res.status(404).json({
		message: 'Please try this url: /films/:id/recommendations'
	})
});

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  let limit = 10;
  if( req.query.limit ) {
  	limit = parseInt(req.query.limit);
  }
  let offset = 0;
  if( req.query.offset ) {
  	offset = parseInt(req.query.offset);
  }
  let curId = req.params.id;
  // console.log(curId);
  // find the parent film object
  film_table.findById(curId)
  	.then( film => {
  		// console.log(film);
  		// make sure film is exist!
  		if( film ) {
  			let prevFifteenYears = new Date(film.release_date);
  			prevFifteenYears.setFullYear(prevFifteenYears.getFullYear() - 15);
  			let nextFifteenYears = new Date(film.release_date);
  			nextFifteenYears.setFullYear(nextFifteenYears.getFullYear() + 15);

  			// join film table and genre table and ordered by film.id
  			film_table.findAll({
  				where: {
  					genre_id: film.genre_id,
  					release_date: {
  						$between: [prevFifteenYears, nextFifteenYears]
  					}
  				},
  				include: [genre_table],
  				order: ['film.id']
  			})
  			.then( results => {
  				let matchedFilms = '';
  				for(let i=0; i<results.length; i++) {
  					if(i == results.length - 1) {
  						matchedFilms += results[i].id;
  					}else{
  						matchedFilms += results[i].id + ',';
  					}
  				}
  				console.log(matchedFilms);
  				// let request_options = {
  				// 	uri: '${API_URL}?films=${matchedFilms}',
  				// 	json: true
  				// };

  				request('http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=' + matchedFilms, (err, response, body)=>{
  					// console.log(err);
  					// console.log(response.body);
  					let reviews = JSON.parse(response.body);
 					
 					// dynamically adding reviews to corresponding film objects
  					for(let j=0; j<results.length; j++) {
  						results[j].reviews = reviews[j].reviews;
  					}

  					results = results.filter( result => {
  						return result.reviews.length >= 5;
  					})

  					results = results.filter( result => {
  						return calAvgRating(result.reviews) > 4.0;
  					})

  					let finalResponse = [];
  					results.forEach(result => {
  						finalResponse.push({
  							id: result.id,
  							title: result.title,
  							releaseDate: result.release_date,
  							genre: result.genre.name,
  							averageRating: calAvgRating(result.reviews).toFixed(2),
  							reviews: result.reviews.length
  						})
  					})

  					res.status(200).json({
  						recommendations: finalResponse.slice(offset, offset + limit),
  						meta: {limit: limit, offset: offset}
  					})
  				});
  			})
  			.catch( err => {
  				console.log(err);
  				res.status(422).json({message: 'some errors occurred'});
  			})
  		}
  		else {
  			res.status(422).json({message: 'key is missing'});
  		}
  	})
  	.catch( err => {
  		console.log(err);
  		res.status(422).json({message: 'key is missing'});
  	});
}

// helper function to calculate average rating
function calAvgRating(reviews) {
	let totalRating = 0.0;
	let number = reviews.length;
	for(let i=0; i<number; i++) {
		totalRating += reviews[i].rating;
	}

	return totalRating / number;
}

module.exports = app;
