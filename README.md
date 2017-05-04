# JSplyr
JS plyr is a Javascript library that allows you to work with Table like objects.

## 1. JSplyr Table constructors
JSplyr has two wrappers serving as functional table constructors

### createTable()
createTable takes an object as its argument and returns a table object.
The object's values need to be arrays that all have the same length.

#### Arguments

**data:** An object whose keys are the field names and values are arrays of equal length

#### Example

| Customer ID | Country | Revenue |
| -----------:| ------- | -------:|
|           1 | GB      |   19.99 |
|           2 | GB      |   28.50 |
|           3 | DE      |  113.50 |
|           4 | GB      |   23.54 |
|           5 | FR      |   89.99 |
|           6 | GB      |   23.10 |
|           7 | FR      |   90.00 |
|           8 | xx      |    0.10 |
|           9 | GB      |    5.00 |
|          10 | DE      |    4.99 |

```javascript
var customerData = {
  "Customer ID": [1,    2,     3,     4,    5,      6,    7,    8,    9,    10],
  "Country":     ["GB", "GB",  "DE",  "GB", "FR",   "GB", "FR", "XX", "GB", "DE"],
  "Revenue":     [19.99, 28.5, 113.5, 23,54, 89.99, 23.1, 90,   0.1,   5,   4.99]
};

var customers = JSplyr.createTable(customerData);
```

### 1.2. createTableFromMatrix()
createTableFromMatrix creates a table object from a two dimensional array.
Each array within the top array is a row with every element of those arrays being a column's cell within that row.
This format of data is for example used when values are retrieved from Google Spreadsheets.

#### Arguments

<b>data</b>: A two dimensional array, aka an array containing arrays of equal length where each array is a row and each element is a column within that row.

#### Example

| Country Code | Country Name  |
| ------------ | ------------- |
| GB           | Great Britain |
| DE           | Germany       |
| FR           | France        |
| ES           | Spain         |
| NL           | Netherlands   |


```javascript
var countryData = [
["Country Code", "Country Name"],
["GB", "Great Britain"],
["DE", "Germany"],
["FR", "France"],
["ES", "Spain"],
["NL", "Netherlands"]];

var countries = JSplyr.createTableFromMatrix(countryData);
```

### createTableFomObjects
Takes an array of dictionaries and returns a table created from them.  
Technically you can provide an array of arbitrary objects, the table fields will be all fields of the first object in the Array.

#### Arguments
<b>data</b>: An Array of dictionaries

#### Example
```javascript
var stuff = [
  {H1: 1, H2: 2, H3: 3},
  {H1: 4, H2: 5, H3: 6}
];

var stuffTable = JSplyr.createTableFromObjects(stuff);
```

## 2. Table methods and attributes
A JSplyr table object has a list of methods that should be familiar to users of SQL and dplyr.
SQL users may be thinking it lacks some functionality of SQL, but the ability to easily chain commans and powerful scalar function allow it be just as if not more expressive as SQL in some ways.

Each of these methods return a table itself which contains the same methods.

### 2.1. select()

Select returns a table containing the selection of columns of the table that it was used on.

#### Arguments

<b>...</b>: 0 or more arguments that create a field.
 A field can be:
 - A column from the source table, called with a string containing the column name.
 - A column that has been given an alias by using JSplyr.as(). (See more under xxx)
 - A calculated column that is an application of a function using JSplyr.fun() whose arguments can be column names. (See more under xxx)

#### Example

```javascript
function convertToUsd(x) {
  var exchangeRate = 1.3;
  return x * exchangeRate;
}

var customersUsd = customers.select(
  "Customer ID",
  JSplyr.as("Revenue", "Rev"),
  JSplyr.fun(convertToUsd, "USD Rev", "Revenue"));
```

| Customer ID | Rev    | USD Rev |
| -----------:| ------:| -------:|
|           1 |  19.99 |  25.987 |
|           2 |  28.50 |  37.05  |
|           3 | 113.50 | 147.55  |
|           4 |  23.54 |  29.90  |
|           5 |  89.99 | 116.987 |
|           6 |  23.10 |  30.03  |
|           7 |  90.00 | 117.00  |
|           8 |   0.10 |   0.13  |
|           9 |   5.00 |   6.50  |
|          10 |   4.99 |   6.487 |

### filter(criterion)
filter filters a table based on an array of truthy or falsy values.
If a value is truthy the row is in the final output;

#### Arguments

<b>criterion:</b> An arrray with the same length as the number of rows in the table. The values are interpreted for their truthiness. Values stay if they are truthy and get removed if they are falsy.

