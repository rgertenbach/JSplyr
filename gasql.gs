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

  function toMatrix() {
    var output = [[]];
    var fields = getFields();
    fields.map(function(field) {output[0].push(field);})
    for (var row in table[fields[0]]) {
      output.push(fields.map(function(field) {return table[field][row]}));
    }
    return output;
  }

  function as(field, alias) {
    return {field: field, alias: alias};
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


  return {
    table: table,
    createTable: createTable,
    toMatrix: toMatrix,
    select: select,
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
