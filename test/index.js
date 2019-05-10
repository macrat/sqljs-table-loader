import fs from 'fs';

import assert from 'power-assert';

import Loader from '../src';


describe('Loader', () => {
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
                data: [
                    {hoge: 1, fuga: 'a'},
                    {hoge: 2, fuga: 'b'},
                    {hoge: 3, fuga: 'c'},
                ],
            });
        });

        it('not use header', () => {
            assert.deepStrictEqual(loader.read({use_header: false}), {
                columns: [0, 1],
                data: [
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
                data: [
                    {1: 2, 'a': 'b'},
                    {1: 3, 'a': 'c'},
                ],
            });
        });

        it('specific sheet', () => {
            const data = loader.read({sheet: 'beta'});

            console.log(data);
            assert.deepStrictEqual(data, {
                columns: ['this is title', 0, 1, 2],
                data: [
                    {'this is title': null, '0': null, '1': null, '2': null},
                    {'this is title': 'hoge', '0': 'fuga', '1': 'foo', '2': 'hoge'},
                    {'this is title': new Date(2019, 1, 1), 0: 1, 1: 'hello', 2: 1024},
                    {'this is title': new Date(2019, 1, 31), 0: 2, 1: 'world', 2: 2048},
                    {'this is title': new Date(2019, 3, 1), 0: 3, 1: 'fizz', 2: 4096},
                    {'this is title': new Date(2019, 12, 31), 0: 4, 1: 'buzz', 2: 8192},
                ],
            });
        });

        it('specific sheet / skip row', () => {
            const data = loader.read({sheet: 'beta', skip_row: 2});

            assert.deepStrictEqual(data, {
                columns: ['hoge', 'fuga', 'foo', 'hoge_1'],
                data: [
                    {hoge: new Date(2019, 1, 1), fuga: 1, foo: 'hello', hoge_1: 1024},
                    {hoge: new Date(2019, 1, 31), fuga: 2, foo: 'world', hoge_1: 2048},
                    {hoge: new Date(2019, 3, 1), fuga: 3, foo: 'fizz', hoge_1: 4096},
                    {hoge: new Date(2019, 12, 31), fuga: 4, foo: 'buzz', hoge_1: 8192},
                ],
            });
        });
    });
});
