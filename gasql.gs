JSplyr = Object.create(null);


/**
 * CConstructor for table objects
 *
 * The table has a table attribute with is an object with field names as keys.
 * The values are arrays containing the rows of each column.
 *
 * @param {Object} table The object that will be the table propertt.
 * @returns {Table} The table with methods to work with instances of itself.
 */
JSplyr.Table = function(table) {
  this.table = table;
};


/**
 * Table Wrapper for Objcts
 *
 * @param {Object} table The object that will be the table propertt.
 * @returns {Table} The table with methods to work with instances of itself.
 */
JSplyr.createTable = function(table) {
  var output = new JSplyr.Table(table)
  return output;
};


/**
 * Creates a table from a two dimensional array.
 *
 * The 2d array is an array of arrays.
 * Each element of the outer array is a row.
 * Each element of the inner arrays is a column in that row.
 *
 * @param {Array} data The 2d array to be converted into a table.
 * @return {Table} The input as a table instance.
 */
JSplyr.createTableFromMatrix = function(data) {
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

  return JSplyr.createTable(makeTable());
};


/**
 * verifies whether an Object is a certain JSplyr object.
 *
 * @param {Object} object The object to be checked
 * @param {string} name The name of the object to be checked. Blank checks
 *                 if it has a _JSplyrName property (lame)
 * @return {logical} Whether the object passes the test.
 */
JSplyr.isObject = function(object, name) {
  if (!name) {return object.hasOwnProperty("_JSplyrName");}
  return object._JSplyrName === name;
};


/**
 * An alias object that can be used instead of field names in selections.
 *
 * @param {Object} field The field of the table to be used.
 * @param {string} alias The Name the field will have in the selection.
 *
 * @return {Object} Returns a field-alias object.
 */
JSplyr.as = function(field, alias) {
  return {_JSplyrName: "alias", field: field, alias: alias};
};


/**
 * Allows for scalar functions within records of a table.
 * Note that while this is a scalar application of a function it is possible
 * to use it as an aggregation when using group_by().
 *
 * @param {function} fun The function to be evaluated per row.
 * @param {string} alias The alias of the function value.
 * @param {...} ... Any arguments passed to the function.
 */
JSplyr.fun = function(fun, alias) {
  if (typeof(fun) !== "function") {
    throw "First argument must be a function!";
  }
  var args = JSplyr.objectToArray(arguments);
  args.splice(0,2);
  return {_JSplyrName: "function", fun: fun, alias: alias, args: args};
};


/**
 * Logical and applied to a list of arrays.
 *
 * k Arrays of length n will return an array of length n where each row is the
 * logical and of row i of n for each column j of k.
 *
 * @param {Array} ... 0 or more arrays.
 * @return {Array} The resulting vector of true/false values.
 */
JSplyr.arrayAnd = function() {
  var arguments = JSplyr.objectToArray(arguments);
  var output = [];

  for (var row in arguments[0]) {
    output.push(arguments.reduce(function(a,b) {return a[row] && b[row];}));
  }
  return output;
};


/**
 * Logical or applied to a list of arrays.
 *
 * k Arrays of length n will return an array of length n where each row is the
 * logical or of row i of n for each column j of k.
 *
 * @param {Array} ... 0 or more arrays.
 * @return {Array} The resulting vector of true/false values.
 */
JSplyr.arrayOr = function() {
  var arguments = JSplyr.objectToArray(arguments);
  var output = [];

  for (var row in arguments[0]) {
    output.push(arguments.reduce(function(a,b) {return a[row] || b[row];}));
  }
  return output;
};


/**
 * The negation of an array of boolean values.
 *
 * @param {Array} x The array to be negated.
 * @return {Array} an array of the negated values of x.
 */
JSplyr.arrayNot = function(x) {
  return x.map(function(x) {return !x;});
};


/**
 * Extracts element out of an Object into an array
 *
 * @param {Object} object The object to be parsed
 * @return {Array} The Values of the object in an array.
 */
JSplyr.objectToArray = function(object) {
  var output = [];
  return Object.keys(object).map(function(key) {return object[key];});
};


/**
 * Return a comparison object
 *
 * @param {Object} lop The left operand. Can be a field name or a literal.
 * @param {Object} op The operand.
 * @param {Object} rop The right operand. Can be a field name or a literal.
 * @return {Object} An object containing the three arguments.
 */
