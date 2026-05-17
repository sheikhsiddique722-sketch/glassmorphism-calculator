/* ===========================================
   Glass Calculator – Logic
   Beginner-friendly, well-commented JavaScript
=========================================== */

// Grab the elements we'll update
const resultEl  = document.getElementById('result');
const historyEl = document.getElementById('history');
const buttons   = document.querySelectorAll('.btn');

// Calculator state
let currentValue  = '0';     // What's shown on screen right now
let previousValue = null;    // The number entered before an operator
let operator      = null;    // The pending operator: + − × ÷
let justEvaluated = false;   // True right after pressing "="

/* -------------------------------------------
   Update the display (and resize big numbers)
-------------------------------------------- */
function updateDisplay() {
  resultEl.textContent = formatNumber(currentValue);

  // Show pending operation in the history line
  if (previousValue !== null && operator !== null) {
    historyEl.textContent = `${formatNumber(previousValue)} ${operator}`;
  }

  // Shrink font size if the number gets too long
  resultEl.classList.remove('long', 'xlong');
  const len = resultEl.textContent.length;
  if (len > 12) resultEl.classList.add('xlong');
  else if (len > 8) resultEl.classList.add('long');
}

/* -------------------------------------------
   Format numbers with commas (e.g. 1,234.56)
-------------------------------------------- */
function formatNumber(value) {
  if (value === 'Error') return value;

  const str = String(value);
  const [intPart, decPart] = str.split('.');
  const formattedInt = Number(intPart).toLocaleString('en-US', {
    maximumFractionDigits: 0
  });

  // Preserve a trailing "." while the user is typing a decimal
  if (str.endsWith('.')) return formattedInt + '.';
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

/* -------------------------------------------
   Append a digit to the current number
-------------------------------------------- */
function inputNumber(num) {
  // After "=" start fresh
  if (justEvaluated) {
    currentValue = num;
    justEvaluated = false;
    historyEl.innerHTML = '&nbsp;';
  } else {
    currentValue = currentValue === '0' ? num : currentValue + num;
  }
  // Cap the length so it doesn't overflow visually
  if (currentValue.replace('.', '').length > 15) {
    currentValue = currentValue.slice(0, 15);
  }
  updateDisplay();
}

/* -------------------------------------------
   Add a decimal point (only once per number)
-------------------------------------------- */
function inputDecimal() {
  if (justEvaluated) {
    currentValue = '0.';
    justEvaluated = false;
    historyEl.innerHTML = '&nbsp;';
  } else if (!currentValue.includes('.')) {
    currentValue += '.';
  }
  updateDisplay();
}

/* -------------------------------------------
   Set the operator (+, −, ×, ÷)
   If a calculation is already pending, evaluate first
-------------------------------------------- */
function setOperator(nextOperator) {
  const inputNum = parseFloat(currentValue);

  if (previousValue === null) {
    previousValue = inputNum;
  } else if (operator && !justEvaluated) {
    const result = calculate(previousValue, inputNum, operator);
    previousValue = result;
    currentValue  = String(result);
  }

  operator = nextOperator;
  justEvaluated = false;
  currentValue  = '0'; // Wait for the next number, but keep showing previous on top
  resultEl.textContent = formatNumber(previousValue);
  historyEl.textContent = `${formatNumber(previousValue)} ${operator}`;

  // Highlight the active operator button
  highlightOperator(nextOperator);
}

/* -------------------------------------------
   Visually mark the active operator
-------------------------------------------- */
function highlightOperator(op) {
  document.querySelectorAll('.btn.operator').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === op);
  });
}

function clearOperatorHighlight() {
  document.querySelectorAll('.btn.operator').forEach(btn => {
    btn.classList.remove('active');
  });
}

/* -------------------------------------------
   Core math
-------------------------------------------- */
function calculate(a, b, op) {
  let result;
  switch (op) {
    case '+': result = a + b; break;
    case '−': result = a - b; break;
    case '×': result = a * b; break;
    case '÷':
      if (b === 0) return 'Error';
      result = a / b;
      break;
    default: return b;
  }
  // Round to avoid floating-point junk (e.g. 0.1 + 0.2)
  return Math.round(result * 1e10) / 1e10;
}

/* -------------------------------------------
   Evaluate the pending expression ( = )
-------------------------------------------- */
function evaluate() {
  if (operator === null || previousValue === null) return;

  const inputNum = parseFloat(currentValue);
  const result   = calculate(previousValue, inputNum, operator);

  historyEl.textContent =
    `${formatNumber(previousValue)} ${operator} ${formatNumber(inputNum)} =`;

  currentValue  = String(result);
  previousValue = null;
  operator      = null;
  justEvaluated = true;

  clearOperatorHighlight();
  updateDisplay();
}

/* -------------------------------------------
   Clear all (AC)
-------------------------------------------- */
function clearAll() {
  currentValue  = '0';
  previousValue = null;
  operator      = null;
  justEvaluated = false;
  historyEl.innerHTML = '&nbsp;';
  clearOperatorHighlight();
  updateDisplay();
}

/* -------------------------------------------
   Delete last digit (⌫)
-------------------------------------------- */
function deleteLast() {
  if (justEvaluated) return; // Don't backspace through a result
  if (currentValue.length <= 1 || (currentValue.length === 2 && currentValue.startsWith('-'))) {
    currentValue = '0';
  } else {
    currentValue = currentValue.slice(0, -1);
  }
  updateDisplay();
}

/* -------------------------------------------
   Convert to percentage (e.g. 50 → 0.5)
-------------------------------------------- */
function percent() {
  const val = parseFloat(currentValue) / 100;
  currentValue = String(Math.round(val * 1e10) / 1e10);
  updateDisplay();
}

/* ===========================================
   Wire up the button clicks
=========================================== */
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const { action, value } = btn.dataset;

    switch (action) {
      case 'number':   inputNumber(value);   break;
      case 'decimal':  inputDecimal();        break;
      case 'operator': setOperator(value);    break;
      case 'equals':   evaluate();            break;
      case 'clear':    clearAll();            break;
      case 'delete':   deleteLast();          break;
      case 'percent':  percent();             break;
    }
  });
});

/* ===========================================
   Keyboard support
=========================================== */
document.addEventListener('keydown', (e) => {
  const key = e.key;

  // Numbers 0-9
  if (/^[0-9]$/.test(key)) {
    pressVisual(`[data-value="${key}"]`);
    inputNumber(key);
    return;
  }

  // Operators – map keyboard symbols to our pretty symbols
  const opMap = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  if (key in opMap) {
    e.preventDefault();
    pressVisual(`[data-value="${opMap[key]}"]`);
    setOperator(opMap[key]);
    return;
  }

  // Other keys
  if (key === '.') { pressVisual('[data-action="decimal"]'); inputDecimal(); }
  else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    pressVisual('[data-action="equals"]');
    evaluate();
  }
  else if (key === 'Backspace') { pressVisual('[data-action="delete"]'); deleteLast(); }
  else if (key === 'Escape')    { pressVisual('[data-action="clear"]');  clearAll(); }
  else if (key === '%')         { pressVisual('[data-action="percent"]'); percent(); }
});

/* Briefly flash a button to mirror keyboard input */
function pressVisual(selector) {
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
}

/* Start with a clean display */
updateDisplay();