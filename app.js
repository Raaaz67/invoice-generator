// Constants from the analysis (Hardcoded as requested)
const COMPANY_NAME = "ZOROMY TRADING";
const COMPANY_ADDRESS = "Doha, Qatar";
const COMPANY_PHONE = "+974 5587 2106";
const AUTH_COMPANY = "Zoromy Trading";
const AUTH_NAME = "Ryhan Valiya P.";
const AUTH_TITLE = "Owner";

// DOM Elements
const form = document.getElementById("invoiceForm");
const clientSelect = document.getElementById("clientSelect");
const newClientPanel = document.getElementById("newClientPanel");
const clientInfoPanel = document.getElementById("clientInfoPanel");

// New client fields
const newClientName = document.getElementById("newClientName");
const newClientPhone = document.getElementById("newClientPhone");
const newClientCity = document.getElementById("newClientCity");
const saveClientBtn = document.getElementById("saveClientBtn");

// Existing client fields
const clientName = document.getElementById("clientName");
const clientPhone = document.getElementById("clientPhone");
const clientCity = document.getElementById("clientCity");

// Invoice Fields
const invoiceNumber = document.getElementById("invoiceNumber");
const invoiceDate = document.getElementById("invoiceDate");
const paymentStatus = document.getElementById("paymentStatus");
const btnPaid = document.getElementById("btnPaid");
const btnUnpaid = document.getElementById("btnUnpaid");
const description = document.getElementById("description");
const periodStart = document.getElementById("periodStart");
const numMonths = document.getElementById("numMonths");
const monthlyAmount = document.getElementById("monthlyAmount");
const totalAmountDisplay = document.getElementById("totalAmountDisplay");
const periodPreview = document.getElementById("periodPreview");
const invoiceCounter = document.getElementById("invoiceCounter");
const toast = document.getElementById("toast");

// State
let clients = JSON.parse(localStorage.getItem("zoromy_clients")) || [];
let lastInvoiceNum = parseInt(localStorage.getItem("zoromy_last_inv")) || 1;

// --- Initialize ---
function init() {
  // Set defaults
  invoiceDate.valueAsDate = new Date();
  
  // Format invoice number (ZT/INV/002)
  updateInvoiceNumberField();
  
  // Populate dropdown
  renderClientDropdown();

  // Live calculation listener
  periodStart.addEventListener('input', recalculate);
  numMonths.addEventListener('input', recalculate);
  monthlyAmount.addEventListener('input', recalculate);
  
  setupEventListeners();
}

function updateInvoiceNumberField() {
  const padded = String(lastInvoiceNum + 1).padStart(3, '0');
  invoiceNumber.value = `ZT/INV/${padded}`;
  invoiceCounter.textContent = `Next: #${padded}`;
}

// Compute end date and total whenever inputs change
function recalculate() {
  const startVal = periodStart.value;
  const months  = parseInt(numMonths.value, 10);
  const monthly = parseFloat(monthlyAmount.value);

  // Reset
  periodPreview.textContent = '';
  totalAmountDisplay.value  = '';

  if (!startVal || isNaN(months) || months < 1) return;

  // Compute end date: start + N months, then back 1 day
  const start  = new Date(startVal + 'T00:00:00');
  const endRaw = new Date(start);
  endRaw.setMonth(endRaw.getMonth() + months);
  endRaw.setDate(endRaw.getDate() - 1);

  const startLabel = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const endLabel   = endRaw.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  periodPreview.textContent = `${startLabel} – ${endLabel}`;

  if (!isNaN(monthly) && monthly > 0) {
    const total = monthly * months;
    totalAmountDisplay.value = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

function renderClientDropdown() {
  // Keep the first two options (placeholder and 'add new')
  clientSelect.innerHTML = `
    <option value="">— Select a client —</option>
    <option value="__new__">＋ Add New Client</option>
  `;
  
  clients.forEach((c, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = c.name;
    clientSelect.appendChild(opt);
  });
}

// --- Event Listeners ---
function setupEventListeners() {
  // Dropdown change
  clientSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    
    if (val === '__new__') {
      newClientPanel.classList.remove('hidden');
      clientInfoPanel.classList.add('hidden');
    } else if (val === '') {
      newClientPanel.classList.add('hidden');
      clientInfoPanel.classList.add('hidden');
    } else {
      // Selected existing
      newClientPanel.classList.add('hidden');
      clientInfoPanel.classList.remove('hidden');
      
      const client = clients[val];
      clientName.value = client.name;
      clientPhone.value = client.phone;
      clientCity.value = client.city;
    }
  });

  // Save new client
  saveClientBtn.addEventListener('click', () => {
    const name = newClientName.value.trim();
    if (!name) {
      showToast("Client name is required", true);
      return;
    }
    
    const newClient = {
      name,
      phone: newClientPhone.value.trim(),
      city: newClientCity.value.trim()
    };
    
    clients.push(newClient);
    localStorage.setItem("zoromy_clients", JSON.stringify(clients));
    
    renderClientDropdown();
    
    // Select the newly added client
    clientSelect.value = clients.length - 1;
    clientSelect.dispatchEvent(new Event('change'));
    
    // Clear form
    newClientName.value = '';
    newClientPhone.value = '';
    newClientCity.value = '';
    
    showToast("Client saved successfully!");
  });

  // Payment Toggle
  btnPaid.addEventListener('click', () => {
    paymentStatus.value = "PAID";
    btnPaid.classList.add('active');
    btnUnpaid.classList.remove('active');
  });
  
  btnUnpaid.addEventListener('click', () => {
    paymentStatus.value = "UNPAID";
    btnUnpaid.classList.add('active');
    btnPaid.classList.remove('active');
  });

  // Generate Button
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    generatePDF();
  });
}

