import CqlValue from "../value";

function valueType() {
  return CqlValue;
}

function getDefaultValue(queryable) {
  return CqlValue.create(queryable.defaultValue);
}

// Adds what the search form needs to an operator class of the CQL2 library
export default function withFormSupport(Operator) {
  return class extends Operator {

    static valueType = valueType;

    static getDefaultValue = getDefaultValue;

    static get description() {
      return "";
    }

    static get label() {
      return this.SYMBOL;
    }

    static get longLabel() {
      return this.label;
    }

  };
}