#### Example
```javascript
var mySelection = customers.filter([true, false, true, false, true,
                                    false, true, false, true, false]);
```

| Customer ID | Country | Revenue |
| ----------- | ------- | -------:|
|           1 | GB      |   19.99 |
|           3 | DE      |  113.50 |
|           5 | FR      |   89.99 |
|           7 | FR      |   90.00 |
|           9 | GB      |    5.00 |

### where()

Where is the sql familiar clause.
A where clause takes either:
 - A comparison object or
 - A logical combination object.

#### Arguments

<b>expr:</b> expr must be either a logical comparison or a logical combination.

#### Example

```javascript
var highSpendersFromGb = customers.where(
    JSplyr.and(
        JSplyr.comp("Revenue", ">", 20),
        JSplyr.comp("GB", "===", "Country")));
```

| Customer ID | Country | Revnenue |
| ----------- | ------- | --------:|
|           2 | GB      |    28.50 |
|           4 | GB      |    23.54 |
|           6 | GB      |    23.10 |

### group_by()
group_by groups the table by its keys and puts all values that are not grouping keys into arrays.
This allows map and reduce operations, that are embedded in scalar functions to operate on these arrays and aggregate data.

If no grouping key is given the resulting table will have one row with all original rows combined. This just means, that getting a grand aggregate value is indeed possible.

#### Arguments

<b>...:</b> The arguments thos group_by are a list of 0 or more field names as strings.

#### Example

```javascript
var revByCountry = customers.group_by("country");
```

| Customer ID     | Country | Revnenue                           |
| -----------     | ------- | ----------------------------------:|
| [1, 2, 4, 6, 9] |  UK     | [19.99, 28.50, 23.54, 23.10, 5.00] |
| [3, 10]         |  DE     | [113.50, 4.99]                     |
| [5, 7]          |  FR     | [89.99, 90.00]                     |
| [8]             |  XX     | [0.10]                             |

### flatten()
Flatten takes a field that is nested (usually by a group by operation) and unravels it into a row for eachof the values.
This operation can only be performed on one measure to avoid dangers of mismatching different elements inside of the arrays.
It's main use is for when the flattened data was an array in the first place, not a result of grouping, or if grouped, the only field that was grouped.

#### Arguments

<b>field:</b> The field to be flattened supplied as a string.

#### Example

```javascript
revByCountry.flatten("rev");
```

| Customer ID     | Country | Revenue |
| ---------------:| ------- | -------:|
| [1, 2, 4, 6, 9] | GB      |   19.99 |
| [1, 2, 4, 6, 9] | GB      |   28.50 |
| [3, 10]         | DE      |  113.50 |
| [1, 2, 4, 6, 9] | GB      |   23.54 |
| [5, 7]          | FR      |   89.99 |
| [1, 2, 4, 6, 9] | GB      |   23.10 |
| [5, 7]          | FR      |   90.00 |
| [8]             | xx      |    0.10 |
| [1, 2, 4, 6, 9] | GB      |    5.00 |
| [3, 10]         | DE      |    4.99 |

### limit()
Limit simply limit the amount of rows of the table.
It takes an optional offset parameter and returns up to as many rows as specified in the limit.

#### Arguments

<b>llimit:</b> The number of rows to limit the output by. This is the number of natural rows. of the table. If content has been groped then a group is one row.  
<b>offset:</b> The number of rows to skip from the first row. This parameter is 0 based. An offset of 1 starts at the second row.

#### Example
```javascript
customers.limit(2,2);
```

| Customer ID | Country | Revenue |
| -----------:| ------- | -------:|
|           3 | DE      |  113.50 |
|           4 | GB      |   23.54 |

### join()
Join joins the current table with another one given two arrays of the names of the keys in each table.
Join supports all typical join types:
 - Inner join: Only rows whose key values appear in the joined table appear
 - Left join: Inner Join results as well as rows from the main table that had no match.
 - Right Join: Inner join results as well as rows from the joined table that had no match
 - Full Join: Inner Join as well as any row that did not have a match from either table.
 - Cross Join: Cross product of the two tables. On row for every row of the first table for every rowof the joined table.

[Picture of join logic goes here]

 Join creates a row for every match it finds (unlike for example a vlookup)

#### Arguments