// --- To Words Logic (No API) ---
const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

function inWords(num) {
    if ((num = num.toString()).length > 9) return 'overflow';
    n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
}

function processAmountToWords(amountNum) {
  const parts = parseFloat(amountNum).toFixed(2).split('.');
  const riyals = parseInt(parts[0], 10);
  const dirhams = parseInt(parts[1], 10);
  
  let w = inWords(riyals) + " Qatari Riyals";
  if (dirhams > 0) {
    w += " and " + inWords(dirhams) + " Dirhams";
  }
  return w + " Only";
}

function formatDateEng(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// --- PDF Generation ---
function generatePDF() {
  const selectedClient = clientSelect.value;
  if(selectedClient === "" || selectedClient === "__new__") {
    showToast("Please select a client", true);
    return;
  }

  const months  = parseInt(numMonths.value, 10);
  const monthly = parseFloat(monthlyAmount.value);

  if (!periodStart.value) { showToast("Please enter a start date", true); return; }
  if (isNaN(months) || months < 1) { showToast("Please enter a valid number of months", true); return; }
  if (isNaN(monthly) || monthly <= 0) { showToast("Please enter a valid monthly amount", true); return; }

  const amt = monthly * months;

  // Compute end date
  const start  = new Date(periodStart.value + 'T00:00:00');
  const endRaw = new Date(start);
  endRaw.setMonth(endRaw.getMonth() + months);
  endRaw.setDate(endRaw.getDate() - 1);

  const startLabel = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const endLabel   = endRaw.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Get data
  const data = {
    invNo: invoiceNumber.value,
    date: formatDateEng(invoiceDate.value),
    cName: clientName.value,
    cPhone: clientPhone.value,
    cCity: clientCity.value,
    desc: description.value || "Service as agreed",
    period: `${startLabel} – ${endLabel}`,
    amountRaw: amt,
    amountFormatted: amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    status: paymentStatus.value
  };

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  
  // Helpers
  const drawLine = (y) => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
  };

  // 1. Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Blue
  doc.text(COMPANY_NAME, pageWidth / 2, 25, { align: 'center' });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`${COMPANY_ADDRESS}  |  Tel: ${COMPANY_PHONE}`, pageWidth / 2, 33, { align: 'center' });

  // 2. Invoice Meta
  drawLine(40);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE", 20, 50);
  
  doc.setFontSize(10);
  doc.text(`Invoice No.: ${data.invNo}`, 20, 58);
  doc.text(`Date: ${data.date}`, 20, 64);
  
  drawLine(72);

  // 3. Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BILL TO:", 20, 82);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.cName, 20, 90);
  doc.text(data.cCity, 20, 96);
  if(data.cPhone) doc.text(data.cPhone, 20, 102);
  
  drawLine(110);

  // 4. Table Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Description", 20, 120);
  doc.text("Period Covered", 100, 120);
  doc.text("Amount (QAR)", 160, 120);

  // 5. Table Row
  doc.setFont("helvetica", "normal");
  // Wrap desc if too long
  const splitDesc = doc.splitTextToSize(data.desc, 70);
  doc.text(splitDesc, 20, 130);
  doc.text(data.period, 100, 130);
  doc.text(data.amountFormatted, 160, 130);
  
  // Calculate row height diff
  const rowHeight = (splitDesc.length * 5) + 122;
  const bottomHR = Math.max(145, rowHeight + 10);
  
  drawLine(bottomHR);

  // 6. Totals
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL PAYABLE: QAR ${data.amountFormatted}`, 20, bottomHR + 10);
  
  doc.setFont("helvetica", "italic");
  const words = `(${processAmountToWords(data.amountRaw)})`;
  const splitWords = doc.splitTextToSize(words, 170);
  doc.text(splitWords, 20, bottomHR + 18);
  
  const finishHR = bottomHR + 18 + (splitWords.length * 5) + 5;
  drawLine(finishHR);

  // 7. Authorization
  doc.setFont("helvetica", "bold");
  doc.text("Authorized by:", 20, finishHR + 15);
  doc.text(AUTH_COMPANY, 20, finishHR + 23);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${AUTH_NAME}`, 20, finishHR + 30);
  doc.text(`Title: ${AUTH_TITLE}`, 20, finishHR + 36);
  
  doc.text("Signature: _________________________________", 20, finishHR + 55);
  doc.text("Date: _________________________________", 20, finishHR + 70);

  // 8. Paid Stamp (if applicable)
  if (data.status === "PAID") {
    doc.setTextColor(16, 185, 129); // Green
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    // Add opacity via drawing state (supported in recent jsPDF)
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({opacity: 0.2}));
    doc.text("PAID", pageWidth/2, finishHR - 10, { align: 'center', angle: -45 });
    doc.restoreGraphicsState();
  }

  // Save
  const cNameSafe = data.cName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const outName = `${cNameSafe}-Invoice-${data.invNo.replace(/\//g, '-')}.pdf`;
  doc.save(outName);
  
  // Update counter logic
  const numPart = data.invNo.split('/').pop();
  const parsedNum = parseInt(numPart, 10);
  if (!isNaN(parsedNum)) {
    lastInvoiceNum = parsedNum;
    localStorage.setItem("zoromy_last_inv", lastInvoiceNum.toString());
    updateInvoiceNumberField();
  }

  showToast("PDF Generated successfully!");
}

function showToast(msg, isError = false) {
  toast.textContent = msg;
  if(isError) toast.classList.add('error');
  else toast.classList.remove('error');
  
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Start
document.addEventListener("DOMContentLoaded", init);
