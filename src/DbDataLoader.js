/*
Copyright - 2024 - wwwouaiebe - Contact: https://www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
Changes:
	- v1.0.0:
		- created
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import theOsmData from './OsmData.js';
import theMySqlDb from './MySqlDb.js';
import theConfig from './Config.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Coming soon
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class DbDataLoader {

	/**
	* Coming soon
	@type {String}
	 */

	get #routeMasterTableName ( ) { return 'osm_bus_route_masters'; }

	/**
	* Coming soon
	@type {String}
	 */

	get #routeTableName ( ) { return 'osm_bus_routes'; }

	/**
	* Coming soon
	@type {String}
	 */

	get #stopsTableName ( ) { return 'osm_bus_stops'; }

	/**
	* Coming soon
	@param {Array} dataArray Coming soon
	@param {String} tableName Coming soon
	 */

	async #createLinks ( dataArray, tableName ) {
		await theMySqlDb.execSql (
			'DROP TABLE if EXISTS ' + tableName + ';'
		);
		await theMySqlDb.execSql (
			'CREATE TABLE ' + tableName + ' ( osm_master_id BIGINT, osm_id BIGINT);'
		);
		for ( const data of dataArray ) {
			for ( const member of data.members ) {
				await theMySqlDb.execSql (
					'INSERT INTO ' + tableName + ' ( osm_master_id, osm_id ) values (' +
                    data.id + ', ' + member.ref + ');'
				);
			}
		}
	}

 	/**
	* Coming soon
	@param {Array} dataArray Coming soon
	@param {String} tableName Coming soon
	 */

	async fillTable ( dataArray, tableName ) {

		for ( let counter = 0; counter < dataArray.length; counter ++ ) {
			let data = dataArray [ counter ];
			let sqlString = 'INSERT INTO ' + tableName + ' ( osm_id';
			let sqlValues = data.id;
			for ( const [ key, value ] of Object.entries ( data.tags ) ) {
				sqlString += ', osm_' + key.replaceAll ( ':', '_' );
				sqlValues += ', "' + value.replaceAll ( '"', '' ) + '"';
			};
			sqlString += ') values (' + sqlValues + ');';
			await theMySqlDb.execSql ( sqlString );
		}

		await theMySqlDb.execSql ( 'commit;' );
	}

 	/**
	* Coming soon
	@param {Array} columnNames Coming soon
	@param {String} tableName Coming soon
	 */

	async #createTable ( columnNames, tableName ) {
		await theMySqlDb.execSql (
			'DROP TABLE if EXISTS ' + tableName + ';'
		);

		let sqlString =
            'CREATE TABLE ' + tableName + ' ( ' +
            'primary_key int NOT NULL AUTO_INCREMENT, ' +
            'osm_id BIGINT, ' +
            'PRIMARY KEY (primary_key)';

		columnNames.forEach (
			columnName => {
				sqlString += ', ' + 'osm_' + columnName.replaceAll ( ':', '_' ) + ' varchar(128) ';
			}
		);
		sqlString += ');';

		await theMySqlDb.execSql ( sqlString );
	};

 	/**
	* Coming soon
	@param {Map} aMap Coming soon
	 */

	#searchTags ( aMap ) {
		let tags = new Map ( );
		aMap.forEach (
			element => {
				Object.keys ( element.tags ).forEach (
					key => { tags.set ( key, key ); }
				);
			}
		);

		return tags;
	}

 	/**
	* Coming soon
	 */

	async loadData ( ) {
		if ( theConfig.loadOsmBus ) {
			console.info ( 'Creating table ' + this.#routeMasterTableName );
			await this.#createTable (
				this.#searchTags ( theOsmData.routeMasters ),
				this.#routeMasterTableName
			);
			console.info ( 'Filling table ' + this.#routeMasterTableName );
			await this.fillTable (
				theOsmData.routeMasters,
				this.#routeMasterTableName
			);
			console.info ( 'Creating table ' + this.#routeTableName );
			await this.#createTable (
				this.#searchTags ( theOsmData.routes ),
				this.#routeTableName
			);
			console.info ( 'Filling table ' + this.#routeTableName );
			await this.fillTable (
				theOsmData.routes,
				this.#routeTableName
			);
			console.info ( 'Creating links' );
			await this.#createLinks (
				theOsmData.routeMasters,
				'osm_routes_links'
			);
		}
		if ( theConfig.loadOsmBusStop ) {
			console.info ( 'Creating table ' + this.#stopsTableName );
			await this.#createTable (
				this.#searchTags ( theOsmData.stops ),
				this.#stopsTableName
			);
			console.info ( 'Filling table ' + this.#stopsTableName );
			await this.fillTable (
				theOsmData.stops,
				this.#stopsTableName
			);
		}
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
	}
}

export default DbDataLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */