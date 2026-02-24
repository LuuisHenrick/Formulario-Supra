// ===================================================
// SUPRA Forms — Admin Page Logic
// ===================================================

import {
    getFields, addField, updateField, deleteField, reorderFields,
    getResponses, clearResponses, exportToCSV
} from './store.js';

// ---------- DOM Refs ----------
const tabEditor = document.getElementById('tabEditor');
const tabResponses = document.getElementById('tabResponses');
const editorContent = document.getElementById('editorContent');
const responsesContent = document.getElementById('responsesContent');
const fieldsList = document.getElementById('fieldsList');
const emptyState = document.getElementById('emptyState');
const previewForm = document.getElementById('previewForm');
const responseBadge = document.getElementById('responseBadge');
const responseCount = document.getElementById('responseCount');
const responsesTableWrap = document.getElementById('responsesTableWrap');
const emptyResponses = document.getElementById('emptyResponses');

// Modal
const fieldModal = document.getElementById('fieldModal');
const modalTitle = document.getElementById('modalTitle');
const fieldForm = document.getElementById('fieldForm');
const fieldId = document.getElementById('fieldId');
const fieldType = document.getElementById('fieldType');
const fieldLabel = document.getElementById('fieldLabel');
const fieldPlaceholder = document.getElementById('fieldPlaceholder');
const fieldRequired = document.getElementById('fieldRequired');
const fieldOptions = document.getElementById('fieldOptions');
const optionsGroup = document.getElementById('optionsGroup');

// Confirm modal
const confirmModal = document.getElementById('confirmModal');
const confirmText = document.getElementById('confirmText');
let confirmCallback = null;

// Toast
const toastContainer = document.getElementById('toastContainer');

// ---------- Tabs ----------
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    if (tabName === 'editor') {
        tabEditor.classList.add('active');
        editorContent.classList.add('active');
    } else {
        tabResponses.classList.add('active');
        responsesContent.classList.add('active');
        renderResponses();
    }
}

tabEditor.addEventListener('click', () => switchTab('editor'));
tabResponses.addEventListener('click', () => switchTab('responses'));

// ---------- Toast ----------
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ---------- Confirm ----------
function showConfirm(text, callback) {
    confirmText.textContent = text;
    confirmCallback = callback;
    confirmModal.classList.add('show');
}

document.getElementById('btnConfirmOk').addEventListener('click', () => {
    confirmModal.classList.remove('show');
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
});
document.getElementById('btnConfirmCancel').addEventListener('click', () => {
    confirmModal.classList.remove('show');
    confirmCallback = null;
});
document.getElementById('confirmClose').addEventListener('click', () => {
    confirmModal.classList.remove('show');
    confirmCallback = null;
});

// ---------- Field Type Labels ----------
const FIELD_TYPE_LABELS = {
    text: 'Texto Curto',
    email: 'E-mail',
    phone: 'Telefone',
    number: 'Número',
    date: 'Data',
    textarea: 'Texto Longo',
    select: 'Seleção',
    radio: 'Escolha Única',
    checkbox: 'Múltipla Escolha',
};

// ---------- Render Fields List ----------
let dragSrcIndex = null;

