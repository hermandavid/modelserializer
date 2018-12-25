'use strict';

const assert = require('assert');
const ModelSerializer = require('../src/modelserializer');


describe('ModelSerializer', () => {

	describe('constructor', () => {
		it('Should be instanciable', () => {
			assert.doesNotThrow(
				() => new ModelSerializer({
					attributes: [
						{ field: 'a' },
						{ field: 'b' }
					]
				}),
				Error,
				'Cannot instanciate ModelSerializer'
			);
		});

		it('Should not be instanciable without valid config', () => {
			assert.throws(
				() => new ModelSerializer(), Error, 'ModelSerializer is instanciable without valid config'
			);
		});
	});


	describe('serialize', () => {
		beforeEach(() => {
			this.serializer = new ModelSerializer({
				attributes: [
					{ field: 'a' },
					{ field: 'b' }
				]
			});
		});

		it ('Should serialize only "Object" type', () => {
			assert.throws(() => this.serializer.serialize(1) , Error, 'Number should not be serializable');
			assert.throws(() => this.serializer.serialize('X') , Error, 'String should not be serializable');
			assert.throws(() => this.serializer.serialize(() => void(0)) , Error, 'Function should not be serializable');

			assert.doesNotThrow(() => this.serializer.serialize({ a: { b: 5} }) , Error, 'Object should be serializable');
		});

		it('Should serialize basic object', () => {
			assert.deepEqual(
				this.serializer.serialize({ a: 1, b: 2, c: 3}),
				{ a: 1, b: 2 },
				'ModelSerializer fails to serialize plain object'
			);
		});

		it('Should serialize nested object', () => {
			assert.deepEqual(
				this.serializer.serialize({ a: 1, b: { a: 1, b: 2 }}),
				{ a: 1, b: { a: 1, b: 2 } },
				'ModelSerializer fails to serialize nested object'
			);
		});
	});


	describe('serialize - nested fields', () => {
		beforeEach(() => {
			this.serializer = new ModelSerializer({
				attributes: [
					{ field: 'nested.a' },
					{ field: 'nested.b' }
				]
			});
		});

		it('Should serialize nested object', () => {
			assert.deepEqual(
				this.serializer.serialize({ nested: { a: 1, b: 2, c: 3} }),
				{ nested: { a: 1, b: 2 } },
				'ModelSerializer fails to pick nested fields'
			);
		});
	});


	describe('serialize - aliases', () => {
		it('Should remap plain fields', () => {
			const serializer = new ModelSerializer({
				attributes: [
					{ field: 'a', alias: 'x' },
					{ field: 'b', alias: 'y' }
				]
			});

			assert.deepEqual(
				serializer.serialize({ a: 1, b: 2, c: 3}),
				{ x: 1, y: 2 },
				'ModelSerializer fails to use aliases'
			);
		});

		it('Should remap nested fields', () => {
			const serializer = new ModelSerializer({
				attributes: [
					{ field: 'a', alias: 'nested.x' },
					{ field: 'b', alias: 'nested.y' }
				]
			});

			assert.deepEqual(
				serializer.serialize({ a: 1, b: 2, c: 3}),
				{ nested: { x: 1, y: 2 } },
				'ModelSerializer fails to alias into nested object'
			);
		});
	});


	describe('serialize - custom transformator', () => {
		beforeEach(() => {
			this.serializer = new ModelSerializer({
				attributes: [
					{ field: 'a' },
					{ field: 'b', serializer: (val) => `XX${val}XX` }
				]
			});
		});

		it('Should apply custom function to value', () => {
			assert.deepEqual(
				this.serializer.serialize({ a: 1, b: 2, c: 3}),
				{ a: 1, b: 'XX2XX' },
				'ModelSerializer fails to apply custom transformator'
			);
		});
	});


	describe('serialize - nested ModelSerializer', () => {
		beforeEach(() => {
			const nestedSerializer = new ModelSerializer({
				attributes: [
					{ field: 'a' },
					{ field: 'b' }
				]
			});

			this.serializer = new ModelSerializer({
				attributes: [
					{ field: 'nested', serializer: nestedSerializer }
				]
			});
		});

		it('Should use nested serializer', () => {
			assert.deepEqual(
				this.serializer.serialize({ nested: { a: 1, b: 2, c: 3}}),
				{ nested: { a: 1, b: 2 }},
				'ModelSerializer fails to serialize plain object'
			);
		});
	});


	describe('serialize - complex', () => {
		beforeEach(() => {
			const serializer = new ModelSerializer({
				attributes: [
					{ field: 'nested.a', alias: 'x' },
					{ field: 'nested.b', alias: 'y', serializer: (val) => `XX${val}XX` },
					{ field: 'nested.c', alias: 'nested.x', serializer: (val, obj) => `${obj.nested.a} - ${val}`}
				]
			});

			// Store result to test different parts in tests
			this.serialized = serializer.serialize({
				nested: {
					a: 1, b: 2, c: 3
				}
			});
		});

		it('Should un-nest fields', () => {
			assert.equal(this.serialized.x, 1);
		});

		it('Should un-nest fields and apply transformators', () => {
			assert.equal(this.serialized.y, 'XX2XX');
		});

		it('Should apply alias and transformator with access to origin', () => {
			assert.equal(this.serialized.nested.x, '1 - 3');
		});
	});
});
