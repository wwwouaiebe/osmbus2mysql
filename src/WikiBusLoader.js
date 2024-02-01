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

import theConfig from './Config.js';
import theMySqlDb from './MySqlDb.js';
import fs from 'fs';

/**
    * Coming soon...
   */

class WikiBusLoader {

	/**
     * The content of the wiki file
     * @type {String}
     */

	#fileContent;

	/**
    * The constructor
   */

	constructor ( ) {
		Object.freeze ( this );
	}

	/**
    * Coming soon...
   */

	async #createTableWikiBusRoute ( ) {

		console.info ( '\nCreation of table wiki_bus_route...' );

		this.#fileContent = fs.readFileSync ( theConfig.wiki, 'utf8' );

		await theMySqlDb.execSql (
			'DROP TABLE if EXISTS wiki_bus_route;'
		);

		await theMySqlDb.execSql (
			'CREATE TABLE wiki_bus_route ( ' +
                'route_pk int NOT NULL AUTO_INCREMENT, ' +
                'osm_id int, ' +
                'PRIMARY KEY (route_pk) );'
		);

		let relations = this.#fileContent.match ( /\d{1,}(?=}})/g );

		let relCounter = 0;
		for ( relCounter = 0; relCounter < relations.length; relCounter ++ ) {
			await theMySqlDb.execSql (
				'insert into wiki_bus_route ( osm_id ) values (' + relations [ relCounter ] + ');'
			);
		}
	}

	/**
    * Coming soon...
   */

	async start ( ) {
		await this.#createTableWikiBusRoute ( );
	}
}

export default WikiBusLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */