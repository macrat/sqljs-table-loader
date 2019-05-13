SQL.js TableLoader
==================

[![Build Status](https://travis-ci.org/macrat/sqljs-table-loader.svg?branch=master)](https://travis-ci.org/macrat/sqljs-table-loader)
[![Test Coverage](https://api.codeclimate.com/v1/badges/acf76e20e48a6f573e18/test_coverage)](https://codeclimate.com/github/macrat/sqljs-table-loader/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/acf76e20e48a6f573e18/maintainability)](https://codeclimate.com/github/macrat/sqljs-table-loader/maintainability)

excel/csv file loader for [SQL.js](https://github.com/kripken/sql.js).

## Usage
### in Node.js
``` shell
$ npm install macrat/sqljs-table-loader
```

``` javascript
import fs from 'fs';
import initSqlJs from 'sql.js';
import TableLoader from 'sqljs-table-loader';


const data = fs.readFileSync(__dirname + '/file.xlsx');
const loader = new TableLoader(data, {/* options (see below) */});

initSqlJs(sql => {
	const db = new sql.Database();

	console.log(loader.sheets);  // view sheet names included in excel file
	console.log(loader.read({/* override options (see below) */}));  // view table data

	loader.importInto(db, 'target_table', {/* override options (see below) */});  // create table and import data

	console.log(db.exec('SELECT * FROM target_table'));
});
```

### in browser
``` html
<script src="https://unpkg.com/xlsx"></script>  <!-- required -->
<script src="https://unpkg.com/sql.js"></script>  <!-- optional -->
<script src="https://unpkg.com/sqljs-table-loader"></script>  <!-- this library -->
<script>
var loader = new TableLoader('foo,bar\n1,hello\n2,world');

console.log(loader.sheets);
console.log(loader.read());
</script>
```

## Options
|name       |default|description                                  |
|-----------|-------|---------------------------------------------|
|skip\_row  |0      |Skip first rows                              |
|use\_header|true   |Use first row as column names                |
|sheet      |null   |Sheet name to load (if null, load first)     |
|delimiter  |','    |The delimiter for csv (only for constructor)||
