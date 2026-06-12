function defineModel(definition) {
  const columns = Object.freeze(definition.columns.map((column) => Object.freeze({ ...column })));
  const columnsByAttribute = Object.freeze(
    columns.reduce((acc, column) => {
      acc[column.attribute] = column;
      return acc;
    }, {})
  );
  const columnsByName = Object.freeze(
    columns.reduce((acc, column) => {
      acc[column.name] = column;
      return acc;
    }, {})
  );

  function mapRow(row) {
    if (!row) {
      return null;
    }

    return columns.reduce((mapped, column) => {
      mapped[column.attribute] = row[column.name];
      return mapped;
    }, {});
  }

  return Object.freeze({
    ...definition,
    columns,
    columnsByAttribute,
    columnsByName,
    columnNames: Object.freeze(columns.map((column) => column.name)),
    attributes: Object.freeze(columns.map((column) => column.attribute)),
    mapRow,
  });
}

module.exports = defineModel;