<b>right:</b> The right table to be joined onto this table.  
<b>method:</b> The join method.  
<b>lkeys:</b> An array containing a number of strings that indicate the field names of the left table to be joined by.  
<b>rkeys:</b> An rrays of the same length as lkeys containing the field names of the right table to be joined by.  
<b>empty:</b> The value to fill a row with if the join result is the equivalent of NULL. The default is `undefined.`  

#### Example
```javascript
customers.join(countries, "left",  ["Country"], ["Country Code"], "")
         .select(JSplyr.as("r.Country Name", "Country"),
                 JSplyr.as("l.Revenue", "Revenue"))

```

| Country       | Revenue |
| ------------- | -------:|
| Great Britain |   19.99 |
| Great Britain |   28.50 |
| Germany       |  113.50 |
| Great Britain |   23.54 |
| France        |   89.99 |
| Great Britain |   23.10 |
| France        |   90.00 |
| undefined     |    0.10 |
| Great Britain |    5.00 |
| Germany       |    4.99 |

### union()
A union concatenated the rows of two tables together.

A union has several strategies
 - undefined or 0 uses only common columns
 - 1 uses only left columns
 - 2 uses right columns
 - 3 uses all columns

#### Arguments

<b>t:</b> The table to be unioned onto the current table.  
<b>behavior:</b> The union strategy of which columns to use. Default is 0.  
<b>empty:</b> The default value to use if a column does not exist. Default is undefined.  

#### Example
```javascript

````

### order_by()

order_by orders a table.
It takes multiple Order expressions. In the case of a tied it wll go to the next field and see which row should come first.

#### Arguments

<b>...:</b> One or more Ordering objects that are either ascending or descending.

#### Example
```javascript
customers.order(JSplyr.asc("Country"), JSplyr.desc("Revenue"));
```

| Customer ID | Country | Revenue |
| -----------:| ------- | -------:|
|           3 | DE      |  113.50 |
|          10 | DE      |    4.99 |
|           7 | FR      |   90.00 |
|           5 | FR      |   89.99 |
|           2 | GB      |   28.50 |
|           4 | GB      |   23.54 |
|           6 | GB      |   23.10 |
|           1 | GB      |   19.99 |
|           9 | GB      |    5.00 |
|           8 | xx      |    0.10 |

### addColumn
Adds a column to the table
Takes an array and a field name and adds the array as rows for the new field name column.
The array must have the same length as the table has rows.

#### Arguments

<b>values:</b> An array of values that will be the new column  
<b>alias:></b> The name the new field should have

### applyTVF
Applies a table valued function to the table.   
The TVF takes every row of the table separately and returns 0 or more output rows.

The TVF supplied will take a Row dictionary with the field names as keys and the cell values as values as the first parameter and an arbitrary amount of additional parameters you supply as an array to applyTVF.  

The output of the TVF needs to be an Array of dictionaries, the dictionary of the first processed row that is not empty will serve as the prototype for the table.

#### Arguments
<b>tvf</b>: The Table valued function taking an object as its first parameter.  
<b>params</b>: An array of parameters supplied as the following parameters to the TVF.

#### Example
```javascript
var data = [["H1", "H2", "H3"],
[1,2,[31, 32]],
[4,5,[61]],
[7,8,[]]];

var t = JSplyr.createTableFromMatrix(data);

function flatten(o, repeatedField) {
  var fields = Object.keys(o);
  var repeated = o[repeatedField];
  var output = [];

  repeated.forEach(function(x) {
    var row = {};
    fields.forEach(function(field) {
      row[field] = (field !== repeatedField ? o[field] : x);
    });
    output.push(row);
  });
  return output;
}

t.applyTVF(flatten, "H3").toString();

//  | H1 | H2 | H3 |
//  | -- | -- | -- |
// 1| 1  | 2  | 31 |
// 2| 1  | 2  | 32 |
// 3| 4  | 5  | 61 |

```

### toString()
Overload of the toString generic.
This funtions supports nested objects and has representations for many types:
 - Numbers
 - Strings, including linebreaks
 - Arrays, including nested arrays
 - functions, showing their body including linebreaks
 - And of course tables can be nested within tables

#### Example 1
```javascript
customers.toString();

//   | Customer ID | Country | Revenue |
//   | ----------- | ------- | ------- |
//  1| 1           | GB      | 19.99   |
//  2| 2           | GB      | 28.5    |
//  3| 3           | DE      | 113.5   |
//  4| 4           | GB      | 23      |
//  5| 5           | FR      | 54      |
//  6| 6           | GB      | 89.99   |
//  7| 7           | FR      | 23.1    |
//  8| 8           | XX      | 90      |
//  9| 9           | GB      | 0.1     |
// 10| 10          | DE      | 5       |
```


#### Example 2
```javascript
JSplyr.createTable({
  a: [1, "string", function(x) {return x*2}],
  b: [["Arrays", "work", "too", ["even", "nested"]],
      JSplyr.createTable({nested: ["work"],
                          "tables": ["too"]}),
      "Oh\n\n\did someone say\nline\nbreak?"]
}).toString();

