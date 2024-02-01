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

class OsmBusLoader {

	/**
    * Coming soon...
    * @type {Array}
   */

	#osmData = {};

	/**
    * Coming soon...
   */

	async #osmDownload ( ) {

		// 3601407192 province Liège
		// 3602377747 anthisnes
		await fetch (
			'https://lz4.overpass-api.de/api/interpreter?data=[out:json][timeout:40];' +
            'relation(area:3601407192)' +
			'[network=TECL]' +
			'[operator=TEC]' +
			'[type=route][route=bus];out;'
		)
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

	async #createTableOsmBusRoute ( ) {

		console.info ( '\nCreation of table osm_bus_route...' );

		await theMySqlDb.execSql (
			'DROP TABLE if EXISTS osm_bus_route;'
		);

		await theMySqlDb.execSql (
			'CREATE TABLE osm_bus_route ( ' +
				'route_pk int NOT NULL AUTO_INCREMENT, ' +
                'osm_id int, ' +
				'PRIMARY KEY (route_pk) );'
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
			await theMySqlDb.execSql (
				'insert into osm_bus_route ( osm_id ) values (' + osmId + ');'
			);
			for ( const tagName in this.#osmData [ osmDataCouter ].tags ) {
				let sqlTagName = 'osm_' + tagName.replaceAll ( ':', '_' );
				if ( -1 === sqlTagNames.indexOf ( sqlTagName ) ) {
					sqlTagNames.push ( sqlTagName );
					await theMySqlDb.execSql (
						'alter table osm_bus_route add `' + sqlTagName + '` varchar(256);'
					);
				}
				await theMySqlDb.execSql (
					'update osm_bus_route set ' +
                    sqlTagName +
                    ' = "' +
                    this.#osmData [ osmDataCouter ].tags [ tagName ] +
                    '" where osm_id=' +
                    osmId + '; '
				);
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
		Object.freeze ( this );
	}

	/**
    * Coming soon...
   */

	async start ( ) {

		await this.#createTableOsmBusRoute ( );

		await this.#osmDownload ( );

	}

}

export default OsmBusLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */