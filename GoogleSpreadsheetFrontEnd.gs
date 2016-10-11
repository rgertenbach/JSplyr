/**
 * Selects a list of Columns
 *
 * @param {A1:F10} data The table (with headers).
 * @param {"{"Customer ID", "Country"}"} fields The fields to be selected. Can be a single name or a range of names or a range reference to the sheet.
 * @return {} Gets only the required columns from the table
 * @customfunction
 */
function TABLE_SELECT(data, fields) {    
  var t = JSplyr.createTableFromMatrix(data);
  fields = Array.isArray(fields) ? matrixToList(fields) : [fields];
  return JSplyr.Table.prototype.select.apply(t, fields).toMatrix();
}


/**
 * Renames the fields of a table
 *
 * @param {A1:F10} table The table
 * @param {A12:F12} aliase An alias or a list of aliases
 * @customfunction
 */
function TABLE_RENAME(table, aliases) {
  var t = JSplyr.createTableFromMatrix(table);
  aliases = Array.isArray(aliases) ? matrixToList(aliases) : aliases;
  var fields = t.getFields();
  var asArray = aliases.map(function(alias, i) {return JSplyr.as(fields[i], alias);});
  return JSplyr.Table.prototype.select.apply(t, asArray).toMatrix();
}


/**
 * Filters based on a set of truthy or falsy values
 *
 * @param {A1:F10} data The table with headers
 * @param {E2:E10} criterion A list of values
 * @customfunction
 */
function TABLE_FILTER(data, criterion) {
  var t = JSplyr.createTableFromMatrix(data);
  return t.filter(matrixToList(criterion, false)).toMatrix();
}


/** TODO
 * Allows arrayformula of custom functions
 */
function TABLE_MUTATE(data, fun, params) {
  var t = JSplyr.createTableFromMatrix(data);
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



function TABLE_AGG(table, fields, fun) {
  var t = JSplyr.createTableFromMatrix(table);
  fields = Array.isArray(fields) ? matrixToList(fields) : [fields];
  var g = JSplyr.Table.prototype.group_by.apply(t, fields);
  return JSplyr.Table.prototype.select.apply(g, ["Country", JSplyr.fun(this[fun], "fffff", "Customer ID")]).toMatrix();
}


/**
 * Joins two tables
 *
 * @param {A1:F10} table1 The left table
 * @param {A12:F20} table2 The right table
 * @param {"left"} method The join method can be one of {"inner", "left", "right", "full", "cross"} 
 * @param {A1:C1} lkeys The keys to be used for the left side. Not required for cross joins.
 * @param {A12:C12} rkeys The keys to be used for the right side. Not required for cross joins.
 * @param {"NA"} empty The string to represent missing matches (default: ""). Only required for Outer Joins.
 * @customfunction
 */
function TABLE_JOIN(table1, table2, method, lkeys, rkeys, empty) {
  empty = empty === undefined ? "" : empty;
  var t1 = JSplyr.createTableFromMatrix(table1);
  var t2 = JSplyr.createTableFromMatrix(table2);
  return t1.join(t2, method, lkeys, rkeys, empty).toMatrix();
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



function count_unique(a) {
  var unique = [];
  a.forEach(function(element) { 
    if (unique.indexOf(element) === -1) {
      unique.push(element);
    }
  });
  return unique.length;
}
