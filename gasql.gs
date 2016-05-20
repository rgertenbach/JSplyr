/**
 * Creates a table.
 *
 * The table has a table attribute with is an object with field names as keys.
 * The values are arrays containing the rows of each column.
 *
 * @param {Object} table The object that will be the table propertt.
 * @returns {Object} The table with methods to work with instances of itself.
 */
function createTable(table) {

  /**
   * Extracts element out of an Object into an array
   *
   * @param {Object} object The object to be parsed
   * @return {Array} The Values of the object in an array.
   */
  function objectToArray(object) {
    var output = [];
    return Object.keys(object).map(function(key) {return object[key];});
  }

  /**
   * Repeats a value n times
   *
   * @param {Object} x The object to be repeated.
   * @param {number} n The number of repetitions.
   * @return {Array} An array of size n filled with copies of x.
   */
  function repeat(x, n) {
    if (!(typeof(n) === "number" && n >= 0 && n % 1 === 0)) {
      throw "n must be an integer greater or than equal to 0"
    }
    var output = [];
    while (n > 0) {
      output.push(x);
      n--;
    }
    return output;
  }

  /**
   * Recursively checks if two arrays are identical
   */
  function equalArrays(a1, a2) {
    if (!(Array.isArray(a1) && Array.isArray(a2))) {return false;}
    if (a1.length !== a2.length) {return false;}
    for (var i in a1) {
      if (Array.isArray(a1[i])) {
        if (!equalArrays(a1[i], a2[i])) {return false;}
      } else {
        if (a1[i] !== a2[i]) {return false;}
      }
    }
    return true;
  }

  /**
   * Whether or not x is in array y
   *
   * @param {Object} x The object to be looked for
   * @param {Array} y The array to be searched
   * @return {logical} Whether x could be found in y.
   */
  function isIn(x, y) {
    return y.indexOf(x) !== -1;
  }

  /**
   * Returns unique entries from an array.
   *
   * @param {Array} a The array to be deduped.
   * @return {Array} An array with unique values.
   */
  function unique(a) {
    if(!Array.isArray(a)) {throw "Argument must be an array!";}
    var output = [];
    a.map(function(e) {if (!isIn(e, output)) {output.push(e);}});
    return output;
  }

  /**
   * Creates an object with field names as keys and empty arrays as values.
   *
   * @param {Array} fields An array of field names.
   * @return {Object} The object with the field names as keys and empty arrays.
   */
  function createOutput(fields) {
    if(!Array.isArray(fields)) {throw "Argument must be an array!";}
    var output = {};
    fields.map(function (field) {
      if (typeof(field) == "string") {
        output[field] = [];
      } else {
        output[field.alias] = [];
      }});
    return output;
  }

  /**
   * Creates a two dimensional array from the table.
   *
   * The table part gets returned as an array of equal length arrays.
   * Each array is a row and each element in the sub arrays a column within it.
   * The keys of the table object for into the first row.
   *
   * @returns {Array} An array of arrays containing the table.
   */
  function toMatrix() {
    var output = [[]];
    var fields = getFields();
    fields.map(function(field) {output[0].push(field);})
    for (var row in table[fields[0]]) {
      output.push(fields.map(function(field) {return table[field][row]}));
    }
    return output;
  }

  /**
   * An alias object that can be used instead of field names in selections.
   *
   * @param {Object} field The field of the table to be used.
   * @param {string} alias The Name the field will have in the selection.
   *
   * @return {Object} Returns a field-alias object.
   */
  function As(field, alias) {
    return {field: field, alias: alias};
  }

  /**
   * Allows for scalar functions within records of a table.
   * Note that while this is a scalar application of a function it is possible
   * to use it as an aggregation when using group_by().
   *
   * @param {function} fun The function to be evaluated per row.
   * @param {string} alias The alias of the function value.
   * @param {...} ... Any arguments passed to the function.
   */
  function Fun(fun, alias) {
    if (typeof(fun) !== "function") {
      throw "First argument must be a function!";
    }

    var args = objectToArray(arguments);
    args.splice(0,2);
    return {fun: fun, alias: alias, args: args};
  }

  /**
   * Applies a Fun object to a table
   *
   * @param {Fun} fun A Fun object.
   * @return {Array} Returns an array of the results, one element per row.
   */
  function applyScalar(fun) {
    if (!(fun.hasOwnProperty("fun") && fun.hasOwnProperty("alias"))) {
      throw "Must provide a Fun Object!";
    }

    var fields = getFields();
    var r = rows();

    var args = fun.args.map(function(arg) {
      if (!isIn(arg, fields)) {
        return repeat(arg, r);
      } else {
        return table[arg];
      }
    });
    var output = [];
    var currentArgs;
    for (var row = 0; row < r; row++) {
      currentArgs = args.map(function(arg) {return arg[row];});
      output.push(fun.fun.apply(this, currentArgs));
    }
    return output;
  }

  /**
   * Field names of the Table
   *
   * @return {Array} An array of the field names of the table.
   */
  function getFields() {
    return Object.keys(table);
  }

  /**
   * The i-th row of a table
   *
   * @param {Number} i The row number to be retrieved (0-based).
   * @return {Array} An array of the values in the i-th row.
   */
  function getRow(i) {
    if (!(i % 1 !== 0 && i >= 0)) {
      throw "row must be an integer greatern than or equal to 0";
    }

    var fields = getFields();
    return fields.map(function(field) {return table[field][i];});
  }

  /**
   * The number of columns in the table
   *
   * @return {number} The number of columns in the table
   */
  function cols() {
    return getFields().length;
  }

  /**
   * The number of rows in the table
   *
   * @return {number} The number of rows in the table.
   */
  function rows() {
    return table[getFields()[0]].length;
  }

  /**
   * Whether rows fulfil a criterion or not
   *
   * The function accepts either a string of a comparison such as == or > or
   * a function. Due to the way JS evaluates truthiness any return value is ok.
   *
   * @param {Object} lop The left operand. Can be a field name or a literal.
   * @param {Object} op The operand.
   * @param {Object} rop The right operand. Can be a field name or a literal.
   * @return {Array} An array of booleans or values that will be used as such.
   */
  function is(lop, op, rop) {
    var operations = {
      "==":  function(l, r) {return l ==  r;},
      "===": function(l, r) {return l === r;},
      ">":   function(l, r) {return l >   r;},
      "<":   function(l, r) {return l <   r;},
      ">=":  function(l, r) {return l >=  r;},
      "<=":  function(l, r) {return l <=  r;},
      "!=":  function(l, r) {return l !=  r;},
      "!==": function(l, r) {return l !== r;}
    };

    if (typeof(op) === "function") {
      operations[op] = op;
    }

    var fields = getFields();
    var lopf;
    var ropf;
    var output = [];
    if (isIn(lop, fields)) {
      lopf = table[lop];
    }
    if (isIn(rop, fields)) {
      ropf = table[rop]
    }
    if (lopf === undefined && ropf === undefined) {
      return repeat(operations[op](lop, rop), rows());
    }
    if (lopf === undefined) {
      lopf = repeat(lop, rows());
    } else {
      lopf = table[lop];
    }
    if (ropf === undefined) {
      ropf = repeat(rop, rows());
    } else {
      ropf = table[rop];
    }
    for (var row in lopf) {
      output.push(operations[op](lopf[row], ropf[row]));
    }
    return output;
  }

  /**
   * Logical and applied to a list of arrays.
   *
   * k Arrays of length n will return an array of length n where each row is the
   * logical and of row i of n for each column j of k.
   *
   * @param {Array} ... 0 or more arrays.
   * @return {Array} The resulting vector of true/false values.
   */
  function and() {
    var arguments = objectToArray(arguments);
    var output = [];

    for (var row in arguments[0]) {
      output.push(arguments.reduce(function(a,b) {return a[row] && b[row];}));
    }
    return output;
  }

  /**
   * Logical or applied to a list of arrays.
   *
   * k Arrays of length n will return an array of length n where each row is the
   * logical or of row i of n for each column j of k.
   *
   * @param {Array} ... 0 or more arrays.
   * @return {Array} The resulting vector of true/false values.
   */
  function or() {
    var arguments = objectToArray(arguments);
    var output = [];

    for (var row in arguments[0]) {
      output.push(arguments.reduce(function(a,b) {return a[row] || b[row];}));
    }
    return output;
  }

  /**
   * The negation of an array of boolean values.
   *
   * @param {Array} x The array to be negated.
   * @return {Array} an array of the negated values of x.
   */
  function not(x) {
    return x.map(function(x) {return !x;});
  }

  /**
   * Selects a list of fields from the existing table.
   *
   * Takes either field names, As Aliases or Fun Functions.
   *
   * @param {...} ... A list of arguments.
   * @return {createTable} An instance of a table with the selected fields.
   */
  function select() {
    var fields = objectToArray(arguments);

    //verify fields exist
    var tableFields = getFields();
    fields.map(function(field) {
      if (isIn(field, ["object", "string"])) {
        throw "Wrong argument type";
      }

      if (typeof(field) === "string") {
        if (!isIn(field, tableFields) && field !== "*") {
          throw field + "is not a field of this table";
        }
      }
    });

    var output = {};
    fields.map(function (field) {
      if (typeof(field) == "string") {
      output[field] = table[field];
    } else if (field.hasOwnProperty("fun")) {
      output[field.alias] = applyScalar(field);
    } else {
      output[field.alias] = table[field.field];
    }
    });
    return createTable(output);
  }

  /**
   * Filters a table's rows.
   *
   * @param {Array} criterion An array of boolean values, one for each row.
   * @return {createTable} The resulting filtered table.
   */
  function filter(criterion) {
    var fields = getFields();
    var output = {};

    fields.map(function(field) {output[field] = [];});

    for (var row in criterion) {
      if (criterion[row]) {
        fields.map(function(field) {output[field].push(table[field][row]);});
      }
    }
    return createTable(output);
  }

  /**
   * Creates the union all of to tables.
   *
   * Behavior of behavior:
   *  - undefined or 0 uses only common columns
   *  - 1 uses only left columns
   *  - 2 uses right columns
   *  - 3 uses all columns
   *
   * @param {createTable} t The table to be unioned with.
   * @param {number} behavior Which columns are to be selected.
   * @param {Object} empty The value missing columns shall be filled with.
   * @return {createTable} The union of two tables.
   */
  function union(t, behavior, empty) {
    behavior = behavior || 0;

    var lfields = getFields();
    var rfields = t.getFields();
    var fields;

    if (behavior == 0) {
      fields = lfields.filter(function(lField) {
        return isIn(lField, rfields);
      })
    }
    if (behavior == 1) {fields = lfields;}
    if (behavior == 2) {fields = rfields;}
    if (behavior == 3) {fields = unique(lfields.concat(rfields));}

    var output = createOutput(fields);

    // Check if any of the fields of the left table are in the final table
    // To see if missing values need to be filled up
    function fillUpNeeded(unionPartFields) {
      return unionPartFields.map(function(field) {
        return isIn(field, fields);}).reduce(function(a,b) {
          return a || b;});
    }

    function appendRows(source, field, unionPartfields, needsFillUp) {
      if (isIn(field, unionPartfields)) {
        output[field] = output[field].concat(source[field]);
      } else if (needsFillUp) {
        output[field] = output[field].concat(repeat(empty, rows()));
      }
    }

    var lfillupNeeded = fillUpNeeded(lfields);
    var rfillupNeeded = fillUpNeeded(rfields);

    fields.map(function(field) {
      appendRows(table, field, lfields, lfillupNeeded)
      appendRows(t.table, field, rfields, rfillupNeeded)
    });
    return createTable(output);
  }

  /**
   * Groups a table by a list of field names by nesting non grouping fields.
   *
   * The non grouping fields will be nested in arrays.
   *
   * @param {String} ... The field names to be grouped by.
   * @return {createTable} The nested table.
   */
  function group_by() {
    var groups = objectToArray(arguments);
    fields = getFields();

    groups.map(function(arg) {
      if (!isIn(arg, fields)) {throw arg + "not found!";}
    })

    var fields = getFields();
    var currentRow;
    var nested = createOutput(fields);

    function getRow(table, row, target) {
      var fields = Object.keys(table);
      fields = fields.filter(function(f) {return isIn(f, target);});
      return fields.map(function(field) {
        return table[field][row];
      });
    }

    function findMatchingRow(currentRow) {
      for (var oRow in nested[fields[0]]) {
        var checkRow = getRow(nested, oRow, groups);
        if (equalArrays(currentRow, checkRow)) {
          return oRow;
        }
      }
      return -1
    }

    function appendRow(row) {
      fields.map(function(field) {
        var cell = table[field][iRow];
        if (found !== -1 && !isIn(field, groups)) {
          nested[field][found].push(cell);
        } else if (found === -1) {
          nested[field].push(isIn(field, groups) ? cell : [cell]);
        }
      });
    }

    // Create a nested version of the table
    for (var iRow in table[fields[0]]) {
      currentRow = getRow(table, iRow, groups);
      var found = findMatchingRow(currentRow);
      appendRow(found);
    }
    return createTable(nested);
  }

  /**
   * flatten unnests an array.
   *
   * @param {string} field The nested field to be unnested.
   * @return {createTable} The flattened table.
   */
  function flatten(field) {
    var fields = getFields();

    if (!isIn(field, fields)) {throw field + " is not a valid field name!";}
    var column = table[field];
    if(!Array.isArray(column[0])) {throw field + " is not a nested field!";}
    var output = createOutput(fields);

    function appendRow(row, element) {
      fields.map(function(f) {
        if (f === field) {
          output[f].push(column[row][element]);
        } else {
          output[f].push(table[f][row]);
        }
      })
    }

    for (var row in column) {
      for (var element in column[row]) {
        appendRow(row, element);
      }
    }
    return createTable(output);
  }

  /**
   * Joins two tables with one another
   *
   * Legal join strategies are:
   *  - "inner": Only rows that have matches are used.
   *  - "left": Inner join + unmatches left rows.
   *  - "right" Inner join + unmatched right rows.
   *  - "outer": Inner join and unmatched left and right rows.
   *  - "cross": cross product of every row of the two tables.
   *             If a cross join is used no keys are necessary.
   *
   * @param {table} right The right side of the join
   * @param {string} method The join strategy, see detailed description
   * @param {Object} lkeys Array containing the names of the left table's keys,
                     or a single key string.
   * @param {Object} rkeys Array containing the names of the right table's keys,
                     or a single key string.
   * @param {Object} empty The value to fill fields with that have no match.
   * @return {createTable} a Table that is the join result of the two tables.
   */
  function join(right, method, lKeys, rKeys, empty) {
    var allowed_methods = ["inner", "left", "right", "outer", "cross"]
    method = method || "inner";

    if (!right.hasOwnProperty("table")) {throw "First argument must be table!";}
    if (!isIn(method, allowed_methods)) {
      throw "Second argument must be one of" + allowed_methods
    }
    if (typeof(lKeys) === "string") {lKeys = [lKeys];}
    if (typeof(rKeys) === "string") {rKeys = [rKeys];}
    if (method !== "cross" && lKeys.length !== rKeys.length) {
      throw "Join key lists must have same length!";
    }

    var lFields = getFields();
    var rFields = right.getFields();

    var oFields = lFields.map(function(f) {return "l." + f;}).concat(
                  rFields.map(function(f) {return "r." + f;}));

    function methodIn(methods) {
      return isIn(method, methods);
    }

    function fillFields(table, fields, row, prefix) {
      prefix = prefix || "";
      fields.map(function(field) {
        output[prefix + field].push(table[field][row]);
      });
    }

    function matchTables(l, r, lKeys, rKeys) {
      var matches = [];
      var lFields = l.getFields();
      var rFields = r.getFields();

      function rowsMatch() {
        for (var key in lKeys) {
          if (l.table[lKeys[key]][lRow] !== r.table[rKeys[key]][rRow]) {
            return false;
          }
        }
        return true;
      }

      for (var lRow in l.table[lFields[0]]) {
        matches.push([]);
        for (var rRow in r.table[rKeys[0]]) {
          if (rowsMatch()) {
            matches[lRow].push(rRow);
          }
        }
      }
      return matches;
    }

    function getRow(table, row, fields) {
      var fields = fields || table.getFields();
      var output = fields.map(function(field) {
        return table.table[field][row];
      });
      return output;
    }

    function constructJoin(l, r, matches, nonMatches, reverse) {
      nonMatches = nonMatches || false;
      reverse = reverse || false;
      var output  = createOutput(oFields);
      var lFields = l.getFields();
      var rFields = r.getFields();
      if (reverse) {
        oFields = lFields.map(function(f) {return "r." + f;}).concat(
          rFields.map(function(f) {return "l." + f;})
        );
      }

      function pushRow() {
        for (var field in oFields) {
          output[oFields[field]].push(leftData.concat(rightData)[field]);
        }
      }

      for (var lRow in matches) {
        var leftData = getRow(l, lRow, lFields);
        if (matches[lRow].length > 0 && !nonMatches) {
          for (var match in matches[lRow]) {
            var rightData = getRow(r, matches[lRow][match], rFields);
            pushRow()
          }
        } else if(matches[lRow].length === 0 && nonMatches) {
          var rightData = repeat(empty, oFields.length);
          pushRow();
        }
      }
      return output;
    }

    if (methodIn(["inner", "left", "outer"])) {
      var lMatches = matchTables(this, right, lKeys, rKeys);
    }
    if (methodIn(["right", "outer"])) {
      var rMatches = matchTables(right, this, rKeys, lKeys);
    }
    if (methodIn(["cross"])) {
      var lMatches = [];
      for (var lRow = 0; lRow < rows(); lRow++) {
        lMatches.push([]);
        for (var rRow = 0; rRow < right.rows(); rRow++) {
          lMatches[lRow].push(rRow);
        }
      }
    }

    // Inner matches
    if (!methodIn(["right"])) {
      var results = createTable(constructJoin(this, right, lMatches));
    } else {
      results = createTable(constructJoin(right, this, rMatches, false, true));
    }

    if (methodIn(["left", "outer", "cross"])) {
      var b = createTable(constructJoin(this, right, lMatches, true));
      results = results.union(b);
    }

    if (methodIn(["right", "outer"])) {
      var b = createTable(constructJoin(right, this, rMatches, true, true));
      results = results.union(b);
    }
    return results;
  }
  /**
   * Limits the output starting at a given offset or the first row.
   *
   * @param {Number} limit The number of rows.
   * @param {Number} offset The number of rows from the first at which to start.
   * @return {createObject} the truncated table.
   */
  function limit(limit, offset) {
    offset = offset || 0;
    var fields = getFields();
    var output = createOutput(fields);

    fields.map(function(field) {
      output[field] = table[field].splice(offset, limit);
    });
    return createTable(output);
  }

  return {
    table: table,
    createTable: createTable,
    toMatrix: toMatrix,

    select: select,
    filter: filter,
    union: union,
    group_by: group_by,
    join: join,
    flatten: flatten,
    limit: limit,

    as: As,
    fun: Fun,
    is: is,
    getFields: getFields,
    rows: rows,
    and: and,
    or: or,
    not: not
  };
}


/**
 * Creates a table from a two dimensional array.
 *
 * The 2d array is an array of arrays.
 * Each element of the outer array is a row.
 * Each element of the inner arrays is a column in that row.
 *
 * @param {Array} data The 2d array to be converted into a table.
 * @return {createTable} The input as a table instance.
 */
function createTableFromMatrix(data) {
  function verify2dArray() {
    var errorMessage = "Data is not a 2 dimensional Array"
    if (!Array.isArray(data)) {throw errorMessage;}
    data.map(function (x) {if (!Array.isArray(x)) {throw errorMessage;}});
  }

  function makeTable() {
    var output = {};
    for (var col in data[0]) {
      var field = data[0][col];
      output[field] = [];
      for (var row = 1; row < data.length; row++) {
        output[field].push(data[row][col]);
      }
    }
    return output;
  }

  return createTable(makeTable());
}
