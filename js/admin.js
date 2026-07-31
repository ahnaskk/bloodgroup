(() => {
  const STORAGE_KEY = 'bloodDonorMembers';
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const ADMIN_EMAIL = 'ahnas@gmail.com';
  const ADMIN_PASSWORD = '123';

  const state = {
    members: [],
    filter: 'All',
    search: '',
    sort: 'name-asc',
    editingId: null,
    deletingId: null,
    loggedIn: false,
  };

  const el = {
    adminApp: document.getElementById('adminApp'),
    loginApp: document.getElementById('loginApp'),
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    usernameError: document.getElementById('usernameError'),
    passwordError: document.getElementById('passwordError'),
    addMemberBtn: document.getElementById('addMemberBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    filterBar: document.getElementById('filterBar'),
    memberList: document.getElementById('memberList'),
    noResults: document.getElementById('noResults'),
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
    toast: document.getElementById('toast'),
  };

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
    state.members = [];
    saveMembers();
  }

  function saveMembers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.members));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    setTimeout(() => { el.toast.hidden = true; }, 2400);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
      .map((m) => `
        <div class="member-card" data-id="${m.id}">
          <div class="member-card-top">
            <div>
              <p class="member-name">${escapeHtml(m.name)}</p>
              <p class="member-phone">${escapeHtml(m.phone)}</p>
            </div>
            <span class="badge">${m.bloodGroup}</span>
          </div>
          <div class="member-card-actions">
            <button class="action-btn edit" data-action="edit">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              Edit
            </button>
            <button class="action-btn delete" data-action="delete">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
              Delete
            </button>
          </div>
        </div>`)
      .join('');
  }

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
    el.usernameError.textContent = '';
    el.passwordError.textContent = '';
    el.nameError.textContent = '';
    el.bloodGroupError.textContent = '';
    el.phoneError.textContent = '';
  }

  function validateForm() {
    clearErrors();
    const name = el.nameInput.value.trim();
    const bloodGroup = el.bloodGroupInput.value;
    const phone = el.phoneInput.value.trim();
    let valid = true;

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
    renderList();
  }

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
    renderList();
  }

  function login(e) {
    e.preventDefault();
    clearErrors();
    const username = el.usernameInput.value.trim();
    const password = el.passwordInput.value.trim();
    let valid = true;

    if (!username) {
      el.usernameError.textContent = 'Email is required';
      valid = false;
    }
    if (!password) {
      el.passwordError.textContent = 'Password is required';
      valid = false;
    }

    if (!valid) return;

    if (username === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      state.loggedIn = true;
      renderApp();
    } else {
      showToast('Invalid credentials');
    }
  }

  function logout() {
    state.loggedIn = false;
    el.usernameInput.value = '';
    el.passwordInput.value = '';
    clearErrors();
    renderApp();
  }

  function renderApp() {
    if (state.loggedIn) {
      el.loginApp.hidden = true;
      el.adminApp.hidden = false;
      renderFilters();
      renderList();
    } else {
      el.loginApp.hidden = false;
      el.adminApp.hidden = true;
    }
  }

  function bindEvents() {
    el.loginForm.addEventListener('submit', login);
    el.logoutBtn.addEventListener('click', logout);
    el.addMemberBtn.addEventListener('click', () => openMemberModal(null));
    el.cancelMemberBtn.addEventListener('click', closeMemberModal);
    el.memberForm.addEventListener('submit', handleMemberSubmit);
    el.memberModal.addEventListener('click', (e) => { if (e.target === el.memberModal) closeMemberModal(); });
    el.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    el.confirmDeleteBtn.addEventListener('click', confirmDelete);
    el.deleteModal.addEventListener('click', (e) => { if (e.target === el.deleteModal) closeDeleteModal(); });
    el.filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      state.filter = btn.dataset.group;
      renderFilters();
      renderList();
    });
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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!el.memberModal.hidden) closeMemberModal();
        if (!el.deleteModal.hidden) closeDeleteModal();
      }
    });
  }

  function init() {
    loadMembers();
    bindEvents();
    renderApp();
  }

  document.addEventListener('DOMContentLoaded', init);
})();