cache = CacheService.getDocumentCache();

/**
 * Selects a list of Columns from a Table
 *
 * @param {A1:F10} table The table (with headers).
 * @param {\{"Customer ID", "Country"\}} fields The fields to be selected. This can be a single name or a range of names or a range reference to the sheet.
 * @customfunction
 */
function TABLE_SELECT(table, fields) {    
  var t = JSplyr.createTableFromMatrix(table);
  fields = arrayify(fields);
  return JSplyr.Table.prototype.select.apply(t, fields).toMatrix();
}


/**
 * Renames the fields of a table
 *
 * @param {A1:F10} table The table
 * @param {A12:F12} aliases An alias or a list of aliases, can be a single name for a one column table, a literal range or a range reference.
 * @customfunction
 */
function TABLE_RENAME(table, aliases) {
  var t = JSplyr.createTableFromMatrix(table);
  aliases = arrayify(aliases);
  var fields = t.getFields();
  var asArray = aliases.map(function(alias, i) {return JSplyr.as(fields[i], alias);});
  return JSplyr.Table.prototype.select.apply(t, asArray).toMatrix();
}


/**
 * Filters based on a set of truthy or falsy values. You can pass a column name and it will use that.
 *
 * @param {A1:F10} data The table with headers
 * @param {E2:E10} criterion A list of values
 * @param {FALSE} omit_column Whether to omit the column used to filter (default TRUE)
 * @customfunction
 */
function TABLE_FILTER(table, criterion, omit_column) {
  if(omit_column === undefined) {omit_column = true;}
  var t = JSplyr.createTableFromMatrix(table);
  var fields = t.getFields();
  
  if (JSplyr.isIn(criterion, t.getFields())) {
    fields = fields.filter(function(field) {
      return field !== this.criterion || !this.omit_column;
    }, {criterion: criterion, omit_column: omit_column});
    
    criterion = [t.getColumn(criterion)];
  }
  return JSplyr.Table.prototype.select.apply(t.filter(matrixToList(criterion, false)), fields).toMatrix();
}


/**
 * Limits a table to a certain number of rows, optionally starting at a certain row
 *
 * @param {A1:F10} table The table
 * @param {5} limit The amount of rows to show (default: 10}
 * @param {2} The rows number of rows to skip
 * @customfunction
 */
function TABLE_LIMIT(table, limit, offset) {
  var t = JSplyr.createTableFromMatrix(table);
  limit = limit || 10;
  offset = offset || 0;
  return t.limit(limit, offset).toMatrix();
}


/**
 * Adds a field that is a function applied to every row of the table. Allows arrayformula of custom functions.
 * 
 * @param {A1:F10} table The table
 * @param {"upper"} fun The name of the function. This can be a predefiend one or the name of a function you defined in the script editor.
 * @param {"NAME"} alias The name the new column should carry, if you chose an existing name it will overwrite
 * @param {"name"} params A single parameter or a range of parameter values passed on to the function. If they are the names of fields in the table those will be referenced.
 * @customfunction
 */
function TABLE_MUTATE(table, fun, alias, params) {
  var t = JSplyr.createTableFromMatrix(table);
  var fields = t.getFields();
  var func = eval(cache.get(fun)) || this[fun];

  var f = JSplyr.fun.apply(null, [func, alias].concat(params)); 
  return JSplyr.Table.prototype.select.apply(t, fields.concat(f)).toMatrix();
}


/**
 * Unions two tables
 *
 * @param {A1:F10} table1 Table 1
 * @param {A12:F20} table2 Table 2
 * @param {0} behavior Union strategy (default 0)
 * @param {"NA"} empty The fill value when a value is not available (default: "")
 * @customfunction
 */
function TABLE_UNION(table1, table2, behavior, empty) {
  behavior = behavior === undefined ? 0 : behavior;
  empty = empty === undefined ? "" : empty; 
  var t1 = JSplyr.createTableFromMatrix(table1);
  var t2 = JSplyr.createTableFromMatrix(table2);
  return t1.union(t2, behavior, empty).toMatrix();
}


/**
 * Allows to aggregate the table by a function.
 *
 * @param {A1:F10} table The table
 * @param {B1} group_fields The fields to group by, leave blank to summarize all data into one row
 * @param {"count_unique"} fun The function used to aggregate. This can be a predefined function or the name of a function one you define yourself in Apps Script. Supoprted functions are: count, count_unique, sum, mean, covar, variance and sd.
 * @param {"unique values"} alias The name to be given to the aggregated values.
 * @param {params} Parameters to the function, Can be a single value or a range, any strings that are fields in the table will pass the field, anything else will be passed as is.
 * @customfunction
 */
function TABLE_AGG(table, group_fields, fun, alias, params) {
  var t = JSplyr.createTableFromMatrix(table);
  group_fields = arrayify(group_fields).filter(function(x) {return x.length});
  params = arrayify(params);
  var g = JSplyr.Table.prototype.group_by.apply(t, group_fields);
  var func = eval(cache.get(fun)) || this[fun];
  var funObj = JSplyr.fun.apply(null, [func, alias].concat(params)); 
  return JSplyr.Table.prototype.select.apply(g, group_fields.concat(funObj)).toMatrix();
}