function renderFieldsList() {
    const fields = getFields();
    fieldsList.innerHTML = '';
    emptyState.style.display = fields.length === 0 ? 'flex' : 'none';

    fields.forEach((field, index) => {
        const item = document.createElement('div');
        item.className = 'field-item';
        item.draggable = true;
        item.dataset.index = index;
        item.innerHTML = `
      <div class="field-drag-handle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>
      </div>
      <div class="field-info">
        <div class="field-label-text">${escapeHtml(field.label)}</div>
        <div class="field-type-badge">
          ${FIELD_TYPE_LABELS[field.type] || field.type}
          ${field.required ? '<span class="required-dot"></span>' : ''}
        </div>
      </div>
      <div class="field-actions">
        <button class="btn-icon" data-action="edit" data-id="${field.id}" title="Editar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon danger" data-action="delete" data-id="${field.id}" title="Excluir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;

        // Drag & drop handlers
        item.addEventListener('dragstart', (e) => {
            dragSrcIndex = index;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.field-item').forEach(el => el.classList.remove('drag-over'));
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            item.classList.add('drag-over');
        });
        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            const toIndex = parseInt(item.dataset.index);
            if (dragSrcIndex !== null && dragSrcIndex !== toIndex) {
                reorderFields(dragSrcIndex, toIndex);
                renderFieldsList();
                renderPreview();
                showToast('Ordem atualizada', 'info');
            }
            dragSrcIndex = null;
        });

        // Action buttons
        item.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'edit') openEditModal(id);
            if (action === 'delete') {
                showConfirm('Tem certeza que deseja excluir este campo?', () => {
                    deleteField(id);
                    renderFieldsList();
                    renderPreview();
                    showToast('Campo excluído', 'success');
                });
            }
        });

        fieldsList.appendChild(item);
    });

    updateResponseBadge();
}

// ---------- Render Preview ----------
function renderPreview() {
    const fields = getFields();
    if (fields.length === 0) {
        previewForm.innerHTML = '<div class="preview-empty">Adicione campos para ver a pré-visualização</div>';
        return;
    }

    previewForm.innerHTML = fields.map(field => renderFieldHTML(field, true)).join('');
}

function renderFieldHTML(field, isPreview = false) {
    const req = field.required ? '<span class="required-mark">*</span>' : '';
    const disabled = isPreview ? 'disabled' : '';
    let inputHtml = '';

    switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'number':
        case 'date':
            const inputType = field.type === 'phone' ? 'tel' : field.type;
            inputHtml = `<input type="${inputType}" class="form-input" placeholder="${escapeHtml(field.placeholder || '')}" ${disabled} />`;
            break;
        case 'textarea':
            inputHtml = `<textarea class="form-input form-textarea" placeholder="${escapeHtml(field.placeholder || '')}" ${disabled}></textarea>`;
            break;
        case 'select':
            const opts = (field.options || []).map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
            inputHtml = `<select class="form-input" ${disabled}><option value="">Selecione...</option>${opts}</select>`;
            break;
        case 'radio':
            inputHtml = `<div class="options-group">${(field.options || []).map((o, i) => `
        <label class="option-item"><input type="radio" name="preview_${field.id}" value="${escapeHtml(o)}" ${disabled} />${escapeHtml(o)}</label>
      `).join('')}</div>`;
            break;
        case 'checkbox':
            inputHtml = `<div class="options-group">${(field.options || []).map((o, i) => `
        <label class="option-item"><input type="checkbox" value="${escapeHtml(o)}" ${disabled} />${escapeHtml(o)}</label>
      `).join('')}</div>`;
            break;
    }

    return `<div class="form-group"><label class="form-label">${escapeHtml(field.label)} ${req}</label>${inputHtml}</div>`;
}

// ---------- Modal ----------
document.getElementById('btnAddField').addEventListener('click', () => openAddModal());
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancelField').addEventListener('click', closeModal);

function openAddModal() {
    modalTitle.textContent = 'Adicionar Campo';
    fieldForm.reset();
    fieldId.value = '';
    optionsGroup.style.display = 'none';
    fieldModal.classList.add('show');
}

function openEditModal(id) {
    const field = getFields().find(f => f.id === id);
    if (!field) return;
    modalTitle.textContent = 'Editar Campo';
    fieldId.value = field.id;
    fieldType.value = field.type;
    fieldLabel.value = field.label;
    fieldPlaceholder.value = field.placeholder || '';
    fieldRequired.checked = field.required;
    fieldOptions.value = (field.options || []).join('\n');
    toggleOptionsGroup(field.type);
    fieldModal.classList.add('show');
}

function closeModal() {
    fieldModal.classList.remove('show');
}

// Show/hide options textarea
fieldType.addEventListener('change', () => {
    toggleOptionsGroup(fieldType.value);
});

function toggleOptionsGroup(type) {
    const needsOptions = ['select', 'radio', 'checkbox'].includes(type);
    optionsGroup.style.display = needsOptions ? 'block' : 'none';
}

// Save field
fieldForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = fieldType.value;
    const label = fieldLabel.value.trim();
    const placeholder = fieldPlaceholder.value.trim();
    const required = fieldRequired.checked;
    const options = ['select', 'radio', 'checkbox'].includes(type)
        ? fieldOptions.value.split('\n').map(o => o.trim()).filter(Boolean)
        : [];

    if (!label) return;

    const id = fieldId.value;
    if (id) {
        updateField(id, { type, label, placeholder, required, options });
        showToast('Campo atualizado', 'success');
    } else {
        addField({ type, label, placeholder, required, options });
        showToast('Campo adicionado', 'success');
    }

    closeModal();
    renderFieldsList();
    renderPreview();
});

// ---------- Responses Tab ----------
function renderResponses() {
    const fields = getFields();
    const responses = getResponses();
    const count = responses.length;

    responseBadge.textContent = count;
    responseCount.textContent = `${count} resposta${count !== 1 ? 's' : ''}`;

    emptyResponses.style.display = count === 0 ? 'flex' : 'none';
    responsesTableWrap.style.display = count === 0 ? 'none' : 'block';

    if (count === 0) return;

    let html = '<table class="responses-table"><thead><tr><th>#</th><th>Data</th>';
    fields.forEach(f => {
        html += `<th>${escapeHtml(f.label)}</th>`;
    });
    html += '</tr></thead><tbody>';

    responses.forEach((r, i) => {
        html += '<tr>';
        html += `<td>${i + 1}</td>`;
        html += `<td class="td-date">${new Date(r.submittedAt).toLocaleString('pt-BR')}</td>`;
        fields.forEach(f => {
            const val = r.data[f.id];
            const display = Array.isArray(val) ? val.join(', ') : (val || '—');
            html += `<td>${escapeHtml(String(display))}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    responsesTableWrap.innerHTML = html;
}

function updateResponseBadge() {
    const count = getResponses().length;
    responseBadge.textContent = count;
}

// Export CSV
document.getElementById('btnExportCSV').addEventListener('click', () => {
    const csv = exportToCSV();
    if (!csv) {
        showToast('Nenhuma resposta para exportar', 'error');
        return;
    }
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supra-forms-respostas-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado com sucesso', 'success');
});

// Clear responses
document.getElementById('btnClearResponses').addEventListener('click', () => {
    showConfirm('Tem certeza que deseja limpar todas as respostas? Esta ação não pode ser desfeita.', () => {
        clearResponses();
        renderResponses();
        showToast('Respostas limpas', 'success');
    });
});

// ---------- Utils ----------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------- Listen for storage changes (cross-tab) ----------
window.addEventListener('storage', () => {
    renderFieldsList();
    renderPreview();
    updateResponseBadge();
});

// ---------- Init ----------
renderFieldsList();
renderPreview();
updateResponseBadge();