JSplyr.comp = function(lop, op, rop) {
  return {_JSplyrName: "comparison", lop: lop, op: op, rop: rop};
}


/**
 * Returns a logical combination of type and
 *
 * @param {comparison} ... A series of comparisons
 * @return {logical combination} A logical and combinations
 */
JSplyr.and = function() {
  var args = JSplyr.objectToArray(arguments);
  return {_JSplyrName: "logical combination", type: "and", args: args};
};


/**
 * Returns a logical combination of type or
 *
 * @param {comparison} ... A series of comparisons
 * @return {logical combination} A logical or combinations
 */
JSplyr.or = function() {
  var args = JSplyr.objectToArray(arguments);
  return {_JSplyrName: "logical combination", type: "or", args: args};
};


/**
 * Returns the logical complement of a comparison
 *
 * @param {comparison} comp The logical comparison to be negated/
 * @return {logical combination} A logical negation
 */
JSplyr.not = function(comp) {
  return {_JSplyrName: "logical combination", type: "not", args: [comp]};
};


/**
 * Recursively evaluates logical combinations
 *
 * @param {logical combination} comb the logical combination to be evaluated.
 * @param {table} target the table on which the logical combination happens.
 */
JSplyr.evaluateLogicalCombination = function(comb, target) {
  if (!JSplyr.isObject(comb, "logical combination")) {"Not a combination!";}
  var logicalArrays = comb.args.map(function(expr) {
    if (JSplyr.isObject(expr, "logical combination")) {
      return JSplyr.evaluateLogicalCombination(expr, target);
    } else {
      return target.is(expr);
    }
  });
  if (comb.type === "and") {
    return JSplyr.arrayAnd.apply(target, logicalArrays);
  } if (comb.type === "or") {
    return JSplyr.arrayOr.apply(target, logicalArrays);
  } if (comb.type === "not") {
    return JSplyr.arrayNot.apply(target, logicalArrays);
  }
};


/**
 * @param {Object} field a field name or fun instance.
 * @return {Object} an order orbject (ascending type)
 */
JSplyr.asc = function(field) {
  return {_JSplyrName: "order param", type: "asc", field: field};
}


/**
 * @param {Object} field a field name or fun instance.
 * @return {Object} an order orbject (descending type)
 */
JSplyr.desc = function(field) {
  return {_JSplyrName: "order param", type: "desc", field: field};
}


/**
 * Creates an object with field names as keys and empty arrays as values.
 *
 * @param {Array} fields An array of field names.
 * @return {Object} The object with the field names as keys and empty arrays.
 */