/**
 * Joins two tables
 *
 * @param {A1:F10} table1 The left table
 * @param {A12:F20} table2 The right table
 * @param {"left"} method The join method can be one of {"inner", "left", "right, "full", "cross"}. Default is inner (Optional)
 * @param {A1:C1} lkeys The keys to be used for the left side. Not required for cross joins.
 * @param {A12:C12} rkeys The keys to be used for the right side. Not required for cross joins.
 * @param {"NA"} empty The string to represent missing matches (default: ""). Only required for Outer Joins.
 * @customfunction
 */
function TABLE_JOIN(table1, table2, method, lkeys, rkeys, empty) {
  empty = empty === undefined ? "" : empty;
  method = method.toLowerCase();  
  
  lkeys = arrayify(lkeys);
  rkeys = arrayify(rkeys);
  
  var t1 = JSplyr.createTableFromMatrix(table1);
  var t2 = JSplyr.createTableFromMatrix(table2);
  return t1.join(t2, method, lkeys, rkeys, empty).toMatrix();
}


/**
 * Sorts a table
 *
 * @param {A1:F10} table The table
 * @param {A1:C1} fields The fields to order by
 * @param {"asc", "desc", "asc"} order The order 
 * @customfunction
 */
function TABLE_ORDER(table, fields, order) {
  var constructors = {
    "asc": JSplyr.asc,
    "desc": JSplyr.desc
  };
  
  fields = arrayify(fields) ;
  order = arrayify(order);

  order = order.map(function(x) {return x.toLowerCase();});
  var t = JSplyr.createTableFromMatrix(table);
  var orderInstructions = fields.map(function(field, i) {
    return constructors[order[i]](field)
  });
  
  return JSplyr.Table.prototype.order_by.apply(t, orderInstructions).toMatrix();
}


/**
 * Applies a JavaScript function that takes each row as an input and produces 0 or more output rows.
 * Each Row is supplied as a JavaScipt object with the column header as the key.
 *
 * @param {A1:F10} table The table
 * @param {"flatten"} The TVF to apply
 * @param {"countries"} A field or range of constants or field references to be supplied to the TVF as parameters.
 * @customfunction
 */
function TABLE_TVF(table, fun, params) {
  var func = eval(cache.get(fun)) || this[fun];
  params = arrayify(params);
  
  var t = JSplyr.createTableFromMatrix(table);
  return t.applyTVF(func, params).toMatrix();
}



// Auxillary Functions

/**
 * Converts a matrix to a single array of non empty entries
 * 
 * @param {String[][]} matrix The data with fields
 * @param {Boolean} shorten whether falsy fields should be removed (Default: true)
 * @return {String[]} The non empty field contents
 */
function matrixToList(matrix, shorten) {
  shorten = (shorten === undefined ? true : shorten);
  return matrix
      .reduce(function(x, y) {return x.concat(y);})
      .filter(function(x) {return shorten ? x : true;});
}


/**
 * Makes a 2d array a plain array or a single value into a 1-element array.
 *
 * @param {Object} x and Object or Object[][]
 * @return {Object[]} A 1d array of objects
 */
function arrayify(x) {
  return Array.isArray(x) ? matrixToList(x) : [x];
}


/**
 * Registers a JavaScript function under a given name.  
 *
 * The main purpose of this function is to define mutators, aggregators and tvfs
 * without having to go into the script editor, instead having them visible in the trix.
 *
 * @param {lower} name The alias of the function
 * @param {function(x){return x.toLowerCase();}} body The function definition
 * @return {lower} The alias of the function
 * @customfunction
 */
function SET_FUN(name, body) {
  cache.put(name, eval(body));
  return name
}


/**
 * Calls a function defined with SET_FUN.  
 *
 * Follow the name argument with any number of arguments which are passed onto the function.
 *
 * @param {"lower"} name The name of the function
 * @return {"hello"} The output of the function 
 * @customfunction
 */
function CALL_FUN(name) {
  var fun = eval(cache.get(name));
  var args = Object
      .keys(arguments)
      .filter(function(key) {return key > 0;})
      .map(function(key) {return this[key];}, arguments);

  return fun.apply(null, args);
}



// Summary functions

function count(x) {
  return x.length;
}

function count_unique(x) {
  var unique = [];
  x.forEach(function(element) { 
    if (unique.indexOf(element) === -1) {
      unique.push(element);
    }
  });
  return unique.length;
}

function sum(x) {
  return x.reduce(function(a,b) {return a+b;});
}

function mean(x) {
  return sum(x) / count(x);
}

function covar(x, y) {
  mu_x = mean(x);
  mu_y = mean(y);

  return x.map(function(x_i, i) {
    return (x_i - mu_x) * (y[i] - mu_y);
  }).reduce(function(a, b) {
    return a+b;
  }) / (count(x) - 1);
}

function variance (x) {
  return covar(x,x);
}

function sd(x) {
  return Math.sqrt(variance(x));
}

// Scalar functions
function upper(x) {
  return x.toUpperCase();
}


// Addon formalia
function onOpen(e) {
  SpreadsheetApp.getUi().createAddonMenu()
      .addItem('Activate', 'launch')
      .addToUi();
}


function onInstall(e) {
  onOpen(e);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "GASplyr.\n\n" +
    "You can launch this Add-on by clicking on: " +
    "Add-ons -> GASplyr -> Activate");
}


function launch() {
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "You can now start using GASplyr's TABLE_ functions.\n" +
    "For Help go to Add-ons -> GASplyr -> Help -> Learn more.",
    "GASplyr enabled");
}
