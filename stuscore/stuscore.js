const API_URL = 'https://www.19980926.xyz/rohn/users';

const state = {
  rows: [],
  chapterKeys: [],
  sortKey: 'rank',
  sortOrder: 'asc'
};

function setStatus(text, ok = true) {
  const color = ok ? 'var(--ok)' : '#ff7b7b';
  $('#status').html(`<span class="dot" style="background:${color}"></span><span>${text}</span>`);
}

function normalize(raw) {
  const users = Array.isArray(raw?.data?.users) ? raw.data.users : [];
  const defaultScores = [{ id: 1, section: 'Node认知', score: 60 }];

  const normalized = users.map((item, idx) => {
    const name = item.name ?? item.nickname ?? `学生${idx + 1}`;
    const scoreList = Array.isArray(item.scores)
      ? item.scores
      : Array.isArray(item.chapterScores)
        ? item.chapterScores
        : defaultScores;

    const scoreMap = {};
    scoreList.forEach((scoreItem) => {
      if (!scoreItem) return;
      const key = scoreItem.section ?? `章节${scoreItem.id ?? ''}`;
      if (!key) return;
      scoreMap[key] = Number(scoreItem.score ?? 0);
    });

    return { name, scoreMap };
  });

  const keySet = new Set();
  normalized.forEach((r) => Object.keys(r.scoreMap).forEach((k) => keySet.add(k)));

  return {
    rows: normalized,
    chapterKeys: Array.from(keySet)
  };
}

function total(row) {
  return state.chapterKeys.reduce((sum, key) => sum + Number(row.scoreMap[key] ?? 0), 0);
}

function sortedRows() {
  const rows = [...state.rows];
  const order = state.sortOrder === 'asc' ? 1 : -1;

  rows.sort((a, b) => {
    let av;
    let bv;

    if (state.sortKey === 'rank') {
      av = total(a);
      bv = total(b);
    } else if (state.sortKey === 'name') {
      av = a.name;
      bv = b.name;
    } else {
      av = Number(a.scoreMap[state.sortKey] ?? -Infinity);
      bv = Number(b.scoreMap[state.sortKey] ?? -Infinity);
    }

    if (typeof av === 'string' || typeof bv === 'string') {
      return av.toString().localeCompare(bv.toString(), 'zh') * order;
    }

    return (av - bv) * order;
  });

  return rows;
}

function sortMark(key) {
  if (state.sortKey !== key) return '↕';
  return state.sortOrder === 'asc' ? '↑' : '↓';
}

function renderHeader() {
  const chapterCols = state.chapterKeys
    .map((key) => `<th class="sortable" data-key="${key}">${key}<span class="sort-mark">${sortMark(key)}</span></th>`)
    .join('');

  $('#thead').html(`
    <tr>
      <th class="sortable" data-key="rank">排名</th>
      <th class="sortable" data-key="name">姓名</th>
      ${chapterCols}
    </tr>
  `);
}

function renderBody() {
  const rows = sortedRows();

  if (!rows.length) {
    $('#tbody').empty();
    $('#empty').show();
    return;
  }

  $('#empty').hide();

  const bodyHtml = rows.map((row, index) => {
    const chapterTds = state.chapterKeys
      .map((key) => `<td>${row.scoreMap[key] ?? '-'}</td>`)
      .join('');

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${row.name}</td>
        ${chapterTds}
      </tr>
    `;
  }).join('');

  $('#tbody').html(bodyHtml);
}

function loadData() {
  setStatus('正在加载数据...');

  $.ajax({
    url: API_URL,
    method: 'GET',
    dataType: 'json'
  }).done((json) => {
    const { rows, chapterKeys } = normalize(json);

    state.rows = rows;
    state.chapterKeys = chapterKeys;

    renderHeader();
    renderBody();
    setStatus(`加载成功，共 ${rows.length} 条学生数据`);
  }).fail((xhr) => {
    state.rows = [];
    state.chapterKeys = [];
    renderHeader();
    renderBody();
    const errText = xhr?.status ? `HTTP ${xhr.status}` : '网络异常';
    setStatus(`加载失败：${errText}`, false);
  });
}

$(function () {
  $('#reloadBtn').on('click', loadData);

  $('#thead').on('click', 'th.sortable', function () {
    const key = $(this).data('key');
    if (!key) return;

    if (state.sortKey === key) {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortOrder = 'asc';
    }

    renderHeader();
    renderBody();
  });

  loadData();
});
