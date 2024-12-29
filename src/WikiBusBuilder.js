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
	- v2.0.0:
		- created
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import theConfig from './Config.js';
import theMySqlDb from './MySqlDb.js';
import fs from 'fs';
import theOperator from './Operator.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Coming soon
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class WikiBusBuiler {

	/**
	* Coming soon
	@type {Array}
	 */

	#gtfsBusRoutes = [];

	#network;

	/**
	* Coming soon
	 */

	async #searchGTFSBusRef ( ) {
		this.#gtfsBusRoutes = await theMySqlDb.execSql (
			'SELECT distinct gtfs_tec.routes.route_short_name AS routeRef, route_long_name AS routeLongName ' +
            'FROM gtfs_tec.routes ' +
            'WHERE agency_id = "' + this.#network.gtfsAgencyId + '" ' +
			'AND route_id like "' + this.#network.idPrefix + '%" ' +
            'ORDER BY LPAD ( gtfs_tec.routes.route_short_name, 5, " ");'
		);
		this.#gtfsBusRoutes.sort (
			( first, second ) => {

				// split the name into the numeric part and the alphanumeric part:
				// numeric part
				let firstPrefix = String ( Number.parseInt ( first.routeRef ) );
				let secondPrefix = String ( Number.parseInt ( second.routeRef ) );

				// alpha numeric part
				let firstPostfix = ( first.routeRef ?? '' ).replace ( firstPrefix, '' );
				let secondPostfix = ( second.routeRef ?? '' ).replace ( secondPrefix, '' );

				// complete the numeric part with spaces on the left and compare
				let result =
					( firstPrefix.padStart ( 5, ' ' ) + firstPostfix )
						.localeCompare ( secondPrefix.padStart ( 5, ' ' ) + secondPostfix );

				return result;
			}
		);
	}

	/**
	* Coming soon
    @param {String} gtfsRouteRef Coming soon
	 */

	async #getWikiTextRelations ( gtfsRouteRef ) {

		const results = await theMySqlDb.execSql (
			'SELECT ' +
            '    osmbus.osm_bus_routes.osm_ref AS osmRef, ' +
            '    osmbus.osm_bus_route_masters.osm_name AS osmRouteMasterName, ' +
            '    osmbus.osm_routes_links.osm_master_id AS osmRouteMasterId, ' +
            '    osmbus.osm_routes_links.osm_id AS osmRouteId, ' +
            '    osmbus.osm_bus_routes.osm_name AS osmRouteName ' +
            'FROM' +
            '    osmbus.osm_bus_route_masters ' +
            '    INNER JOIN ' +
            '    osmbus.osm_routes_links ' +
            '    ON osmbus.osm_bus_route_masters.osm_id = osmbus.osm_routes_links.osm_master_id ' +
            '    INNER JOIN osmbus.osm_bus_routes ' +
            '    ON osmbus.osm_routes_links.osm_id = osmbus.osm_bus_routes.osm_id ' +
            'WHERE osm_bus_routes.osm_ref =' +
            '"' + gtfsRouteRef + '"' +
            'ORDER BY CONCAT ( LPAD ( osmbus.osm_bus_route_masters.osm_ref, 5, " "), osmbus.osm_bus_routes.osm_name );'
		);
		if ( 0 === results.length ) {
			return '|';
		}
		let wikiTextRelations = '| {{relation|' + results[ 0 ].osmRouteMasterId + '}} route_master and ' +
		String ( results.length ) + ' route relations';
		/*
		results.forEach (
			result => {
				wikiTextRelations += '<br/>{{relation|' + result.osmRouteId + '}} ' + result.osmRouteName;
			}
		);
		*/

		return wikiTextRelations;

	}

	/**
	* Coming soon
	 */

	async #controlWiki ( ) {
		const results = await theMySqlDb.execSql (
			'SELECT DISTINCT gtfs_tec.routes.route_short_name, route_long_name FROM gtfs_tec.routes ' +
            'WHERE agency_id="' + this.#network.gtfsAgencyId + '" ' +
			'AND route_id like "%' + this.#network.idPrefix + '" ' +
            'AND gtfs_tec.routes.route_short_name NOT IN ' +
            '( SELECT osmbus.wiki_bus_routes.bus_ref FROM osmbus.wiki_bus_routes);'
		);
		if ( 0 !== results.length ) {
			console.error ( 'The following bus routes, found in the GTFS, are missing in the wiki: ' );
			results.forEach (
				ref => { console.error ( ref.route_short_name + ' ' + ref.route_long_name ); }
			);
		}
	}

	/**
	* Coming soon
    @param {String} gtfsRouteRef Coming soon
	 */

	async #getWikiRef ( gtfsRouteRef ) {
		const results = await theMySqlDb.execSql (
			'SELECT osmbus.wiki_bus_routes.wiki_ref as wikiRef FROM osmbus.wiki_bus_routes ' +
            'WHERE bus_ref ="' + gtfsRouteRef + '";'
		);
		if ( 0 === results.length ) {
			return '| ' + gtfsRouteRef;
		}
		return results [ 0 ].wikiRef;
	}

	/**
	* Coming soon
    @param {String} gtfsRouteRef Coming soon
	 */

	async #getWikiComment ( gtfsRouteRef ) {
		const results = await theMySqlDb.execSql (
			'SELECT osmbus.wiki_bus_routes.wiki_comment as wikiComment FROM osmbus.wiki_bus_routes ' +
            'WHERE bus_ref ="' + gtfsRouteRef + '";'
		);
		if ( 0 === results.length ) {
			return '|';
		}
		return results [ 0 ].wikiComment;
	}

	/**
	* Coming soon
 	 */

	async buildWiki ( ) {
		this.#network = theOperator.getNetwork ( theConfig.network );
		await this.#controlWiki ( );
		await this.#searchGTFSBusRef ( );
		let wikiText = '';
		for ( const gtfsBusRoute of this.#gtfsBusRoutes ) {
			console.info ( 'Now building wiki for bus ' + gtfsBusRoute.routeRef );
			wikiText += '|----\n';
			wikiText += await this.#getWikiRef ( gtfsBusRoute.routeRef ) + '\n';
			wikiText += '| ' + gtfsBusRoute.routeLongName + '\n';
			wikiText += await this.#getWikiComment ( gtfsBusRoute.routeRef ) + '\n';
			wikiText += await this.#getWikiTextRelations ( gtfsBusRoute.routeRef ) + '\n';
		}
 		fs.writeFileSync ( './wiki/newWiki' + theConfig.network + '.txt', wikiText );
	}

	/**
     * The constructor
     */

	constructor ( ) {
		Object.freeze ( this );
	}
}

export default WikiBusBuiler;

/* --- End of file --------------------------------------------------------------------------------------------------------- */