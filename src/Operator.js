import theConfig from './Config.js';

class Operator {

	#jsonOperator = {};

	get mySqlDbName ( ) { return this.#jsonOperator.mySqlDbName; }

	get gtfsDirectory ( ) { return this.#jsonOperator.gtfsDirectory; }

	get operator ( ) { return this.#jsonOperator.operator; }

	get osmOperator ( ) { return this.#jsonOperator.osmOperator; }

	get networks ( ) { return this.#jsonOperator.networks; }

	getNetwork ( osmNetwork ) {
		return this.#jsonOperator.networks.find ( element => element.osmNetwork === osmNetwork );
	}

	async loadData ( ) {

		const jsonOperator = await import (
			'../operators/' + theConfig.operator + '.json',
			{ assert : { type : 'json' } }
		);
		this.#jsonOperator = jsonOperator.default;
	}

	constructor ( ) {
		Object.freeze ( this );
	}

}

const theOperator = new Operator ( );

export default theOperator;