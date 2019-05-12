import xlsx from 'xlsx';


export const DEFAULT_OPTIONS = {
    skip_row: 0,
    use_header: true,
    sheet: null,
}


function makeColumns(header) {
    const result = [];

    for (let x of header) {
        if (result.includes(x) || x === null || x === '') {
            if (x === null || x === '') {
                let i = 0;
                while (result.includes(i)) {
                    i++;
                }
                x = i;
            } else {
                let i = 1;
                while (result.includes(`${x}_${i}`)) {
                    i++;
                }
                x = `${x}_${i}`;
            }

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


export default class TableLoader {
    constructor(data, options={}) {
        this.book = xlsx.read(data, {cellDates: true});
        this.options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
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
