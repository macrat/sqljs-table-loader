(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('xlsx')) :
    typeof define === 'function' && define.amd ? define(['xlsx'], factory) :
    (global = global || self, global.TableLoader = factory(global.xlsx));
}(this, function (xlsx) { 'use strict';

    xlsx = xlsx && xlsx.hasOwnProperty('default') ? xlsx['default'] : xlsx;

    function makeColumns(header) {
        const result = [];

        for (let x of header) {
            if (result.includes(x) || x === null || x === '') {
                const gen = (x === null || x === '') ? (i => i) : (i => `${x}_${i + 1}`);

                let i = 0;
                while (result.includes(gen(i))) {
                    i++;
                }
                x = gen(i);

            }
            result.push(x);
        }

        return result;
    }


    function encodeSQLident(identifier) {
        return '"' + `${identifier}`.replace('"', '""') + '"';
    }


    function encodeSQLvalue(value) {
        if (value instanceof Date) {
            return `${value.getFullYear()}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')} ${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}:${value.getSeconds().toString().padStart(2, '0')}.${value.getMilliseconds()}`;
        } else {
            return value;
        }
    }


    class TableLoader {
        constructor(data, options={}) {
            this.options = Object.assign(Object.assign({}, TableLoader.DEFAULT_OPTIONS), options);

            this.book = xlsx.read(data, {
                cellDates: true,
                type: typeof data === 'string' ? 'string' : undefined,
                delimiter: this.options.delimiter,
                codepage: 65001,
            });
        }

        get sheets() {
            return this.book.SheetNames;
        }

        read(options={}) {
            const o = Object.assign(Object.assign({}, this.options), options);

            const sheet_name = o.sheet || this.sheets[0];
            const sheet = this.book.Sheets[sheet_name];
            if (sheet === undefined) {
                throw new Error(`no such sheet: ${sheet_name}`);
            }

            let values = xlsx.utils.sheet_to_json(sheet, {
                range: o.skip_row,
                header: 1,
                defval: null,
            });

            if (values.length === 0) {
                return {columns: [], values: []};
            }

            let columns = [];
            if (o.use_header) {
                columns = makeColumns(values[0]);
                values = values.slice(1);
            } else {
                columns = values[0].map((_, i) => i);
            }

            return {
                columns: columns,
                values: values.map(row => columns.reduce((xs, x, i) => {
                    xs[x] = row[i];

                    return xs;
                }, {})),
            }
        }

        importInto(db, name, options={}) {
            db.run('BEGIN');
            try {
                const {columns, values} = this.read(options);

                db.run(`DROP TABLE IF EXISTS ${encodeSQLident(name)}`);
                db.run(`CREATE TABLE ${encodeSQLident(name)} (${columns.map(encodeSQLident)})`);

                const stmt = db.prepare(`INSERT INTO ${encodeSQLident(name)} VALUES (${columns.map(() => '?')})`);
                for (const row of values) {
                    stmt.run(columns.map(key => encodeSQLvalue(row[key])));
                }
                stmt.free();

                db.run('COMMIT');
            } catch(err) {
                db.run('ROLLBACK');
                throw err;
            }
        }
    }


    TableLoader.DEFAULT_OPTIONS = {
        skip_row: 0,
        use_header: true,
        sheet: null,
        delimiter: ',',
    };

    return TableLoader;

}));
