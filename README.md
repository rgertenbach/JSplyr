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
___
## 1. JSplyr Table constructors
JSplyr has two table constructors

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

**data: ** A two dimensional array, aka an array containing arrays of equal length where each array is a row and each element is a column within that row.

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


## 2. Table methods and attributes
A JSplyr table object has a list of methods that should be familiar to users of SQL and dplyr.
SQL users may be thinking it lacks some functionality of SQL, but the ability to easily chain commans and powerful scalar function allow it be just as if not more expressive as SQL in some ways.

Each of these methods return a table itself which contains the same methods.

### 2.1. select()

Select returns a table containing the selection of columns of the table that it was used on.

 #### Arguments

 ...: 0 or more arguments that create a field.
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

<b>criterion:</b> An arrray with the same length as the number of rows in the table. The values are interpreted for their truthiness. Values stay if they are truthy and get removed if theu are falsy.

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
<b>method:</b> The join method
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
