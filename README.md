# JSplyr
JS plyr is a Javascript library that allows you to work with Table like objects.

## Content

 1. JSplyr Table Constructors
   1. createTable
   2. createTableFromMatrix
 2. Table methods and attributes
   1. select
   2. limit
   3. filter
   4. where
   5. group_by
   6. flatten
   7. union
   8. join
   9. order_by
   10. table
   11. rows
   12. getFields
   13. toMatrix
   14. is
   15. rank
 3. JSplyr expression constructors
   1. as
   2. fun
   3. comp
   4. and
   5. or
   6. not
   7. asc
   7. desc
 4. JSplyr auxilliary functions
   1. range
   2. isObject
   3. objectToArray
   4. arrayAnd
   5. arrayOr
   6. arrayNot

## 1. JSplyr Table constructors
JSplyr has two table constructors

### createTable
createTable takes an object as its argument and returns a table object.
The object's values need to be arrays that all have the same length.

**Example:**
```javascript
var customerData = {
  "Customer ID": [1,    2,     3,     4,    5,      6,    7,    8,    9,    10],
  "Country":     ["GB", "GB",  "DE",  "GB", "FR",   "GB", "FR", "XX", "GB", "DE"],
  "Revenue":     [19.99, 28.5, 113.5, 23,54, 89.99, 23.1, 90,   0.1,   5,   4.99]
};

var customers = JSplyr.createTable(customerData);
```

### 1.2. createTableFromMatrix
createTableFromMatrix creates a table object from a two dimensional array.
Each array within the top array is a row with every element of those arrays being a column's cell within that row.
This format of data is for example used when values are retrieved from Google Spreadsheets.

**Example:**
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
___

## 2. Table methods and attributes
A JSplyr table object has a list of methods that should be familiar to users of SQL and dplyr.
SQL users may be thinking it lacks some functionality of SQL, but the ability to easily chain commans and powerful scalar function allow it be just as if not more expressive as SQL in some ways.

Each of these methods return a table itself which contains the same methods.

### 2.1. select()
Select returns a table containing the selection of columns of the table that it was used on.
These columns can be:
 - A column from the source table, called with a string containing the column name.
 - A column that has been given an alias by using JSplyr.as().
 - A calculated column that is an application of a function using JSplyr.fun() whose arguments can be column names.

 **Example:**
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

### filter
filter filters a table based on an array of truthy or falsy values.
If a value is truthy the row is in the final output;

**Example:**
```javascript
var mySelection = customers.filter([true, true, true, true, true]);
```

### where
Where is the sql familiar clause.
A where clause takes either:
 - A comparison object or
 - A logical combination of comparison objects.

**Example:**
```javascript
var highSpendersFromGb = customers.where(
    JSplyr.and(
        JSplyr.comp("Revenue", ">", 50),
        JSplyr.comp("GB", "===", "Country")));
```

### group_by
### flatten
### limit
### join
### union
### order_by
## JSplyr expression constructors

### JSplyr.as
### JSplyr.fun
### JSplyr.comp
### JSplyr.an##d
### JSplyr.or
### JSpyyr.not
### JSplyr.asc
### JSplyr.desc

## JSplyr auxilliary functions
### JSplyr.range
### JSplyr.isObject
### JSplyr.objectToArray
### JSplyr.arrayAnd
### JSplyr.arrayOr
### JSplyr.arrayNot

## Table auxilliary methods
### rank
### is
### toMatrix
### getFields
### rows
### table (Object)
