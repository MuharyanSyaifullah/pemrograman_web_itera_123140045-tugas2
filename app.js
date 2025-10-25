// Class untuk merepresentasikan Item
class DashboardItem {
  constructor({ id = null, title = "", type = "task", desc = "", done = false, createdAt = null } = {}) {
    this.id = id ?? Date.now().toString();
    this.title = title;
    this.type = type;
    this.desc = desc;
    this.done = done;
    this.createdAt = createdAt ?? new Date().toISOString();
  }
}

// Class untuk mengelola Dashboard
class PersonalDashboard {
  constructor(storageKey = "pw_dashboard_v1") {
    this.storageKey = storageKey;
    this.items = this.load();
  }

  save = () => {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  load = () => {
    const raw = localStorage.getItem(this.storageKey);
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed.map(obj => new DashboardItem(obj));
    } catch (e) {
      console.error("Gagal parse data lokal", e);
      return [];
    }
  }

  addItem = (item) => {
    this.items.push(item);
    this.save();
  }

  updateItem = (id, patch = {}) => {
    this.items = this.items.map(it => (it.id === id ? Object.assign({}, it, patch) : it));
    this.save();
  }

  removeItem = (id) => {
    this.items = this.items.filter(it => it.id !== id);
    this.save();
  }

  clearAll = () => {
    this.items = [];
    this.save();
  }

  filter = (type = "all") => {
    if (type === "all") return this.items;
    return this.items.filter(it => it.type === type);
  }
}

// ---------- Inisialisasi ----------
const dashboard = new PersonalDashboard();


const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const form = $("#itemForm");
const titleInput = $("#title");
const typeInput = $("#type");
const descInput = $("#desc");
const itemsList = $("#itemsList");
const countEl = $("#count");
const clearAllBtn = $("#clearAll");
const filterBtns = $$(".filter-btn");
const localTimeEl = $("#localTime");
const weatherBox = $("#weatherBox");
const refreshWeatherBtn = $("#refreshWeather");

// ---------- Utility ----------
const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

// ---------- Render function ----------
const renderItems = (items = dashboard.items) => {
  itemsList.innerHTML = "";
  items.forEach(it => {
    const { id, title, type, desc, done, createdAt } = it;
    const li = document.createElement('li');
    li.className = 'p-3 rounded border flex justify-between items-start gap-3';
    li.innerHTML = `
      <div>
        <div class="flex items-center gap-2">
          <input type="checkbox" data-id="${id}" class="toggle-done" ${done ? 'checked' : ''} />
          <div>
            <div class="font-medium">${title}</div>
            <div class="text-xs text-slate-500">${type.toUpperCase()} • ${formatTime(createdAt)}</div>
          </div>
        </div>
        <div class="mt-2 text-sm text-slate-700">${desc}</div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="text-xs text-slate-500">ID: ${id.slice(-5)}</div>
        <div class="flex gap-2">
          <button data-edit="${id}" class="px-2 py-1 text-sm border rounded">Edit</button>
          <button data-delete="${id}" class="px-2 py-1 text-sm border rounded">Hapus</button>
        </div>
      </div>
    `;

    itemsList.appendChild(li);
  });


  countEl.textContent = String(items.length);
};


form.addEventListener('submit', (e) => {
  e.preventDefault();
  const payload = {
    title: titleInput.value.trim(),
    type: typeInput.value,
    desc: descInput.value.trim()
  };

  if (!payload.title) return alert('Judul harus diisi');

  const item = new DashboardItem(payload);
  dashboard.addItem(item);
  renderItems(dashboard.items);

 
  form.reset();
  titleInput.focus();
});


itemsList.addEventListener('click', (e) => {
  const editId = e.target.getAttribute('data-edit');
  const deleteId = e.target.getAttribute('data-delete');
  const checkbox = e.target.classList.contains('toggle-done') ? e.target : null;

  if (editId) {
    const it = dashboard.items.find(x => x.id === editId);
    if (!it) return;
  
    titleInput.value = it.title;
    typeInput.value = it.type;
    descInput.value = it.desc;
   
    dashboard.removeItem(editId);
    renderItems(dashboard.items);
  }

  if (deleteId) {
    if (confirm('Hapus item ini?')) {
      dashboard.removeItem(deleteId);
      renderItems(dashboard.items);
    }
  }

  if (checkbox) {
    const id = checkbox.getAttribute('data-id');
    dashboard.updateItem(id, { done: checkbox.checked });
    renderItems(dashboard.items);
  }
});


clearAllBtn.addEventListener('click', () => {
  if (confirm('Hapus semua item?')) {
    dashboard.clearAll();
    renderItems(dashboard.items);
  }
});


filterBtns.forEach(btn => btn.addEventListener('click', (e) => {
  const t = e.currentTarget.getAttribute('data-filter');
  const filtered = dashboard.filter(t);
  renderItems(filtered);
}));


const updateTime = () => localTimeEl.textContent = new Date().toLocaleString();
updateTime();
setInterval(updateTime, 1000);


const fakeWeatherFetch = async (location = 'Jakarta') => {
  const randTemp = () => Math.floor(Math.random() * 10) + 24;
  return new Promise((resolve) => setTimeout(() => {
    resolve({ location, temp: randTemp(), desc: 'Cerah berawan' });
  }, 800));
};

const renderWeather = async () => {
  weatherBox.textContent = 'Memuat...';
  try {
    const data = await fakeWeatherFetch();
    const { location, temp, desc } = data;
    weatherBox.innerHTML = `
      <div class="font-medium">${location}</div>
      <div class="text-3xl">${temp}°C</div>
      <div class="text-sm text-slate-600">${desc}</div>
    `;
  } catch (err) {
    weatherBox.textContent = 'Gagal memuat cuaca';
  }
};

refreshWeatherBtn.addEventListener('click', () => renderWeather());


const summary = () => {
  const all = dashboard.items;
  const total = all.length;
  const byType = all.reduce((acc, cur) => {
    acc[cur.type] = (acc[cur.type] || 0) + 1;
    return acc;
  }, {});

  return { total, ...byType };
};

const observeAndLog = () => {
  const s = summary();
  console.log('Summary snapshot:', s);
};


renderItems(dashboard.items);
renderWeather();
observeAndLog();


window.addEventListener('storage', (e) => {
  if (e.key === dashboard.storageKey) {
    dashboard.items = dashboard.load();
    renderItems(dashboard.items);
  }
});

