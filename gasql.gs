// TODO:
//  - Check if 2d table is flat
//  - Check if Table is non-ragged

function createTable(table) {
  function select(fields) {
    fields = fields.split(",");
    fields = fields.map(function(arg) {return arg.trim();});


    //verify fields exist
    var tableFields = Object.keys(table);
    fields.map(function(field) {
      if (tableFields.indexOf(field) === -1 && field !== "*") {
        throw field + "is not a field of this table";
    }});

    // verify fields aren't selected twice
    for (var x = 0; x < fields.length; x++) {
      for (var y = x + 1; y < fields.length; y++) {
        if (fields[x] === fields[y] || fields[y] === "*" || fields[x] === "*") {
          throw fields[x] + "Selected more than once";
        }
      }
    }

    var output = {};
    fields.map(function (field) {output[field] = table[field];});
    if (fields[0] === "*") {return createTable(table)}
    return createTable(output);
  }


  return {
    table: table,
    createTable: createTable,
    select: select,
    where: where
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
