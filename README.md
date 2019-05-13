SQL.js TableLoader
==================

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
|name       |default|description                             |
|-----------|-------|----------------------------------------|
|skip\_row  |0      |Skip first rows                         |
|use\_header|true   |Use first row as column names           |
|sheet      |null   |Sheet name to load (if null, load first)|
