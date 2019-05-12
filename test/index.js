import fs from 'fs';
import initSqlJs from 'sql.js';

import assert from 'power-assert';

import Loader from '../src';


describe('Loader', () => {
	let sql, db;
	before(async () => {
		sql = await initSqlJs();
	});
	beforeEach(() => {
		db = new sql.Database();
	});

	describe('xlsx', () => {
		let loader;

		beforeEach(() => {
			loader = new Loader(fs.readFileSync(__dirname + '/test.xlsx'));
		});

		it('#sheets', () => {
			assert.deepStrictEqual(loader.sheets, [
				'alpha',
				'beta',
				'empty',
			]);
		});

		describe('#read', () => {
			it('without options', () => {
				assert.deepStrictEqual(loader.read(), {
					columns: ['hoge', 'fuga'],
					values: [
						{hoge: 1, fuga: 'a'},
						{hoge: 2, fuga: 'b'},
						{hoge: 3, fuga: 'c'},
					],
				});
			});

			it('not use header', () => {
				assert.deepStrictEqual(loader.read({use_header: false}), {
					columns: [0, 1],
					values: [
						{0: 'hoge', 1: 'fuga'},
						{0: 1, 1: 'a'},
						{0: 2, 1: 'b'},
						{0: 3, 1: 'c'},
					],
				});
			});

			it('skip rows', () => {
				assert.deepStrictEqual(loader.read({skip_row: 1}), {
					columns: [1, 'a'],
					values: [
						{1: 2, 'a': 'b'},
						{1: 3, 'a': 'c'},
					],
				});
			});

			it('specific sheet', () => {
				assert.deepStrictEqual(loader.read({sheet: 'beta'}), {
					columns: ['this is title', 0, 1, 2],
					values: [
						{'this is title': null, '0': null, '1': null, '2': null},
						{'this is title': 'hoge', '0': 'fuga', '1': 'foo', '2': 'hoge'},
						{'this is title': new Date(2019, 0, 1), 0: 1, 1: 'hello', 2: 1024},
						{'this is title': new Date(2019, 0, 31), 0: 2, 1: 'world', 2: 2048},
						{'this is title': new Date(2019, 2, 1), 0: 3, 1: 'fizz', 2: 4096},
						{'this is title': new Date(2019, 11, 10), 0: 4, 1: 'buzz', 2: 8192},
					],
				});
			});

			it('no exists sheet', () => {
				assert.throws(() => loader.read({sheet: 'nobody'}), /^Error: no such sheet: nobody$/);
			});

			it('specific sheet / skip row', () => {
				assert.deepStrictEqual(loader.read({sheet: 'beta', skip_row: 2}), {
					columns: ['hoge', 'fuga', 'foo', 'hoge_1'],
					values: [
						{hoge: new Date(2019, 0, 1), fuga: 1, foo: 'hello', hoge_1: 1024},
						{hoge: new Date(2019, 0, 31), fuga: 2, foo: 'world', hoge_1: 2048},
						{hoge: new Date(2019, 2, 1), fuga: 3, foo: 'fizz', hoge_1: 4096},
						{hoge: new Date(2019, 11, 10), fuga: 4, foo: 'buzz', hoge_1: 8192},
					],
				});
			});

			it('empty', () => {
				assert.deepStrictEqual(loader.read({sheet: 'empty'}), {
					columns: [],
					values: [],
				});
			});
		});

		describe('#importInto', () => {
			it('simple', () => {
				loader.importInto(db, 'xlsx_simple');

				assert.deepStrictEqual(db.exec('SELECT * FROM xlsx_simple'), [{
					columns: ['hoge', 'fuga'],
					values: [
						[1, 'a'],
						[2, 'b'],
						[3, 'c'],
					],
				}]);
			});

			it('need escape', () => {
				loader.importInto(db, 'xlsx_need escape', {sheet: 'beta'});

				assert.deepStrictEqual(db.exec('SELECT * FROM [xlsx_need escape]'), [{
					columns: ['this is title', '0', '1', '2'],
					values: [
						[null, null, null, null],
						['hoge', 'fuga', 'foo', 'hoge'],
						['2019-01-01 00:00:00.0', 1, 'hello', 1024],
						['2019-01-31 00:00:00.0', 2, 'world', 2048],
						['2019-03-01 00:00:00.0', 3, 'fizz', 4096],
						['2019-12-10 00:00:00.0', 4, 'buzz', 8192],
					],
				}]);
			});

			it('override', () => {
				assert.deepStrictEqual(db.exec('CREATE TABLE xlsx_override (x); INSERT INTO xlsx_override VALUES ("foobar"); SELECT * FROM xlsx_override'), [{
					columns: ['x'],
					values: [
						['foobar'],
					],
				}]);

				loader.importInto(db, 'xlsx_override');

				assert.deepStrictEqual(db.exec('SELECT * FROM xlsx_override'), [{
					columns: ['hoge', 'fuga'],
					values: [
						[1, 'a'],
						[2, 'b'],
						[3, 'c'],
					],
				}]);
			});

			it('rollback', () => {
				assert.deepStrictEqual(db.exec('CREATE TABLE xlsx_error (x); INSERT INTO xlsx_error VALUES ("foobar"); SELECT * FROM xlsx_error'), [{
					columns: ['x'],
					values: [
						['foobar'],
					],
				}]);

				db.prepare = () => {
					throw new Error("test error");
				};

				assert.throws(() => loader.importInto(db, 'xlsx_error'), /^Error: test error$/);

				assert.deepStrictEqual(db.exec('SELECT * FROM xlsx_error'), [{
					columns: ['x'],
					values: [
						['foobar'],
					],
				}]);
			});
		});
	});

	describe('csv', () => {
		let loader;

		beforeEach(() => {
			loader = new Loader(fs.readFileSync(__dirname + '/test.csv'));
		});

		it('#sheets', () => {
			assert.deepStrictEqual(loader.sheets, [
				'Sheet1',
			]);
		});

		it('#read', () => {
			assert.deepStrictEqual(loader.read(), {
				columns: ['foo bar', 'hoge', 'fuga', 'x', 'x_1', 'x_2'],
				values: [
					{'foo bar': 1, hoge: 'hello', fuga: 'w o r l d', x: 'a', x_1: 'b', x_2: 'c'},
					{'foo bar': 2, hoge: 'fizz', fuga: 'buzz', x: 'd', x_1: 'e', x_2: 'f'},
				],
			});
		});

		it('#importInto', () => {
			loader.importInto(db, 'csv_tea');

			assert.deepStrictEqual(db.exec('SELECT * FROM csv_tea'), [{
				columns: ['foo bar', 'hoge', 'fuga', 'x', 'x_1', 'x_2'],
				values: [
					[1, 'hello', 'w o r l d', 'a', 'b', 'c'],
					[2, 'fizz', 'buzz', 'd', 'e', 'f'],
				],
			}]);
		});
	});

	describe('default options', () => {
		it('default only', () => {
			const loader = new Loader(fs.readFileSync(__dirname + '/test.xlsx'), {
				sheet: 'beta',
				skip_row: 2,
			});

			assert.deepStrictEqual(loader.read(), {
				columns: ['hoge', 'fuga', 'foo', 'hoge_1'],
				values: [
					{hoge: new Date(2019, 0, 1), fuga: 1, foo: 'hello', hoge_1: 1024},
					{hoge: new Date(2019, 0, 31), fuga: 2, foo: 'world', hoge_1: 2048},
					{hoge: new Date(2019, 2, 1), fuga: 3, foo: 'fizz', hoge_1: 4096},
					{hoge: new Date(2019, 11, 10), fuga: 4, foo: 'buzz', hoge_1: 8192},
				],
			});
		});
	});
});
