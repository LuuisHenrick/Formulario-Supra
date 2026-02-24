// ===================================================
// SUPRA Forms — Public Form Logic
// ===================================================

import { getFields, addResponse } from './store.js';

// ---------- DOM Refs ----------
const publicForm = document.getElementById('publicForm');
const noFieldsMsg = document.getElementById('noFieldsMsg');
const formCard = document.getElementById('formCard');
const successOverlay = document.getElementById('successOverlay');

// ---------- Render Form ----------
function renderForm() {
    const fields = getFields();

    if (fields.length === 0) {
        publicForm.style.display = 'none';
        noFieldsMsg.style.display = 'flex';
        return;
    }

    publicForm.style.display = 'block';
    noFieldsMsg.style.display = 'none';

    let html = '';
    fields.forEach(field => {
        html += renderFieldHTML(field);
    });

    html += `
    <button type="submit" class="btn-submit" id="btnSubmit">
      <span class="btn-text">Enviar Resposta</span>
      <span class="spinner"></span>
    </button>
  `;

    publicForm.innerHTML = html;
}

function renderFieldHTML(field) {
    const req = field.required ? '<span class="required-mark">*</span>' : '';
    let inputHtml = '';

    switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
        case 'date':
            inputHtml = `<input type="${field.type}" class="form-input" name="${field.id}" 
        placeholder="${escapeHtml(field.placeholder || '')}" 
        ${field.required ? 'required' : ''} />`;
            break;
        case 'phone':
            inputHtml = `<input type="tel" class="form-input" name="${field.id}" 
        placeholder="${escapeHtml(field.placeholder || '')}" 
        ${field.required ? 'required' : ''} />`;
            break;
        case 'textarea':
            inputHtml = `<textarea class="form-input form-textarea" name="${field.id}" 
        placeholder="${escapeHtml(field.placeholder || '')}" 
        ${field.required ? 'required' : ''}></textarea>`;
            break;
        case 'select':
            const opts = (field.options || []).map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
            inputHtml = `<select class="form-input" name="${field.id}" ${field.required ? 'required' : ''}>
        <option value="">Selecione...</option>${opts}</select>`;
            break;
        case 'radio':
            inputHtml = `<div class="options-group" data-name="${field.id}">${(field.options || []).map(o => `
        <label class="option-item">
          <input type="radio" name="${field.id}" value="${escapeHtml(o)}" />
          ${escapeHtml(o)}
        </label>
      `).join('')}</div>`;
            break;
        case 'checkbox':
            inputHtml = `<div class="options-group" data-name="${field.id}">${(field.options || []).map(o => `
        <label class="option-item">
          <input type="checkbox" name="${field.id}" value="${escapeHtml(o)}" />
          ${escapeHtml(o)}
        </label>
      `).join('')}</div>`;
            break;
    }

    return `
    <div class="form-group" data-field-id="${field.id}">
      <label class="form-label">${escapeHtml(field.label)} ${req}</label>
      ${inputHtml}
      <div class="field-error" id="error_${field.id}">Este campo é obrigatório</div>
    </div>
  `;
}

// ---------- Validation ----------
function validateForm() {
    const fields = getFields();
    let isValid = true;

    fields.forEach(field => {
        const errorEl = document.getElementById(`error_${field.id}`);
        if (!errorEl) return;

        let value = getFieldValue(field);
        let hasError = false;

        if (field.required) {
            if (field.type === 'checkbox') {
                hasError = !value || value.length === 0;
            } else {
                hasError = !value || (typeof value === 'string' && !value.trim());
            }
        }

        // Email validation
        if (!hasError && field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                hasError = true;
                errorEl.textContent = 'E-mail inválido';
            } else {
                errorEl.textContent = 'Este campo é obrigatório';
            }
        }

        if (hasError) {
            isValid = false;
            errorEl.classList.add('show');
            const input = document.querySelector(`[name="${field.id}"]`);
            if (input) input.classList.add('invalid');
        } else {
            errorEl.classList.remove('show');
            const input = document.querySelector(`[name="${field.id}"]`);
            if (input) input.classList.remove('invalid');
        }
    });

    return isValid;
}

function getFieldValue(field) {
    if (field.type === 'checkbox') {
        const checks = document.querySelectorAll(`[name="${field.id}"]:checked`);
        return Array.from(checks).map(c => c.value);
    }
    if (field.type === 'radio') {
        const radio = document.querySelector(`[name="${field.id}"]:checked`);
        return radio ? radio.value : '';
    }
    const input = document.querySelector(`[name="${field.id}"]`);
    return input ? input.value : '';
}

// ---------- Real-time Validation ----------
publicForm.addEventListener('input', (e) => {
    const group = e.target.closest('.form-group');
    if (!group) return;
    const fieldId = group.dataset.fieldId;
    const errorEl = document.getElementById(`error_${fieldId}`);
    if (errorEl && errorEl.classList.contains('show')) {
        errorEl.classList.remove('show');
        e.target.classList.remove('invalid');
    }
});

publicForm.addEventListener('change', (e) => {
    const group = e.target.closest('.form-group');
    if (!group) return;
    const fieldId = group.dataset.fieldId;
    const errorEl = document.getElementById(`error_${fieldId}`);
    if (errorEl && errorEl.classList.contains('show')) {
        errorEl.classList.remove('show');
    }
});

// ---------- Submit ----------
publicForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const fields = getFields();
    const data = {};
    fields.forEach(field => {
        data[field.id] = getFieldValue(field);
    });

    // Simulate loading
    const btn = document.getElementById('btnSubmit');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        addResponse(data);
        btn.classList.remove('loading');
        btn.disabled = false;

        // Show success
        formCard.style.display = 'none';
        successOverlay.classList.add('show');

        // Confetti effect
        createConfetti();
    }, 800);
});

// ---------- New Response ----------
document.getElementById('btnNewResponse').addEventListener('click', () => {
    successOverlay.classList.remove('show');
    formCard.style.display = 'block';
    publicForm.reset();
    // Re-render to reset state
    renderForm();
});

// ---------- Confetti ----------
function createConfetti() {
    const colors = ['#00E5FF', '#00FF85', '#BF5AF2', '#FFD60A', '#FF453A'];
    const container = document.body;

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
      position: fixed;
      width: ${Math.random() * 8 + 4}px;
      height: ${Math.random() * 8 + 4}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      z-index: 200;
      pointer-events: none;
      animation: confettiFall ${Math.random() * 2 + 1.5}s ease-out forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }

    // Add keyframes if not present
    if (!document.getElementById('confettiStyle')) {
        const style = document.createElement('style');
        style.id = 'confettiStyle';
        style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
        100% { transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg) scale(0.3); opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }
}

// ---------- Utils ----------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------- Init ----------
renderForm();