//  | a                         | b                               |
//  | ------------------------- | ------------------------------- |
// 1| 1                         | [Arrays,work,too,[even,nested]] |
// 2| string                    |  | nested | tables |            |
//  |                           |  | ------ | ------ |            |
//  |                           | 1| work   | too    |            |
//  |                           |                                 |
// 3| function (x) {return x*2} | Oh                              |
//  |                           |                                 |
//  |                           | did someone say                 |
//  |                           | line                            |
//  |                           | break?                          |
````

## JSplyr expression constructors

### JSplyr.as
as is used to indicate that a field should carry a different alias in a select statement.

#### Arguments

<b>field:</b> The name of the field in the current table  
<b>alias:</b> The name the field should have in the new resulting table


### JSplyr.fun
fun is used to indicate a scalar function to be applied to a row

#### Arguments

<b>fun:</b> The function to be applied to each row  
<b>alias:</b> The name the field containing result should have in the resulting table  
<b>...:</b> Arguments supplied to the function in order of the declaration. If an argument supplied is a string that exists as a field name in the table then the field in the table is referenced. Otherwise the argument is taken as is.

### JSplyr.comp
Creates a comparison between two fields

#### Arguments

<b>lop:</b> The left hand operand. This can be either a string with a field name as it exists in the current table or a fun object.  
<b>op:</b> Thee operand. This is either a string that is any of: ==, ===, !=, !==, >, <, >=, or <= to execute the expected comparison as a javascript one or it can be a function taking two arguments or it can be field name. If it is a field name every row of the table must contain a function that takes two arguments.  
<b>rop:</b> The right hand side operant, the same rules apply as for lop.

### JSplyr.and
A logical combination of the AND type of 0 or more logical comparisons and/or combinations

#### Arguments
<b>...:</b> 0 or more logical comparisons and/or combinations

### JSplyr.or
A logical combination of the OR type of 0 or more logical comparisons and/or combinations

#### Arguments
<b>...:</b> 0 or more logical comparisons and/or combinations


### JSplyr.not
A logical combination of the NOT type of a logical comparison or combination

#### Arguments

<b>comp:</b> A logical comparison or combination

### JSplyr.asc
An instruction to order by a field ascendingly

#### Arguments

<b>field:</b> The name of a field or a fun object.

### JSplyr.desc
An instruction to order by a field descendingly

#### Arguments

<b>field:</b> The name of a field or a fun object.

## JSplyr auxilliary functions

### JSplyr.range

A python style range function that generates an array of numbers up to but not inclusing the limit.

#### Arguments

<b>a:</b> The value to iterate to 0 from is it is the only argument provided, otherwise the value to start from.  
<b>b:</b> The value to iterate to  
<b>c:</b> The size of the steps to be taken, default is 1, can be negative

#### Example
```javascript
JSplyr.range(7);          // Returns [0,1,2,3,4,5,6]
JSplyr.range(3,10);       // Returns [3,4,5,6,7,8,9]
JSplyr.range(8, 10, 0.5); // Returns [8, 8.5, 9, 9.5]
```

### JSplyr.isObject
Checks if a variable is a JSplyr object and optionally if it is of a certain JSplyr type.

#### Argumnts

<b>object:</b> The object in questions. If this is the only parameter provided the function will check if the object is a JSplyr Object.  
<b>name:</b> The name of the JSplyr object. If an object is a JSplr object its name property will be checked if this paraemter is provided.

### JSplyr.objectToArray
Transforms an array like object into an actual array. Can be used to convert the parameters provided to a function into an array e.g. to be used with apply.

#### Arguments

<b>object:</b> The object to be converted into an array

### JSplyr.multiSubscript
Subsets multiple arrays by the same index

#### Arguments

<b>index</b> The 0-based index.
<b>...</b> 0 or more Arrays

#### Example

```javascript
JSplyr.multiSubscript(1, [1, 2, 3], [4, 5, 6]);
// Returns: [2,5]
```

### JSplyr.both
Whether two elements are both true.
To be used in functional programming pipelines, e.g. Array.prototype.reduce

#### Arguments

