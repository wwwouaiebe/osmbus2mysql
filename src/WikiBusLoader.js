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

	// eslint-disable-next-line no-magic-numbers
	get #maxCommentSize ( ) { return 4096; }

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

	#loadFile ( ) {
		this.#fileContent = ( fs.readFileSync ( './wiki/wiki.txt', 'utf8' ) ).split ( /\r\n|\r|\n/ );
	}

	/**
    * Coming soon...
   */

	#controlFileContent ( ) {
		let lineCounter = 0;
		let errorsFound = false;
		this.#fileContent.forEach (
			line => {
				if ( this.#maxCommentSize < line.length ) {
					lineCounter ++;
					console.error ( 'The line ' + lineCounter + 'is too long' );
					errorsFound = true;
				}
			}
		);

		return errorsFound;
	}

	/**
    * Coming soon...
   */

	async #createTableWikiBusRoute ( ) {
		console.info ( '\nCreation of table wiki_bus_route...' );

		await theMySqlDb.execSql (
			'DROP TABLE if EXISTS wiki_bus_route;'
		);

		await theMySqlDb.execSql (
			'CREATE TABLE wiki_bus_route ( ' +
                'route_pk int NOT NULL AUTO_INCREMENT, ' +
                'osm_id int, ' +
                'PRIMARY KEY (route_pk), ' +
				'wiki_ref varchar (256), ' +
				'wiki_name varchar (256), ' +
				'wiki_comment varchar (' + this.#maxCommentSize + '), ' +
				'wiki_relations varchar (' + this.#maxCommentSize + ') );'
		);
	}

	/**
    * Coming soon...
   */

	async #uploadFileContent ( ) {
		let rowFound = false;
		let wikiRef = '';
		let wikiName = '';
		let wikiComment = '';
		let wikiRelations = '';
		let lineCounter = 0;
		for ( const line of this.#fileContent ) {
			if ( '|}' === line ) { // end table
				rowFound = false;
			}
			if ( '|----' === line ) { // new row
				rowFound = true;
				lineCounter = 0;
			}
			if ( rowFound ) {
				switch ( lineCounter ) {
				case 0 :
					break;
				case 1 :
					wikiRef = line;
					break;
				case 2 :
					wikiName = line;
					break;
				case 3 :
					wikiComment = line;
					break;
				case 4 :
					wikiRelations = line;
					await theMySqlDb.execSql (
						'insert into wiki_bus_route ( wiki_ref, wikiName, wiki_comment, wiki_relations ) values (' +
						wikiRef + ', ' +
						wikiName + ', ' +
						wikiComment + ', ' +
						wikiRelations + ', ' +
						');'
					);
					break;
				default :
					console.error ( 'More than 4 lines found for a table row ' );
					process.exit ( 1 );
				}
			}
			lineCounter ++;
		}
	}

	async start ( ) {
		this.#loadFile ( );
		if ( ! this.#controlFileContent ( ) ) {
			process.exit ( 1 );
		}
		await this.#createTableWikiBusRoute ( );
		await this.#uploadFileContent ( );
	}
}

export default WikiBusLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */