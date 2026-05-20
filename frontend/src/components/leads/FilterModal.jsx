import { useState, useEffect } from 'react';
import {
  FILTER_FIELDS,
  getOperatorsForField,
  getField,
  isMultiValueOperator
} from '../../config/leadFilterConfig';
import { settingsAPI, usersAPI } from '../../services/api';

export default function FilterModal({
  isOpen,
  onClose,
  currentRules,
  onApply,
  onReset
}) {
  // Each rule: { fieldKey, operatorKey, value }
  // value is string for single, array for multi
  const [rules, setRules] = useState([
    { fieldKey: '', operatorKey: '', value: '' }
  ]);

  // Cache for dropdown options
  const [optionsCache, setOptionsCache] = useState({});

  // Initialize from currentRules
  useEffect(() => {
    if (isOpen) {
      if (currentRules && currentRules.length > 0) {
        setRules(currentRules);
      } else {
        setRules([{ fieldKey: '', operatorKey: '', value: '' }]);
      }
    }
  }, [isOpen, currentRules]);

  // Load options for a dropdown field
  const loadOptions = async (sourceKey) => {
    if (optionsCache[sourceKey]) return optionsCache[sourceKey];

    try {
      let data = [];
      if (sourceKey === 'users') {
        const res = await usersAPI.getAll({ limit: 200 });
        data = res.data.map((u) => ({
          _id: u._id,
          name: `${u.name} (${u.employeeId})`
        }));
      } else {
        const res = await settingsAPI.getAll(sourceKey, { limit: 200 });
        data = res.data;
      }
      setOptionsCache((prev) => ({ ...prev, [sourceKey]: data }));
      return data;
    } catch (err) {
      console.error('Failed to load options:', err);
      return [];
    }
  };

  // Pre-load options for selected fields
  useEffect(() => {
    rules.forEach((rule) => {
      if (!rule.fieldKey) return;
      const field = getField(rule.fieldKey);
      if (field && field.type === 'dropdown' && field.source) {
        loadOptions(field.source);
      }
    });
  }, [rules]);

  // Field select - reset operator + value
  const handleFieldChange = (idx, fieldKey) => {
    setRules((prev) =>
      prev.map((r, i) =>
        i === idx ? { fieldKey, operatorKey: '', value: '' } : r
      )
    );
  };

  // Operator select - reset value (single → multi or vice versa)
  const handleOperatorChange = (idx, operatorKey) => {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const wasMulti = isMultiValueOperator(r.operatorKey);
        const isMulti = isMultiValueOperator(operatorKey);
        return {
          ...r,
          operatorKey,
          value: wasMulti !== isMulti ? (isMulti ? [] : '') : r.value
        };
      })
    );
  };

  // Value change
  const handleValueChange = (idx, value) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, value } : r))
    );
  };

  // Multi-value toggle (for In / Not In)
  const handleMultiValueToggle = (idx, optionValue) => {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const current = Array.isArray(r.value) ? r.value : [];
        const updated = current.includes(optionValue)
          ? current.filter((v) => v !== optionValue)
          : [...current, optionValue];
        return { ...r, value: updated };
      })
    );
  };

  // Add new row
  const handleAddRow = () => {
    setRules((prev) => [
      ...prev,
      { fieldKey: '', operatorKey: '', value: '' }
    ]);
  };

  // Remove row (min 1 row)
  const handleRemoveRow = (idx) => {
    if (rules.length === 1) {
      // Just clear it
      setRules([{ fieldKey: '', operatorKey: '', value: '' }]);
      return;
    }
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  // Apply - validate + send
  const handleApply = () => {
    // Filter out incomplete rules
    const validRules = rules.filter((r) => {
      if (!r.fieldKey || !r.operatorKey) return false;
      if (Array.isArray(r.value)) return r.value.length > 0;
      return r.value !== '' && r.value !== null;
    });
    onApply(validRules);
    onClose();
  };

  // Reset all
  const handleReset = () => {
    const empty = [{ fieldKey: '', operatorKey: '', value: '' }];
    setRules(empty);
    onReset();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content filter-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Filter</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body filter-modal-body">
          {rules.map((rule, idx) => (
            <FilterRow
              key={idx}
              rule={rule}
              optionsCache={optionsCache}
              onFieldChange={(val) => handleFieldChange(idx, val)}
              onOperatorChange={(val) => handleOperatorChange(idx, val)}
              onValueChange={(val) => handleValueChange(idx, val)}
              onMultiValueToggle={(val) => handleMultiValueToggle(idx, val)}
              onRemove={() => handleRemoveRow(idx)}
              onAdd={handleAddRow}
              isLastRow={idx === rules.length - 1}
            />
          ))}
        </div>

        <div className="modal-footer filter-modal-footer">
          <button
            type="button"
            className="settings-btn-secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== FilterRow Component ==============

function FilterRow({
  rule,
  optionsCache,
  onFieldChange,
  onOperatorChange,
  onValueChange,
  onMultiValueToggle,
  onRemove,
  onAdd,
  isLastRow
}) {
  const field = rule.fieldKey ? getField(rule.fieldKey) : null;
  const operatorGroups = rule.fieldKey
    ? getOperatorsForField(rule.fieldKey)
    : [];
  const isMulti = isMultiValueOperator(rule.operatorKey);
  const options =
    field && field.source ? optionsCache[field.source] || [] : [];

  return (
    <div className="filter-row">
      {/* Column 1: Field dropdown */}
      <select
        className="filter-select"
        value={rule.fieldKey}
        onChange={(e) => onFieldChange(e.target.value)}
      >
        <option value="">Select</option>
        {FILTER_FIELDS.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Column 2: Operator dropdown (grouped) */}
      <select
        className="filter-select"
        value={rule.operatorKey}
        onChange={(e) => onOperatorChange(e.target.value)}
        disabled={!rule.fieldKey}
      >
        <option value="">Select</option>
        {operatorGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.operators.map((op) => (
              <option key={op.key} value={op.key}>
                {op.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Column 3: Value input (dynamic based on field type + operator) */}
      <div className="filter-value-wrapper">
        <ValueInput
          field={field}
          operatorKey={rule.operatorKey}
          value={rule.value}
          options={options}
          isMulti={isMulti}
          onChange={onValueChange}
          onMultiToggle={onMultiValueToggle}
        />
      </div>

      {/* Row controls: − + */}
      <div className="filter-row-controls">
        <button
          type="button"
          className="filter-icon-btn"
          onClick={onRemove}
          title="Remove"
        >
          −
        </button>
        <button
          type="button"
          className="filter-icon-btn"
          onClick={onAdd}
          title="Add another filter"
          disabled={!isLastRow}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ============== ValueInput Component ==============

function ValueInput({
  field,
  operatorKey,
  value,
  options,
  isMulti,
  onChange,
  onMultiToggle
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!field || !operatorKey) {
    return (
      <input
        type="text"
        className="filter-input"
        placeholder="Filter Values"
        disabled
        value=""
      />
    );
  }

  // Multi-value (In / Not In) - checkbox dropdown
  if (isMulti && field.type === 'dropdown') {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div className="filter-multi-wrapper">
        <button
          type="button"
          className="filter-input filter-multi-trigger"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {selected.length === 0
            ? 'Filter Values'
            : `${selected.length} selected`}
          <span className="filter-chevron">{dropdownOpen ? '▲' : '▼'}</span>
        </button>

        {dropdownOpen && (
          <>
            <div
              className="filter-multi-backdrop"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="filter-multi-menu">
              {options.length === 0 ? (
                <div className="filter-multi-empty">Loading...</div>
              ) : (
                options.map((opt) => {
                  const isChecked = selected.includes(opt.name);
                  return (
                    <label key={opt._id} className="filter-multi-option">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onMultiToggle(opt.name)}
                      />
                      <span>{opt.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="filter-chips">
            {selected.map((val) => (
              <span key={val} className="filter-chip">
                {val}
                <button
                  type="button"
                  onClick={() => onMultiToggle(val)}
                  className="filter-chip-x"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single dropdown value
  if (field.type === 'dropdown' && !isMulti) {
    return (
      <select
        className="filter-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Filter Values</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt.name}>
            {opt.name}
          </option>
        ))}
      </select>
    );
  }

  // Number
  if (field.type === 'number') {
    return (
      <input
        type="number"
        className="filter-input"
        placeholder="Filter Values"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        min="0"
      />
    );
  }

  // Date
  if (field.type === 'date') {
    return (
      <input
        type="date"
        className="filter-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // Text (default)
  return (
    <input
      type="text"
      className="filter-input"
      placeholder="Filter Values"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}