<b>a</b> A boolean
<b>b</b> A boolean

#### Example

```javascript
JSplyr.both(true, false);
// Returns: false
```

### JSplyr.all
Whether all elements in an array are true.

#### Arguments

<b>v</b> An array

#### Example

```javascript
JSplyr.all([true, true, false]);
// Returns: false
```

### JSplyr.arrayAnd
Entry-wise logical and of one or more arrays

#### Arguments

<b>...:</b> One or more Arrays whose joint truthiness will be evaluated

#### Example

```javascript
JSplyr.arrayAnd([true, true, true], [true, false, false], [true, false, true]);
// Returs: [true, false, false]
```

### JSplyr.arrayOr
Entry-wise logical or of one or more arrays

#### Arguments

<b>...:</b> One or more Arrays whose joint truthiness will be evaluated

### JSplyr.arrayNot
The logical not of an array of values.

#### Arguments
<b>x:</b> The array whose elements should be negated.

### JSplyr.evaluateLogicalCombination
Applies a logical combination or comparison to a table and returns an array of the rows meeting the criteria

#### Arguments
<b>comb</b>: A logical combination or a logical comparison  
<b>target</b>: The target table comb is to beevaluated for

### JSplyr.createOutput
Creates an Object with the fieldnames provided containing empty arrays.

#### Arguments
<b>fields</b>: An array of field names

### JSplyr.isIn
Whether an element in a vector

#### Arguments
<b>x</b>: The value to be found  
<b>y</b>: The array to look up x in

### JSplyr.unique
Returns Unique values from an array

#### Arguments
<b>a</b>: The array to be deduped

### JSplyr.repeat
Repeats a value x n times, returns an array

#### Arguments
<b>x</b>: The value to be repeated  
<b>n</b>: The number of times the value shall be repeated

#### Example
```javascript
JSplyr.repeat("Hello", 3); // Returns ["Hello", "Hello", "Hello"]
```

### JSplyr.repeatString
Repeats a value n times and returns a stirng

#### Arguments
<b>str</b>: The string (or value that will be coerced) tha is to be repeated  
<b>n</b>: The number of repetitions  
<b>joinkey</b>: (Optional) The separator between the repetitions defaults to `""`

#### Example
```javascript
"Ba" + JSplyr.repeatString("na", 2); // Returns "Banana"
```

### JSplyr.equalArrays
Tests recursively whether two arrays have the same values in the same order

#### Arguments
<b>a1</b>: Array 1  
<b>a2</b>: Array 2


## Table auxilliary methods

### rankOrder
Returns an array of the ascending rank  of the field values within the table.

#### Arguments
<b>field:</b> The field whose values are to rank
<b>dense</b> Whether ties should be returned by themselves or whether each rank shouls be its own arrays with ties having multiple elements.


### is
Is takes a logical comparison or combination and returns an array of true false values indicating whether a row of the table matches the criteria provided.

#### Arguments
<b>comp:</b> A logical comparison or combination object.

### toMatrix
Creates a two dimensional array (An array of arrays) from the table.
Every element of the array will be an array representing a row.
The inner arrays have an element per column within that row.

```javascript
customers.toMatrix();

// [["Customer ID", "Coutry", "Revenue"]]
```

### getFields
Gets the field names of the table in an array

#### Example
```javascript
customers.getFields();

// [ [ 'Customer ID', 'Country', 'Revenue' ],
//   [ 1, 'GB', 19.99 ],
//   [ 2, 'GB', 28.5 ],
//   [ 3, 'DE', 113.5 ],
//   [ 4, 'GB', 23 ],
//   [ 5, 'FR', 54 ],
//   [ 6, 'GB', 89.99 ],
//   [ 7, 'FR', 23.1 ],
//   [ 8, 'XX', 90 ],
//   [ 9, 'GB', 0.1 ],
//   [ 10, 'DE', 5 ] ]
```

### rows
Returns the number of rows of the table

### cols
Returns the numbers of columns in the table

### getRow
Returns the values of the i-th row (0 based_ in an array)

#### Arguments
<b>row</b>:The 0-based Row number

#### Example
```javascript
customers.getRow(2);

// [3, "DE", 113.5]
```

### getRowObject
Returns a dictionary of the row with the field names as headers and the row values as values.

#### Arguments
<b>row</b>:The 0-based Row number

#### Example
```javascript
customers.getRowObject(2)

// {"Customer ID": 3, "Country":"DE", "Revenue": 113.5}
```

### table (Object)
The actual table object. contains the field names as keys and the values as arrays.
