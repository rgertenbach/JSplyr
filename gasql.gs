function createTable(table) {
  function objectToArray(object) {
    var output = [];
    return Object.keys(object).map(function(key) {return object[key];});
  }

  function repeat(x, n) {
    var output = [];
    while (n > 0) {
      output.push(x);
      n--;
    }
    return output;
  }

  function unique(a) {
    var output = [];
    a.map(function(e) {if (output.indexOf(e) === -1) {output.push(e);}});
    return output;
  }

  function createOutput(fields) {
    var output = {};
    fields.map(function (field) {
      if (typeof(field) == "string") {
        output[field] = [];
      } else {
        output[field.alias] = [];
      }});
    return output;
  }

  function toMatrix() {
    var output = [[]];
    var fields = getFields();
    fields.map(function(field) {output[0].push(field);})
    for (var row in table[fields[0]]) {
      output.push(fields.map(function(field) {return table[field][row]}));
    }
    return output;
  }

  function as(field, alias, fun) {
    var output = {field: field,
                  alias: alias};
    if (typeof(fun) === "function") {
      output.fun = fun;
    }
    return output;
  }

  function getFields() {
    return Object.keys(table);
  }

  function cols() {
    return getFields().length;
  }

  function rows() {
    return table[getFields()[0]].length;
  }

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

  function and() {
    var arguments = objectToArray(arguments);
    var output = [];

    for (var row in arguments[0]) {
      output.push(arguments.reduce(function(a,b) {return a[row] && b[row];}));
    }
    return output;
  }

  function or() {
    var arguments = objectToArray(arguments);
    var output = [];

    for (var row in arguments[0]) {
      output.push(arguments.reduce(function(a,b) {return a[row] || b[row];}));
    }
    return output;
  }

  function not(x) {
    return x.map(function(x) {return !x;});
  }

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

      if (typeof(field) === "object") {
        if (! field.hasOwnProperty("field")) {
          throw "Wrong type of Object supplied";
        }
        if (tableFields.indexOf(field.field) === -1) {
          throw "Field " + field.field + "not found";
        }
      }
    });

    var output = {};
    fields.map(function (field) {
      if (typeof(field) == "string") {
      output[field] = table[field];
    } else {
      output[field.alias] = table[field.field];
    }
    });
    return createTable(output);
  }

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
   *  Behavior:
   *  - undefined or 0 uses only common columns
   *  - 1 uses only left columns
   *  - 2 uses right columns
   *  - 3 uses all columns
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

  return {
    table: table,
    createTable: createTable,
    toMatrix: toMatrix,

    select: select,
    filter: filter,
    union: union,

    as: as,
    is: is,
    getFields: getFields,
    rows: rows,
    and: and,
    or: or,
    not: not
  };
}


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
