Discord bot that notifies users of people looking to play a game

Setup:

* Copy .env.example to .env and adjust accordingly
* (optional) Docker:
  * Run `docker-compose up -d` to build, create, start, and attach the docker container
  * Run `docker-compose exec node /bin/bash` to start using the bash shell inside the container
* Run `npm install`
* Migrate the database with `npm run sequelize db:migrate`
* Seed the database with `npm run sequelize db:seed:all`
* Revert the last migration with `npm run sequelize db:migrate:undo`
* Revert all migrations with `npm run sequelize db:migrate:undo:all`
* Start the bot using `npm run bot`