JSplyr.createOutput = function(fields) {
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
 * A python style range generator
 */
JSplyr.range = function(a, b, c) {
  var start, end, step;
  if (c === undefined && b === undefined) {
    start = 0;
    end = a;
    step = 1;
  } else {
    start = a;
    end = b;
    step = c || 1;
  }
  var current = start;
  var output = [];
  while (current < end) {
    output.push(current);
    current += step;
  }
  return output;
};


/**
 * Whether or not x is in array y
 *
 * @param {Object} x The object to be looked for
 * @param {Array} y The array to be searched
 * @return {logical} Whether x could be found in y.
 */
JSplyr.isIn = function(x, y) {
  return y.indexOf(x) !== -1;
}


/**
 * Returns unique entries from an array.
 *
 * @param {Array} a The array to be deduped.
 * @return {Array} An array with unique values.
 */
JSplyr.unique = function(a) {
  if(!Array.isArray(a)) {throw "Argument must be an array!";}
  var output = [];
  a.map(function(e) {if (!JSplyr.isIn(e, output)) {output.push(e);}});
  return output;
}


/**
 * Repeats a value n times
 *
 * @param {Object} x The object to be repeated.
 * @param {number} n The number of repetitions.
 * @return {Array} An array of size n filled with copies of x.
 */
JSplyr.repeat = function(x, n) {
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
 * Repeats a string n times and returns it in a new string instead of an array
 *
 * @param {String} str The string to be repeated
 * @param {Number} n Integer (0 or greater) how many times str is repeated.
 * @return {String} The repeated string
 */
JSplyr.repeatString = function(str, n, joinkey) {
  joinkey = joinkey || "";
  return JSplyr.repeat(str, n).join(joinkey);
}


/**
 * Recursively checks if two arrays are identical
 */
JSplyr.equalArrays = function(a1, a2) {
  if (!(Array.isArray(a1) && Array.isArray(a2))) {return false;}
  if (a1.length !== a2.length) {return false;}
  for (var i in a1) {
    if (Array.isArray(a1[i])) {
      if (!equalArrays(a1[i], a2[i])) {return false;jj}
    } else {
      if (a1[i] !== a2[i]) {return false;}
    }
  }
  return true;
}


JSplyr.stringifier = Object.create(null);


/**
 * Creates a character Object for a number
 */
JSplyr.stringifier.numberCharacterizer = function(x) {
  return {
    content: String(x),
    type: "number",
    height: 1,
    width: String(x).length
  }
}


/**
 * Creates a character Object for a string
 */
JSplyr.stringifier.stringCharacterizer = function(x) {
  var findNewlines = /[\n\r]/gi;
  var newLines = x.match(findNewlines);
  var height = newLines ? newLines.length + 1 : 1;
  var rows = x.split(findNewlines);
  var maxWidth = rows.reduce(function(x, y) {return x.length > y.length ? x : y});
  return {content: x, type: "string", width: maxWidth.length, height: height}
}


/**
 * Creates a character Object for a function
 */
JSplyr.stringifier.functionCharacterizer = function(x) {
  var fString = x.toString().replace(/\r/g, "");
  return JSplyr.stringifier.stringCharacterizer(fString);
}


/**
 * Creates a character Object for an array
 */
JSplyr.stringifier.arrayCharacterizer = function(x) {
  var elements = x.map(JSplyr.stringifier.characterize);
  var outputContent =
    "["+
    elements.map(function(x) {return x.content}).toString() +
    "]";
  var output = JSplyr.stringifier.stringCharacterizer(outputContent)
  return output;
}


/**
 * Creates a character Object for a table
 */
JSplyr.stringifier.tableCharacterizer = function(x) {
  var m = x.toMatrix();
  var o = m.map(function(row) {
    return row.map(JSplyr.stringifier.characterize);});
  var fields = x.getFields();
  var colWidths = o[0].map(function(x) {return x.width});
  JSplyr.range(1, x.rows() + 1).map(function(row) {
    for (var col in colWidths) {
      if (o[row][col].width > colWidths[col]) {
        colWidths[col] = o[row][col].width;
      }
    }
  })

  var rowHeights = o.map(function(row) {
    return row.map(function(x) {return x.height})
              .reduce(function(x, y) {return x > y ? x : y})
  });

  /**
   * function to create matrix for row containing subrows that can be parsed
   * into a string
   */
  function rowMatrix(row) {
    // Create Subrows
    var columns = [];
    for (var col in fields) {
      columns.push(o[row][col].content.split(/[\n\r]/));
    }

    // Standardize subrows to # of subrows the row needs
    for (var col in o[row]) {
      while (columns[col].length < rowHeights[row]) {
        columns[col].push("");
      }

      // Pad subrows to column width
      for (var subRow in columns[col]) {
        while (columns[col][subRow].length < colWidths[col]) {
          columns[col][subRow] += " ";
        }
      }
    }
    return columns
  }

  var output = "";
  var rowNumberFiller = JSplyr.repeatString(
    " ", Math.floor(1 + Math.log10(o.length)));

  for (var row in o) {
    if (row == 1) {
      output += JSplyr.repeatString(" ", rowNumberFiller.length) + "| " +
                colWidths.map(function(w) {return JSplyr.repeatString("-", w)}
                        ).join(" | ") + " |\n"

    }
    var currentRow = rowMatrix(row);
    for (var subRow in JSplyr.range(rowHeights[row])) {
      // Add the row numbers
      output += (subRow == 0 && row > 0 ?
                 rowNumberFiller.substring(
                   0, rowNumberFiller.length - String(row).length) + row :
                 rowNumberFiller) + "| ";

      // Add rest of row
      output += currentRow.map(function(col) {return col[subRow]}).join(" | ");
      output += " |\n";
    }
  }

  return JSplyr.stringifier.stringCharacterizer(output);
}


/**
 * Creates a character Object for a generic object
 */
JSplyr.stringifier.objectCharacterizer = function(x) {
  var stringifiedX = JSplyr.stringifier.stringCharacterizer(x.toString());
  return stringifiedX;
}


/**
 * Carachterizes generic objects by dispatching
 */
JSplyr.stringifier.characterize = function(x) {
  if (typeof(x) === "number") return JSplyr.stringifier.numberCharacterizer(x);
  if (typeof(x) === "string") return JSplyr.stringifier.stringCharacterizer(x);
  if (typeof(x) === "function") return JSplyr.stringifier.functionCharacterizer(x);
  if (Array.isArray(x)) return JSplyr.stringifier.arrayCharacterizer(x);
  if (JSplyr.isObject(x, "Table")) return JSplyr.stringifier.tableCharacterizer(x);
  return JSplyr.stringifier.objectCharacterizer(x);
}


/**
 * toString prototype returning an ASCII representation of the table
 */
JSplyr.Table.prototype.toString = function() {
  return JSplyr.stringifier.tableCharacterizer(this).content;
}


JSplyr.Table.prototype._JSplyrName = "Table";


/**
 * Field names of the Table
 *
 * @return {Array} An array of the field names of the table.
 */
JSplyr.Table.prototype.getFields = function() {
  return Object.keys(this.table)
}


/**
 * The number of columns in the table
 *
 * @return {number} The number of columns in the table
 */
JSplyr.Table.prototype.cols = function() {
  return this.getFields().length;
}


/**
 * The i-th row of a table
 *
 * @param {Number} i The row number to be retrieved (0-based).
 * @return {Array} An array of the values in the i-th row.
 */
JSplyr.Table.prototype.getRow = function(i) {
  if (!(i % 1 !== 0 && i >= 0)) {
    throw "row must be an integer greatern than or equal to 0";
  }

  var fields = this.getFields();
  return fields.map(function(field) {return this.table[field][i];});
}


/**
 * Retrieves a column from a table
 *
 * @param {String} col The column to be retrieved.
 * @return {Object[]} The rows of the column
 */
JSplyr.Table.prototype.getColumn = function(col) {
  if (!JSplyr.isIn(col, this.getFields())) {
    throw "Column does not exist"
  }
  return this.table[col];
}


/**
 * The number of rows in the table
 *
 * @return {number} The number of rows in the table.
 */
JSplyr.Table.prototype.rows = function() {
  return this.table[this.getFields()[0]].length;
}


/**
 * Limits the output starting at a given offset or the first row.
 *
 * @param {Number} limit The number of rows.
 * @param {Number} offset The number of rows from the first at which to start.
 * @return {Table} the truncated table.
 */
JSplyr.Table.prototype.limit = function(limit, offset) {
  offset = offset || 0;
  var fields = this.getFields();
  var output = JSplyr.createOutput(fields);

  fields.map(function(field) {
    output[field] = this.table[field].splice(offset, limit);
  }, this);
  return JSplyr.createTable(output);
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
JSplyr.Table.prototype.toMatrix = function() {
  var output = [[]];
  var fields = this.getFields();
  fields.map(function(field) {output[0].push(field);}, this);

  for (var row in this.table[fields[0]]) {
    output.push(fields.map(function(field) {
      return this.table[field][row]
    }, this));
  }
  return output;
}


/**
 * Adds an array of values to the table as a new field
 *
 * @param {Array} values The array of values to be added
 * @param {String} alias The name the new field should have
 * ~return {Table} The Table with the new column
 */
JSplyr.Table.prototype.addColumn = function (values, alias) {
  if (!Array.isArray(values)) {
    throw "First Argument must be an array";
  }
  if (values.length !== this.rows()) {
    throw "Incompatible number of elements!";
  }
  output = this.table;
  output[alias] = values;
  return JSplyr.createTable(output);
}


/**
 * Selects a list of fields from the existing table.
 *
 * Takes either field names, As Aliases or Fun Functions.
 *
 * @param {...} ... A list of arguments.
 * @return {Table} An instance of a table with the selected fields.
 */
JSplyr.Table.prototype.select = function() {
  var fields = JSplyr.objectToArray(arguments);

  //verify fields exist
  var tableFields = this.getFields();
  fields.map(function(field) {
    if (JSplyr.isIn(field, ["object", "string"])) {
      throw "Wrong argument type";
    }

    if (typeof(field) === "string") {
      if (!JSplyr.isIn(field, tableFields) && field !== "*") {
        throw field + "is not a field of this table";
      }
    }
  });

  var output = {};
  fields.map(function (field) {
    if (typeof(field) == "string") {
    output[field] = this.table[field];
  } else if (JSplyr.isObject(field, "function")) {
    output[field.alias] = this.applyScalar(field);
  } else {
    output[field.alias] = this.table[field.field];
  }
  }, this);
  return JSplyr.createTable(output);
}


/**
 * Applies a Fun object to a table
 *
 * @param {Fun} fun A Fun object.
 * @return {Array} Returns an array of the results, one element per row.
 */
JSplyr.Table.prototype.applyScalar = function(fun) {
  if (!JSplyr.isObject(fun, "function")) {
    throw "Must provide a Fun Object!";
  }
  var fields = this.getFields();
  var r = this.rows();
  var args = fun.args.map(function(arg) {
    if (!JSplyr.isIn(arg, fields)) {
      return JSplyr.repeat(arg, r);
    } else {
      return this.table[arg];
    }
  }, this);

  var output = [];
  var currentArgs;
  for (var row = 0; row < r; row++) {
    currentArgs = args.map(function(arg) {return arg[row];});
    output.push(fun.fun.apply(this, currentArgs));
  }
  return output;
}


/**
 * Whether rows fulfil a criterion or not
 *
 * The function accepts either a string of a comparison such as == or > or
 * a function or a column reference;
 * that column must contain a functio in every row!
 * Due to the way JS evaluates truthiness any return value is ok.
 * The comperands can be field names, fun instances or literals.
 *
 * @param {Object} lop The left operand.
 * @param {Object} op The operand.
 * @param {Object} rop The right operand.
 * @return {Array} An array of booleans or values that will be used as such.
 */
JSplyr.Table.prototype.is = function(comp) {
  var lop = comp.lop;
  var op = comp.op;
  var rop = comp.rop;
  var fields = this.getFields();
  var output = [];

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
  } else if (JSplyr.isIn(op, fields)) {
    operations[op] = this.table[op];
  } else if (operations[op] === undefined) {
    throw "Operator must be a function, JS comparison or a field reference!";
  }

  function createComparator(side, thisArg) {
    thisArg = thisArg || this;
    if (JSplyr.isIn(side, fields)) {
      return thisArg.table[side];
    } if (JSplyr.isObject(side, "function")) {
      return thisArg.applyScalar(side)
    }
    return JSplyr.
    repeat(side, thisArg.rows());
  }

  var lopf = createComparator(lop, this);
  var ropf = createComparator(rop, this);

  for (var row in lopf) {
    output.push((fields.indexOf(op) !== -1 ?
        operations[op][row] :
        operations[op])(lopf[row], ropf[row]));
  }

  return output;
}


/**
 * Filters a table's rows.
 *
 * @param {Array} criterion An array of boolean values, one for each row.
 * @return {createTable} The resulting filtered table.
 */
JSplyr.Table.prototype.filter = function(criterion) {
  var fields = this.getFields();
  var output = JSplyr.createOutput(fields);

  for (var row in criterion) {
    if (criterion[row]) {
      fields.map(function(field) {
        output[field].push(this.table[field][row]);
      }, this);
    }
  }
  return JSplyr.createTable(output);
}


/**
 * Filters a table based on a logical combination or comparison provided
 */
JSplyr.Table.prototype.where = function(expr) {
  if (JSplyr.isObject(expr, "comparison")) {
    return this.filter(this.is(expr));
  } else if(JSplyr.isObject(expr, "logical combination")) {
    return this.filter(JSplyr.evaluateLogicalCombination(expr, this))
  } else {
    throw "Expression must be a comparison or logical combination!";
  }
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
 * @return {Table} The union of two tables.
 */
JSplyr.Table.prototype.union = function(t, behavior, empty) {
  behavior = behavior || 0;

  var lfields = this.getFields();
  var rfields = t.getFields();
  var fields;

  if (behavior == 0) {
    fields = lfields.filter(function(lField) {
      return JSplyr.isIn(lField, rfields);
    })
  }
  if (behavior == 1) {fields = lfields;}
  if (behavior == 2) {fields = rfields;}
  if (behavior == 3) {fields = JSplyr.unique(lfields.concat(rfields));}

  var output = JSplyr.createOutput(fields);

  // Check if any of the fields of the left table are in the final table
  // To see if missing values need to be filled up
  function fillUpNeeded(unionPartFields) {
    return unionPartFields.map(function(field) {
      return JSplyr.isIn(field, fields);}).reduce(function(a,b) {
        return a || b;});
  }

  function appendRows(source, field, unionPartfields, needsFillUp) {
    if (JSplyr.isIn(field, unionPartfields)) {
      output[field] = output[field].concat(source.table[field]);
    } else if (needsFillUp) {
      output[field] = output[field].concat(JSplyr.repeat(empty, source.rows()));
    }
  }

  var lfillupNeeded = fillUpNeeded(lfields);
  var rfillupNeeded = fillUpNeeded(rfields);

  fields.map(function(field) {
    appendRows(this, field, lfields, lfillupNeeded)
    appendRows(t, field, rfields, rfillupNeeded)
  }, this);
  return JSplyr.createTable(output);
}


/**
 * Groups a table by a list of field names by nesting non grouping fields.
 *
 * The non grouping fields will be nested in arrays.
 *
 * @param {String} ... The field names to be grouped by.
 * @return {Table} The nested table.
 */
JSplyr.Table.prototype.group_by = function() {
  var groups = JSplyr.objectToArray(arguments);
  var fields = this.getFields();

  groups.map(function(arg) {
    if (!JSplyr.isIn(arg, fields)) {throw arg + "not found!";}
  });

  var currentRow;
  var nested = JSplyr.createOutput(fields);

  function getRow(table, row, target) {
    var fields = Object.keys(table);
    fields = fields.filter(function(f) {return JSplyr.isIn(f, target);});
    return fields.map(function(field) {
      return table[field][row];
    });
  }

  function findMatchingRow(currentRow) {
    for (var oRow in nested[fields[0]]) {
      var checkRow = getRow(nested, oRow, groups);
      if (JSplyr.equalArrays(currentRow, checkRow)) {
        return oRow;
      }
    }
    return -1
  }

  function appendRow(row, target) {
    fields.map(function(field) {
      var cell = target.table[field][iRow];
      if (found !== -1 && !JSplyr.isIn(field, groups)) {
        nested[field][found].push(cell);
      } else if (found === -1) {
        nested[field].push(JSplyr.isIn(field, groups) ? cell : [cell]);
      }
    });
  }

  // Create a nested version of the table
  for (var iRow in this.table[fields[0]]) {
    currentRow = getRow(this.table, iRow, groups);
    var found = findMatchingRow(currentRow);
    appendRow(found, this);
  }
  return JSplyr.createTable(nested);
}


/**
 * flatten unnests an array.
 * @param {string} field The nested field to be unnested.
 * @return {Table} The flattened table.
 */
JSplyr.Table.prototype.flatten = function(field) {
  var fields = this.getFields();

  if (!JSplyr.isIn(field, fields)) {throw field + " is not a valid field name!";}
  var column = this.table[field];
  if(!Array.isArray(column[0])) {throw field + " is not a nested field!";}
  var output = JSplyr.createOutput(fields);

  function appendRow(row, element, thisArg) {
    thisArg = thisArg || this;
    fields.map(function(f) {
      if (f === field) {
        output[f].push(column[row][element]);
      } else {
        output[f].push(thisArg.table[f][row]);
      }
    })
  }

  for (var row in column) {
    for (var element in column[row]) {
      appendRow(row, element, this);
    }
  }
  return JSplyr.createTable(output);
}


/**
 * Joins two tables with one another
 *
 * Legal join strategies are:
 *  - "inner": Only rows that have matches are used.
 *  - "left": Inner join + unmatches left rows.
 *  - "right" Inner join + unmatched right rows.
 *  - "full": Inner join and unmatched left and right rows.
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
 * @return {Table} a Table that is the join result of the two tables.
 */
JSplyr.Table.prototype.join = function(right, method, lKeys, rKeys, empty) {
  var allowed_methods = ["inner", "left", "right", "full", "cross"]
  method = method || "inner";

  if (!JSplyr.isObject(right, "Table")) {throw "First argument must be table!";}
  if (!JSplyr.isIn(method, allowed_methods)) {
    throw "Second argument must be one of" + allowed_methods
  }
  if (typeof(lKeys) === "string") {lKeys = [lKeys];}
  if (typeof(rKeys) === "string") {rKeys = [rKeys];}
  if (method !== "cross" && lKeys.length !== rKeys.length) {
    throw "Join key lists must have same length!";
  }

  var lFields = this.getFields();
  var rFields = right.getFields();

  var oFields = lFields.map(function(f) {return "l." + f;}).concat(
                rFields.map(function(f) {return "r." + f;}));

  function methodIn(methods) {
    return JSplyr.isIn(method, methods);
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
    var output  = JSplyr.createOutput(oFields);
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
        var rightData = JSplyr.repeat(empty, oFields.length);
        pushRow();
      }
    }
    return output;
  }

  if (methodIn(["inner", "left", "full"])) {
    var lMatches = matchTables(this, right, lKeys, rKeys);
  }
  if (methodIn(["right", "full"])) {
    var rMatches = matchTables(right, this, rKeys, lKeys);
  }
  if (methodIn(["cross"])) {
    var lMatches = [];
    for (var lRow = 0; lRow < this.rows(); lRow++) {
      lMatches.push([]);
      for (var rRow = 0; rRow < right.rows(); rRow++) {
        lMatches[lRow].push(rRow);
      }
    }
  }

  var results;
  // Inner matches
  if (!methodIn(["right"])) {
    results = JSplyr.createTable(constructJoin(this, right, lMatches));
  } else {
    results = JSplyr.createTable(constructJoin(right, this, rMatches, false, true));
  }

  if (methodIn(["left", "full", "cross"])) {
    var b = JSplyr.createTable(constructJoin(this, right, lMatches, true));
    results = results.union(b);
  }

  if (methodIn(["right", "full"])) {
    var b = JSplyr.createTable(constructJoin(right, this, rMatches, true, true));
    results = results.union(b);
  }
  return results;
}


/**
 * Returns the row indices of the ascendingly ranked field
 *
 * @param {Object} field A fieldname or fun object.
 * @param {logical} dense Whether same values should get the same rank or not.
*                   This is obviously needed for sorting by multiple columns.
 * @return {Array} An array of the row numbers (0-based).
 */
JSplyr.Table.prototype.rankOrder = function(field, dense) {
  dense = dense || true;
  if (!JSplyr.isObject(field, "order param")) {
    throw "Order param not an order object!";
  }

  if (JSplyr.isObject(field.field, "function")) {
    var col = this.applyScalar(fied.field);
  } else {
    var col = this.table[field.field];
  }

  function minIndex() {
    return indices.reduce(function(y, x) {
      return (col[x] < col[y] ?
        (field.type === "desc" ? y : x) :
        (field.type === "desc" ? x : y));
    });
  }

  function getNext() {
    var minVal = minIndex();
    var index = indices.splice(indices.indexOf(minVal), 1)[0];
    return index;
  }

  function lastValue() {
    return col[ranks[ranks.length - 1][0]];
  }

  var indices = JSplyr.range(col.length);
  var ranks = [];

  while (indices.length > 0) {
    var minValue = minIndex();
    var next = getNext();

    if (ranks.length !== 0 && lastValue() === col[next] && dense) {
      ranks[ranks.length - 1].push(next);
    } else {
      ranks.push([next]);
    }
  }
  return ranks;
}


/**
* Orders a table by the fields provided.
*/
JSplyr.Table.prototype.order_by = function() {
  var args = JSplyr.objectToArray(arguments);
  args.map(function(arg) {
    if (!JSplyr.isObject(arg, "order param")) {
      throw "One of the arguments is not an order object!";
    }});

  var cols = args.map(function(arg) {
    if (JSplyr.isObject(arg.field, "function")) {
      return applyScalar(arg.field);
    } else {
      return this.table[arg.field];
    }
  }, this);

  var indices = JSplyr.range(this.rows());
  var ranks = [];


  /*
   * Finds the index of the value that comes next.
   * Calls itself recursively if needed.
   */
  function findMinI(colI) {
    var order = args[colI].type;
    var minVal = indices.map(function(i) {
      return cols[colI][i];
    }).reduce(function(x,y) {
      return  x < y ?
        (order == "asc" ? x : y) :
        (order == "asc" ? y : x);
    });

    var minValIndices = indices.filter(function(i) {
      return cols[colI][i] === minVal;
    });

    if (minValIndices.length === 1 || colI === cols.length - 1) {
      return minValIndices[0];
    } else {
      return findMinI(colI + 1);
    }
  }

  var ranks = [];
  while (indices.length > 0) {
    var minIndex = findMinI(0);
    var minIndexPos = indices.indexOf(minIndex);
    var minI = indices.splice(minIndexPos, 1)[0];
    ranks.push(minI)
  }

  var fields = this.getFields();
  var output = JSplyr.createOutput(fields);
  ranks.map(function(rank) {
    fields.map(function(field) {
      output[field].push(this.table[field][rank]);
    }, this)
  }, this);

  return JSplyr.createTable(output);
}
