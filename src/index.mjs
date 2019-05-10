import xlsx from 'xlsx';


export const defaultOptions = {
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


export default class TableLoader {
    constructor(data, options=defaultOptions) {
        this.book = xlsx.read(data, {cellDates: true});
        this.options = Object.assign({}, options);
    }

    get sheets() {
        return this.book.SheetNames;
    }

    read(options={}) {
        const o = Object.assign(Object.assign({}, this.options), options);

        const sheet = this.book.Sheets[o.sheet || this.sheets[0]];
        if (sheet === undefined) {
            throw new Error(`no such sheet: ${o.sheet || this.sheets[0]}`);
        }

        let data = xlsx.utils.sheet_to_json(sheet, {
            range: o.skip_row,
            header: 1,
            defval: null,
        });

        if (data.length === 0) {
            return {columns: [], data: []};
        }

        let columns;
        if (o.use_header) {
            columns = makeColumns(data[0]);
            data = data.slice(1);
        } else {
            columns = data[0].map((_, i) => i);
        }

        return {
            columns: columns,
            data: data.map(row => columns.reduce((xs, x, i) => {
                xs[x] = row[i];

                return xs;
            }, {})),
        }
    }
}
