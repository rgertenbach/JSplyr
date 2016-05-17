// TODO:
//  - Check if 2d table is flat
//  - Check if Table is non-ragged

function createTable(table) {
  function objectToArray(object) {
    var output = [];
    return Object.keys(object).map(function(key) {return object[key];});
  }

  function as(field, alias) {
    return {field: field, alias: alias};
  }

  function select() {
    var fields = objectToArray(arguments);
    
    //verify fields exist
    var tableFields = Object.keys(table);
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
    select: select,
    as: as
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
