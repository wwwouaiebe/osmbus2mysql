/*
Copyright - 2023 - wwwouaiebe - Contact: https://www.ouaie.be/

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

import theMySqlDb from './MySqlDb.js';
import process from 'process';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Coming soon...
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class OsmLoader {

	/**
    * Coming soon...
    * @type {Array}
   */

	#osmData = {};

	/**
    * Coming soon...
    * @type {Array}
   */

	loadData = {
		query : '',
		tableName : ''
	};

	/**
    * Coming soon...
   */

	async #osmDownload ( ) {

		await fetch ( this.loadData.query )
			.then (
				response => {
					if ( response.ok ) {
						return response.json ( );
					}
					console.error ( String ( response.status ) + ' ' + response.statusText );
					process.exit ( 1 );
				}
			)
			.then (
				async jsonResponse => {
					this.#osmData = jsonResponse.elements;
					await this.#loadOsmData ( );
				}
			)
			.catch (
				err => {
					console.error ( err );
					process.exit ( 1 );
				}
			);
	}

	/**
    * Coming soon...
   */

	async #createTableOsm ( ) {

		console.info ( '\nCreation of table ' + this.loadData.tableName + '...' );

		await theMySqlDb.execSql (
			'DROP TABLE if EXISTS ' + this.loadData.tableName + ';'
		);

		await theMySqlDb.execSql (
			'CREATE TABLE ' + this.loadData.tableName + ' ( ' +
				'primary_key int NOT NULL AUTO_INCREMENT, ' +
                'osm_id BIGINT, ' +
				'PRIMARY KEY (primary_key) );'
		);
 	}

	/**
    * Coming soon...
   */

	async #loadOsmData ( ) {
		let sqlTagNames = [];
		let osmDataCouter = 0;
		for ( osmDataCouter = 0; osmDataCouter < this.#osmData.length; osmDataCouter ++ ) {
			let osmId = this.#osmData [ osmDataCouter ].id;
			console.error ( osmId );
			await theMySqlDb.execSql (
				'insert into ' + this.loadData.tableName + ' ( osm_id ) values (' + osmId + ');'
			);
			for ( const tagName in this.#osmData [ osmDataCouter ].tags ) {
				let sqlTagName = 'osm_' + tagName.replaceAll ( ':', '_' );
				if ( -1 === sqlTagNames.indexOf ( sqlTagName ) ) {
					sqlTagNames.push ( sqlTagName );
					await theMySqlDb.execSql (
						'alter table ' + this.loadData.tableName + ' add `' + sqlTagName + '` varchar(256);'
					);
				}
				try {
					await theMySqlDb.execSql (
						'update ' + this.loadData.tableName + ' set ' +
                    sqlTagName +
                    ' = "' +
                    this.#osmData [ osmDataCouter ].tags [ tagName ] +
                    '" where osm_id=' +
                    osmId + '; '
					);
				}
				catch ( err ) {
					console.error ( this.#osmData [ osmDataCouter ] );
					console.error ( err );
				}
			}
 		}
		await theMySqlDb.execSql (
			'commit;'
		);
	}

	/**
     * The constructor
     */

	constructor ( ) {
	}

	/**
    * Coming soon...
   */

	async start ( ) {
		await this.#createTableOsm ( );
		await this.#osmDownload ( );
	}

}

export default OsmLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */