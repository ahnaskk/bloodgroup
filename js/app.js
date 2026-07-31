(() => {
  const STORAGE_KEY = 'bloodDonorMembers';
  const THEME_KEY = 'bloodDonorTheme';
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const SAMPLE_DATA = [
    { name: 'Rahul', bloodGroup: 'O+', phone: '9876543210' },
    { name: 'Arun', bloodGroup: 'A+', phone: '9123456789' },
    { name: 'Vishnu', bloodGroup: 'B+', phone: '9988776655' },
    { name: 'Akhil', bloodGroup: 'AB+', phone: '9871234567' },
    { name: 'Nithin', bloodGroup: 'O-', phone: '9012345678' },
  ];

  const state = {
    members: [],
    filter: 'All',
    search: '',
    sort: 'name-asc',
    editingId: null,
    deletingId: null,
  };

  // Elements
  const el = {
    loader: document.getElementById('loader'),
    app: document.getElementById('app'),
    searchInput: document.getElementById('searchInput'),
    filterBar: document.getElementById('filterBar'),
    memberList: document.getElementById('memberList'),
    noResults: document.getElementById('noResults'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    toast: document.getElementById('toast'),

    memberModal: document.getElementById('memberModal'),
    modalTitle: document.getElementById('modalTitle'),
    memberForm: document.getElementById('memberForm'),
    nameInput: document.getElementById('nameInput'),
    bloodGroupInput: document.getElementById('bloodGroupInput'),
    phoneInput: document.getElementById('phoneInput'),
    nameError: document.getElementById('nameError'),
    bloodGroupError: document.getElementById('bloodGroupError'),
    phoneError: document.getElementById('phoneError'),
    cancelMemberBtn: document.getElementById('cancelMemberBtn'),
    submitMemberBtn: document.getElementById('submitMemberBtn'),

    deleteModal: document.getElementById('deleteModal'),
    deleteMessage: document.getElementById('deleteMessage'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  };

  // ---------- Persistence ----------
  function loadMembers() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        state.members = JSON.parse(raw);
        return;
      } catch (e) {
        state.members = [];
      }
    }
    state.members = SAMPLE_DATA.map((m) => ({ id: uid(), ...m }));
    saveMembers();
  }

  function saveMembers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.members));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Theme ----------
  function loadTheme() {
    const theme = localStorage.getItem(THEME_KEY) ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelector('.icon-sun').hidden = theme === 'dark';
    document.querySelector('.icon-moon').hidden = theme !== 'dark';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ---------- Rendering ----------
  function render() {
    renderFilters();
    renderList();
  }

  function renderFilters() {
    const groups = ['All', ...BLOOD_GROUPS];
    el.filterBar.innerHTML = groups
      .map((g) => `<button class="filter-chip ${state.filter === g ? 'active' : ''}" data-group="${g}">${g}</button>`)
      .join('');
  }

  function getFilteredSortedMembers() {
    const q = state.search.trim().toLowerCase();
    let list = state.members.filter((m) => {
      const matchesFilter = state.filter === 'All' || m.bloodGroup === state.filter;
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.phone.includes(q);
      return matchesFilter && matchesSearch;
    });

    if (state.sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.sort === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name));
    else if (state.sort === 'bloodGroup') list.sort((a, b) => a.bloodGroup.localeCompare(b.bloodGroup) || a.name.localeCompare(b.name));

    return list;
  }

  function renderList() {
    const list = getFilteredSortedMembers();
    el.noResults.hidden = list.length !== 0;
    el.memberList.hidden = list.length === 0;

    el.memberList.innerHTML = list
      .map(
        (m) => `
      <div class="member-card" data-id="${m.id}">
        <div class="member-card-top">
          <div>
            <p class="member-name">${escapeHtml(m.name)}</p>
            <p class="member-phone">${escapeHtml(m.phone)}</p>
          </div>
          <span class="badge">${m.bloodGroup}</span>
        </div>
        <div class="member-card-actions">
          <a class="action-btn call" href="tel:+91${m.phone}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </a>
        </div>
      </div>`
      )
      .join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2400);
  }

  // ---------- Member Modal ----------
  function openMemberModal(member) {
    state.editingId = member ? member.id : null;
    el.modalTitle.textContent = member ? 'Edit Member' : 'Add Member';
    el.submitMemberBtn.textContent = member ? 'Save Changes' : 'Add Member';
    el.nameInput.value = member ? member.name : '';
    el.bloodGroupInput.value = member ? member.bloodGroup : '';
    el.phoneInput.value = member ? member.phone : '';
    clearErrors();
    el.memberModal.hidden = false;
    el.nameInput.focus();
  }

  function closeMemberModal() {
    el.memberModal.hidden = true;
    el.memberForm.reset();
    state.editingId = null;
    clearErrors();
  }

  function clearErrors() {
    el.nameError.textContent = '';
    el.bloodGroupError.textContent = '';
    el.phoneError.textContent = '';
  }

  function validateForm() {
    clearErrors();
    let valid = true;
    const name = el.nameInput.value.trim();
    const bloodGroup = el.bloodGroupInput.value;
    const phone = el.phoneInput.value.trim();

    if (!name) {
      el.nameError.textContent = 'Name is required';
      valid = false;
    }
    if (!bloodGroup) {
      el.bloodGroupError.textContent = 'Blood group is required';
      valid = false;
    }
    if (!phone) {
      el.phoneError.textContent = 'Phone number is required';
      valid = false;
    } else if (!/^\d{10}$/.test(phone)) {
      el.phoneError.textContent = 'Phone number must be exactly 10 digits';
      valid = false;
    }
    return valid ? { name, bloodGroup, phone } : null;
  }

  function handleMemberSubmit(e) {
    e.preventDefault();
    const data = validateForm();
    if (!data) return;

    if (state.editingId) {
      const member = state.members.find((m) => m.id === state.editingId);
      Object.assign(member, data);
      showToast('Member updated successfully');
    } else {
      state.members.push({ id: uid(), ...data });
      showToast('Member added successfully');
    }
    saveMembers();
    closeMemberModal();
    render();
  }

  // ---------- Delete Modal ----------
  function openDeleteModal(member) {
    state.deletingId = member.id;
    el.deleteMessage.textContent = `Are you sure you want to delete "${member.name}"? This action cannot be undone.`;
    el.deleteModal.hidden = false;
  }

  function closeDeleteModal() {
    el.deleteModal.hidden = true;
    state.deletingId = null;
  }

  function confirmDelete() {
    state.members = state.members.filter((m) => m.id !== state.deletingId);
    saveMembers();
    closeDeleteModal();
    showToast('Member deleted');
    render();
  }

  // ---------- CSV Export / Import ----------
  function exportCSV() {
    const header = 'name,bloodGroup,phone';
    const rows = state.members.map((m) => `${csvEscape(m.name)},${m.bloodGroup},${m.phone}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blood-donor-directory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Members exported to CSV');
  }

  function csvEscape(value) {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  }

  function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ''; }
      else cur += ch;
    }
    result.push(cur);
    return result;
  }

  function importCSV(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (!lines.length) return;

      const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
      const nameIdx = header.indexOf('name');
      const bgIdx = header.indexOf('bloodgroup');
      const phoneIdx = header.indexOf('phone');
      const dataLines = nameIdx === -1 || bgIdx === -1 || phoneIdx === -1 ? lines : lines.slice(1);

      let imported = 0;
      dataLines.forEach((line) => {
        const cols = parseCSVLine(line);
        const name = (nameIdx !== -1 ? cols[nameIdx] : cols[0])?.trim();
        const bloodGroup = (bgIdx !== -1 ? cols[bgIdx] : cols[1])?.trim();
        const phone = (phoneIdx !== -1 ? cols[phoneIdx] : cols[2])?.trim();
        if (name && BLOOD_GROUPS.includes(bloodGroup) && /^\d{10}$/.test(phone)) {
          state.members.push({ id: uid(), name, bloodGroup, phone });
          imported++;
        }
      });

      saveMembers();
      render();
      showToast(`Imported ${imported} member${imported === 1 ? '' : 's'}`);
    };
    reader.readAsText(file);
  }

  // ---------- Events ----------
  function bindEvents() {
    el.searchInput.addEventListener('input', (e) => {
      state.search = e.target.value;
      renderList();
    });

    el.filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      state.filter = btn.dataset.group;
      renderFilters();
      renderList();
    });

    el.cancelMemberBtn.addEventListener('click', closeMemberModal);
    el.memberForm.addEventListener('submit', handleMemberSubmit);
    el.memberModal.addEventListener('click', (e) => { if (e.target === el.memberModal) closeMemberModal(); });

    el.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    el.confirmDeleteBtn.addEventListener('click', confirmDelete);
    el.deleteModal.addEventListener('click', (e) => { if (e.target === el.deleteModal) closeDeleteModal(); });

    el.memberList.addEventListener('click', (e) => {
      const card = e.target.closest('.member-card');
      if (!card) return;
      const id = card.dataset.id;
      const member = state.members.find((m) => m.id === id);
      if (!member) return;

      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;
      const action = actionBtn.dataset.action;

      if (action === 'edit') openMemberModal(member);
      else if (action === 'delete') openDeleteModal(member);
    });

    el.darkModeToggle.addEventListener('click', toggleTheme);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!el.memberModal.hidden) closeMemberModal();
        if (!el.deleteModal.hidden) closeDeleteModal();
      }
    });
  }

  // ---------- Init ----------
  function init() {
    loadTheme();
    loadMembers();
    bindEvents();
    render();

    setTimeout(() => {
      el.loader.hidden = true;
      el.app.hidden = false;
    }, 400);
  }

  // Listen for storage changes from other windows (e.g. admin page)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      try {
        state.members = e.newValue ? JSON.parse(e.newValue) : [];
        render();
        showToast('Directory updated');
      } catch (err) {
        // ignore parse errors
      }
    }
  });

  document.addEventListener('DOMContentLoaded', init);
})();
