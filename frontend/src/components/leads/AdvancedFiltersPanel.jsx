// Field config for Leads Filter Modal
// Each field has: label, dbField, type (text/dropdown/number/date), source (for dropdown options)

export const FILTER_FIELDS = [
  {
    key: 'department',
    label: 'Department',
    dbField: 'inquiredFor',
    type: 'dropdown',
    source: 'university' // settings type
  },
  {
    key: 'category',
    label: 'Category',
    dbField: 'program',
    type: 'dropdown',
    source: 'category'
  },
  {
    key: 'specialization',
    label: 'Specialization',
    dbField: 'category',
    type: 'dropdown',
    source: 'course'
  },
  {
    key: 'stage',
    label: 'Stage',
    dbField: 'stage',
    type: 'dropdown',
    source: 'stage'
  },
  {
    key: 'reason',
    label: 'Reason',
    dbField: 'stageNote',
    type: 'dropdown',
    source: 'reason'
  },
  {
    key: 'source',
    label: 'Source',
    dbField: 'source',
    type: 'dropdown',
    source: 'source'
  },
  {
    key: 'subSource',
    label: 'Sub-Source',
    dbField: 'sourceNote',
    type: 'dropdown',
    source: 'subsource'
  },
  {
    key: 'user',
    label: 'User',
    dbField: 'assignedTo',
    type: 'dropdown',
    source: 'users'
  },
  {
    key: 'totalCalls',
    label: 'Total Call Attempts',
    dbField: 'callCount',
    type: 'number'
  },
  {
    key: 'createdOn',
    label: 'Created On',
    dbField: 'createdAt',
    type: 'date'
  },
  {
    key: 'updatedOn',
    label: 'Updated On',
    dbField: 'updatedAt',
    type: 'date'
  }
];

// Operators grouped (image 2 jaisa exact)
export const OPERATOR_GROUPS = [
  {
    label: 'Single Keyword',
    operators: [
      { key: 'eq', label: 'Equal to' },
      { key: 'neq', label: 'Not Equal to' },
      { key: 'lt', label: 'Less than' },
      { key: 'gt', label: 'Greater than' },
      { key: 'lte', label: 'Less or Equal to' },
      { key: 'gte', label: 'Greater or Equal to' }
    ]
  },
  {
    label: 'Multiple Keyword',
    operators: [
      { key: 'in', label: 'In' },
      { key: 'nin', label: 'Not In' }
    ]
  },
  {
    label: 'Search your own keywords',
    operators: [
      { key: 'prefix', label: 'Has Prefix' },
      { key: 'suffix', label: 'Has Suffix' },
      { key: 'contains', label: 'Contains' },
      { key: 'ncontains', label: 'Not Contains' }
    ]
  }
];

// Which operators are available for which field type
export const FIELD_TYPE_OPERATORS = {
  text: ['eq', 'neq', 'contains', 'ncontains', 'prefix', 'suffix'],
  dropdown: ['eq', 'neq', 'in', 'nin'],
  number: ['eq', 'neq', 'lt', 'gt', 'lte', 'gte', 'in', 'nin'],
  date: ['eq', 'lt', 'gt', 'lte', 'gte']
};

// Helper: get available operators for a field
export const getOperatorsForField = (fieldKey) => {
  const field = FILTER_FIELDS.find((f) => f.key === fieldKey);
  if (!field) return [];

  const allowed = FIELD_TYPE_OPERATORS[field.type] || [];

  // Filter OPERATOR_GROUPS to only include allowed
  return OPERATOR_GROUPS.map((group) => ({
    ...group,
    operators: group.operators.filter((op) => allowed.includes(op.key))
  })).filter((group) => group.operators.length > 0);
};

// Helper: get field by key
export const getField = (key) => FILTER_FIELDS.find((f) => f.key === key);

// Helper: check if operator needs multi-value (e.g. "In", "Not In")
export const isMultiValueOperator = (operatorKey) => {
  return operatorKey === 'in' || operatorKey === 'nin';
};