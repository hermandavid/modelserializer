'use strict';

/**
 * Simple object serialization utilites, allows parameter
 * whitelisting and also object parameter renaming.
 *
 */

const _ = require('lodash');


/**
 * Function to determine value type
 *
 * @param o {*}	  Value to recognize
 * @returns {string} Recognized value ('string', 'object', 'array', ...)
 */
const getValueType = (o) => _.isArray(o) ? 'array' : (typeof o);


/**
 * Function to check whether field is serializable
 *
 * @param value {*} - Value to check for serializable
 * @returns {boolean}
 */
const isSerializable = (value) => _.isObject(value) && !_.isArray(value) && !_.isFunction(value);


class ModelSerializer {
	/**
	 * Initializer with config. Configuration for
	 * the serializer is in the following format
	 *
	 * {
	 *   attributes: [
	 *	 {
	 *	   'field': (string)
	 *	   'alias': (string) *optional*
	 *	   'serializer': (ModelSerializer|Function) *optional*
	 *	 }
	 *   ]
	 * }
	 *
	 * @param config {Object} - Serializer configuration
	 */
	constructor(config = {}) {
		// Check configuration
		ModelSerializer.checkConfiguration(config);

		// TODO: Config currently accepts only arrtibutes
		this.attributes = config.attributes;
	}


	/**
	 * Check stored configuration
	 *
	 * @param config {Object}
	 *
	 * @throws {Error} On invalid configuration
	 */
	static checkConfiguration(config) {
		// Attributes check
		if (!_.isArray(config.attributes)) {
			throw new Error('Parameter \'attributes\' must be an array');
		}
	}


	/**
	 * Serialize particular attribute.
	 *
	 * @param obj   {*}      Original object to be serialized
	 * @param store {Object} Target object to store attributes to
	 * @param attr  {Object} Attribute configuration from ModelSerializer
	 */
	_serializeAttr(obj, store, attr) {
		// If alias is not specified, use field name instead
		const targetKey = _.isUndefined(attr.alias) ? attr.field : attr.alias;
		// Get value from original object
		let sourceValue = _.get(obj, attr.field, void(0));

		// If v is object and serializer is defined, run nested serialization
		if (attr.serializer instanceof ModelSerializer)
			sourceValue = attr.serializer.serialize(sourceValue);
		// If v is array or elemental type, process it with simple function
		else if (attr.serializer instanceof Function)
			sourceValue = attr.serializer(sourceValue, obj);

		// Store extracted value under new alias
		return _.set(store, targetKey, sourceValue);
	}


	/**
	 * Serialize presented object according to reviously stored attributes
	 *
	 * @param obj   {Object} Object to be serialized
	 * @param store {Object} Object to extend with new attributes
	 *
	 * @returns {Object} Serialized object
	 */
	serialize(obj, store = {}) {
		if (!isSerializable(obj))
			throw new Error(`ModelSerializer expects an 'object' to serialize, got '${getValueType(obj)}'`);

		// Loop each attribute and extract it from object
		_.each(this.attributes, (attr) => {
			store = this._serializeAttr(obj, store, attr);
		});

		return store;
	}
}


module.exports = ModelSerializer;
