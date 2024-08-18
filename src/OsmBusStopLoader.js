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

import OsmLoader from './OsmLoader.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Coming soon...
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class OsmBusStopLoader extends OsmLoader {

	/**
     * The constructor
     */

	constructor ( ) {
		super ( );
		Object.freeze ( this );

		// 3601407192 province Liège
		// 3602377747 anthisnes
		this.loadData.query =
			'https://lz4.overpass-api.de/api/interpreter?data=[out:json][timeout:40];' +
			'nw(area:3601407192)' +
			'[highway=bus_stop]' +
			';out;';
		this.loadData.tableName = 'osm_bus_stop';
	}
}

export default OsmBusStopLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */