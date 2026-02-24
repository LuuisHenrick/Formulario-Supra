// ===================================================
// SUPRA Forms — LocalStorage Data Store
// ===================================================

const FIELDS_KEY = 'supra_form_fields';
const RESPONSES_KEY = 'supra_form_responses';

function generateId() {
  return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Fields ----------

export function getFields() {
  try {
    return JSON.parse(localStorage.getItem(FIELDS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveFields(fields) {
  localStorage.setItem(FIELDS_KEY, JSON.stringify(fields));
  window.dispatchEvent(new CustomEvent('fieldsUpdated'));
}

export function addField(field) {
  const fields = getFields();
  field.id = generateId();
  fields.push(field);
  saveFields(fields);
  return field;
}

export function updateField(id, updates) {
  const fields = getFields();
  const idx = fields.findIndex(f => f.id === id);
  if (idx !== -1) {
    fields[idx] = { ...fields[idx], ...updates };
    saveFields(fields);
    return fields[idx];
  }
  return null;
}

export function deleteField(id) {
  const fields = getFields().filter(f => f.id !== id);
  saveFields(fields);
}

export function reorderFields(fromIndex, toIndex) {
  const fields = getFields();
  const [moved] = fields.splice(fromIndex, 1);
  fields.splice(toIndex, 0, moved);
  saveFields(fields);
}

// ---------- Responses ----------

export function getResponses() {
  try {
    return JSON.parse(localStorage.getItem(RESPONSES_KEY)) || [];
  } catch {
    return [];
  }
}

export function addResponse(data) {
  const responses = getResponses();
  responses.push({
    id: generateId(),
    data,
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  return responses;
}

export function clearResponses() {
  localStorage.removeItem(RESPONSES_KEY);
}

export function exportToCSV() {
  const fields = getFields();
  const responses = getResponses();
  if (!responses.length || !fields.length) return '';

  const headers = ['Data de Envio', ...fields.map(f => f.label)];
  const rows = responses.map(r => {
    const date = new Date(r.submittedAt).toLocaleString('pt-BR');
    const values = fields.map(f => {
      const val = r.data[f.id];
      if (Array.isArray(val)) return val.join('; ');
      return val || '';
    });
    return [date, ...values];
  });

  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  return csv;
}
