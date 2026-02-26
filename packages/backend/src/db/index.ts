import knex, { Knex } from 'knex'
import {config} from '../config/config';

const knexConfig: Knex.Config = {
    client: config.database.client,
    connection: config.database.connection,
    migrations: {
        directory: __dirname + '/migrations',
        extension: 'ts',
    },
    seeds: {
        directory: __dirname + '/seeds',
        extension: 'ts',
    },
    pool: {
        min: 2,
        max: 10,
    },
 }

 export const db : Knex = knex(knexConfig);