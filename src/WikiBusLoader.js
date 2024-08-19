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
import fs from 'fs';

/**
    * Coming soon...
   */

class WikiBusLoader {

	/**
    * Coming soon...
	* @type {number}
   */

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
		this.#fileContent = ( fs.readFileSync ( './wiki/oldWiki.txt', 'utf8' ) ).split ( /\r\n|\r|\n/ );
	}

	/**
    * Coming soon...
   */

	#controlFileContent ( ) {
		let lineCounter = 0;
		let fileOk = true;
		this.#fileContent.forEach (
			line => {
				if ( this.#maxCommentSize < line.length ) {
					lineCounter ++;
					console.error ( 'The line ' + lineCounter + 'is too long' );
					fileOk = false;
				}
			}
		);

		return fileOk;
	}

	/**
    * Coming soon...
   */

	async #createTableWikiBusRoute ( ) {
		console.info ( '\nCreation of table wiki_bus_routes...' );

		await theMySqlDb.execSql (
			'DROP TABLE if EXISTS wiki_bus_routes;'
		);

		await theMySqlDb.execSql (
			'CREATE TABLE wiki_bus_routes ( ' +
                'route_pk int NOT NULL AUTO_INCREMENT, ' +
                'PRIMARY KEY (route_pk), ' +
				'bus_ref varchar (256), ' +
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
		let busRef = '';
		let wikiName = '';
		let wikiComment = '';
		let wikiRelations = '';
		let rowLineCounter = 0;
		let fileLineCounter = 0;
		for ( const line of this.#fileContent ) {
			fileLineCounter ++;
			if ( '|}' === line ) { // end table
				rowFound = false;
			}
			if ( '|----' === line ) { // new row
				rowFound = true;
				rowLineCounter = 0;
			}
			if ( rowFound ) {
				switch ( rowLineCounter ) {
				case 0 :
					break;
				case 1 :
					wikiRef = line.replaceAll ( '\'', '\\\'' );
					busRef = wikiRef.split ( '|' ).reverse ( )[ 0 ].trim ( );
					break;
				case 2 :
					wikiName = line.replaceAll ( '\'', '\\\'' );
					break;
				case 3 :
					wikiComment = line.replaceAll ( '\'', '\\\'' );
					break;
				case 4 :
					wikiRelations = line.replaceAll ( '\'', '\\\'' );
					await theMySqlDb.execSql (
						'insert into wiki_bus_routes ( bus_ref, wiki_ref, wiki_name, wiki_comment, wiki_relations ) values (' +
						'\'' + busRef + '\', ' +
						'\'' + wikiRef + '\', ' +
						'\'' + wikiName + '\', ' +
						'\'' + wikiComment + '\', ' +
						'\'' + wikiRelations + '\');'
					);
					break;
				default :
					console.error ( 'More than 4 lines found for a table row at file line ' + fileLineCounter );
					process.exit ( 1 );
				}
			}
			rowLineCounter ++;
		}
	}

	/**
    * Coming soon...
   */

	async start ( ) {
		console.info ( 'Creating table wiki_bus_route' );
		this.#loadFile ( );
		if ( this.#controlFileContent ( ) ) {
			await this.#createTableWikiBusRoute ( );
			await this.#uploadFileContent ( );
		}
		else {
			console.error ( 'Errors found in the file wiki.txt' );
		}
	}
}

export default WikiBusLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */