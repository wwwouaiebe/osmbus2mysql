/* eslint-disable complexity */
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

import process from 'process';
import theConfig from './Config.js';
import OsmDataLoader from './OsmDataLoader.js';
import theMySqlDb from './MySqlDb.js';
import DbDataLoader from './DbDataLoader.js';
import WikiBusLoader from './WikiBusLoader.js';
import WikiBusBuiler from './WikiBusBuilder.js';
import theOsmData from './OsmData.js';
import theOperator from './Operator.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Start the app:
 * - read and validate the arguments
 * - set the config
 * - remove the old files if any
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class AppLoader {

	/**
     * The version number
     * @type {String}
     */

	static get #version ( ) { return 'v2.0.0'; }

	/**
	* Complete theConfig object from the app parameters
	* @param {?Object} options The options for the app
	 */

	#createConfig ( options ) {

		if ( options ) {
			theConfig.dbName = options.dbName;
			theConfig.appDir = process.cwd ( ) + '/node_modules/osmbus2mysql/src';
		}
		else {
			process.argv.forEach (
				arg => {
					const argContent = arg.split ( '=' );
					switch ( argContent [ 0 ] ) {
					case '--src' :
						theConfig.srcDir = argContent [ 1 ] || theConfig.srcDir;
						break;
					case '--dbName' :
						theConfig.dbName = argContent [ 1 ] || theConfig.dbName;
						break;
					case '--network' :
						theConfig.network = argContent [ 1 ] || theConfig.network;
						break;
					case '--operator' :
						theConfig.operator = argContent [ 1 ] || theConfig.operator;
						break;
					case '--loadOldWiki' :
						if ( 'true' === argContent [ 1 ] ) {
							theConfig.loadOldWiki = argContent [ 1 ] || theConfig.loadOldWiki;
						}
						break;
					case '--loadOsmBus' :
						if ( 'true' === argContent [ 1 ] ) {
							theConfig.loadOsmBus = argContent [ 1 ] || theConfig.loadOsmBus;
						}
						break;
					case '--loadOsmBusStop' :
						if ( 'true' === argContent [ 1 ] ) {
							theConfig.loadOsmBusStop = argContent [ 1 ] || theConfig.loadOsmBusStop;
						}
						break;
					case '--loadOsmBusStopAllNetworks' :
						if ( 'true' === argContent [ 1 ] ) {
							theConfig.loadOsmBusStopAllNetworks = argContent [ 1 ] || theConfig.loadOsmBusStopAllNetworks;
						}
						break;
					case '--createNewWiki' :
						if ( 'true' === argContent [ 1 ] ) {
							theConfig.createNewWiki = argContent [ 1 ] || theConfig.createNewWiki;
						}
						break;
					case '--all' :
						if ( 'true' === argContent [ 1 ] ) {
							theConfig.loadOldWiki = 'true';
							theConfig.loadOsmBus = 'true';
							theConfig.createNewWiki = 'true';
						}
						break;
					case '--version' :
						console.error ( `\n\t\x1b[36mVersion : ${AppLoader.#version}\x1b[0m\n` );
						process.exit ( 0 );
						break;
					default :
						break;
					}
				}
			);
			theConfig.appDir = process.argv [ 1 ];
		}

		// the config is now frozen
		Object.freeze ( theConfig );
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
	}

	/**
	 * Load the app, searching all the needed infos to run the app correctly
	 * @param {?Object} options The options for the app
	 */

	async loadApp ( options ) {

		// config
		this.#createConfig ( options );
		await theOperator.loadData ( );
		let network = theOperator.getNetwork ( theConfig.network );

		console.info ( '\nStarting gtfs2mysql ...\n\n' );

		await theMySqlDb.start ( );

		if ( theConfig.loadOsmBusStop ) {

			let uri = '';
			if ( theConfig.loadOsmBusStopAllNetworks ) {

				// Province Liège
				uri = 'https://lz4.overpass-api.de/api/interpreter?data=[out:json][timeout:40];' +
					'node(area:3601407192)[highway=bus_stop];out;';

				/*
				// Province Luxembourg
				uri = 'https://lz4.overpass-api.de/api/interpreter?data=[out:json][timeout:40];' +
					'node(area:3601412581)[highway=bus_stop];out;';
				*/
			}
			else {

				// TECL but some bad results ...
				uri = 'https://lz4.overpass-api.de/api/interpreter?data=[out:json][timeout:40];' +
					'node["network"~"\w*' + theConfig.network + '\w*"][highway=bus_stop];out;';
			}

			theOsmData.clear ( );
			await new OsmDataLoader ( ).fetchData ( uri );
			await new DbDataLoader ( ).loadData ( );
		}

		if ( theConfig.loadOsmBus || theConfig.createNewWiki ) {
			let uri = 'https://lz4.overpass-api.de/api/interpreter?data=[out:json][timeout:40];' +
			'rel["network"~"' + theConfig.network + '"]' +
			'["operator"~"' + theConfig.operator + '"]' +
			'[type="' + theConfig.osmType + '"]->.rou;' +
			'(.rou <<; - .rou;); >> ->.rm;.rm out;';

			theOsmData.clear ( );
			await new OsmDataLoader ( ).fetchData ( uri );
			await new DbDataLoader ( ).loadData ( );
		}

		if ( theConfig.loadOldWiki || theConfig.createNewWiki ) {
			await new WikiBusLoader ( ).start ( );
		}

		if ( theConfig.createNewWiki ) {
			await new WikiBusBuiler ( ).buildWiki ( );
		}

		await theMySqlDb.end ( );

		// end of the process
		const deltaTime = process.hrtime.bigint ( ) - theConfig.startTime [ 0 ];

		// eslint-disable-next-line no-magic-numbers
		const execTime = String ( deltaTime / 1000000000n ) + '.' + String ( deltaTime % 1000000000n ).substring ( 0, 3 );

		console.info ( `\nFiles generated in ${execTime} seconds.` );

		console.info ( '\ngtfs2mysql ended...\n\n' );

	}

}

export default AppLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */