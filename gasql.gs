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
   * Returns unique entries from an array.
   *
   * @param {Array} a The array to be deduped.
   * @return {Array} An array with unique values.
   */
  function unique(a) {
    if(!a.isArray()) {throw "Argument must be an array!";}
    var output = [];
    a.map(function(e) {if (output.indexOf(e) === -1) {output.push(e);}});
    return output;
  }

  /**
   * Creates an object with field names as keys and empty arrays as values.
   *
   * @param {Array} fields An array of field names.
   * @return {Object} The object with the field names as keys and empty arrays.
   */
  function createOutput(fields) {
    if(!fields.isArray()) {throw "Argument must be an array!";}
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
    var f = fun.fun;
    var args = fun.args;
    var r = rows();

    var args = args.map(function(arg) {
      if (fields.indexOf(arg) === -1) {
        return repeat(arg, r);
      } else {
        return table[arg];
      }
    });

    var output = [];
    var currentArgs;
    for (var row = 0; row < r; row++) {
      currentArgs = args.map(function(arg) {return arg[row];});
      output.push(f.apply(this, currentArgs));
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
    if (!(i % 1 !== 0 && i >= 0) {
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
    if (fields.indexOf(lop) !== -1) {
      lopf = table[lop];
    }
    if (fields.indexOf(row) !== -1) {
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
      if (["object", "string"].indexOf(typeof(field)) === -1) {
        throw "Wrong argument type";
      }

      if (typeof(field) === "string") {
        if (tableFields.indexOf(field) === -1 && field !== "*") {
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
      fields = lfields.filter(function(lfield) {
        return rfields.indexOf(lfield) !== -1;
      })
    }
    if (behavior == 1) {fields = lfields;}
    if (behavior == 2) {fields = rfields;}
    if (behavior == 3) {
      fields = unique(lfields.concat(rfields));
    };

    var output = createOutput(fields);

    // Check if any of the fields of the left table are in the final table
    // To see if missing values need to be filled up
    var lfillupNeeded = lfields.map(function(field) {
      return fields.indexOf(field) !== -1;}).reduce(function(a,b) {
        return a || b;});

    var rfillupNeeded = rfields.map(function(field) {
      return fields.indexOf(field) !== -1;}).reduce(function(a,b) {
        return a || b;});

    fields.map(function(field) {
      if (lfields.indexOf(field) !== -1) {
        output[field] = output[field].concat(table[field]);
      } else if (lfillupNeeded) {
        output[field] = output[field].concat(repeat(empty, rows()));
      }

      if (rfields.indexOf(field) !== -1) {
        output[field] = output[field].concat(t.table[field]);
      } else if (rfillupNeeded) {
        output[field] = output[field].concat(repeat(empty, rows()));
      }
    })
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
      if (fields.indexOf(arg) === -1) {throw arg + "not found!";}
    })

    var fields = getFields();
    var currentRow;
    var checkRow;
    var nested = createOutput(fields);

    function getRow(table, row, target) {
      var fields = Object.keys(table);
      fields = fields.filter(function(f) {return target.indexOf(f) !== -1;});
      return fields.map(function(field) {
        return table[field][row];
      });
    }

    // Create a nested version of the table
    for (var iRow in table[fields[0]]) {
      currentRow = getRow(table, iRow, groups);
      var found = false;
      for (var oRow in nested[fields[0]]) {
        checkRow = getRow(nested, oRow, groups);
        if (JSON.stringify(currentRow) == JSON.stringify(checkRow)) {
          found = oRow;
          break;
        }
      }
      if (found) {
        fields.map(function(field) {if (groups.indexOf(field) === -1) {
          nested[field][oRow].push(table[field][iRow]);
        }}, this)
      } else {
        fields.map(function(field) { // emove map to not have gloal environment
          if (groups.indexOf(field) === -1) {
            nested[field].push([table[field][iRow]]);
          } else {
            nested[field].push(table[field][iRow]);
          }
        }, this);
      }
    }
    return createTable(nested);
  }

  return {
    table: table,
    createTable: createTable,
    toMatrix: toMatrix,

    select: select,
    filter: filter,
    union: union,
    group_by: group_by,

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
