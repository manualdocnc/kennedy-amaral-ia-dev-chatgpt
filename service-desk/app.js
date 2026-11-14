const STORAGE_KEY = "serviceDeskTickets";

const seedTickets = [
  {
    id: 1001,
    requester: "Marina Costa",
    email: "marina.costa@empresa.com",
    category: "Acesso",
    priority: "Alta",
    status: "Aberto",
    title: "Senha expirada no sistema de vendas",
    description: "Ao tentar entrar no sistema de vendas, recebo a mensagem de senha expirada e não consigo redefinir pelo portal.",
    correction: "",
    createdAt: "2026-06-18T11:20:00.000Z",
    updatedAt: "2026-06-18T11:20:00.000Z",
    events: [
      "Chamado aberto por Marina Costa."
    ]
  },
  {
    id: 1002,
    requester: "Rafael Lima",
    email: "rafael.lima@empresa.com",
    category: "Hardware",
    priority: "Média",
    status: "Em atendimento",
    title: "Notebook reiniciando sozinho",
    description: "O notebook reinicia durante reuniões e apresentações. Isso ocorreu quatro vezes nesta semana.",
    correction: "Equipamento em análise para troca preventiva de memória.",
    createdAt: "2026-06-17T14:40:00.000Z",
    updatedAt: "2026-06-18T09:15:00.000Z",
    events: [
      "Chamado aberto por Rafael Lima.",
      "Status alterado para Em atendimento."
    ]
  }
];

let tickets = loadTickets();
let selectedTicketId = tickets[0]?.id ?? null;

const views = document.querySelectorAll(".view");
const tabs = document.querySelectorAll(".tab");
const ticketForm = document.querySelector("#ticketForm");
const ticketList = document.querySelector("#ticketList");
const ticketDetails = document.querySelector("#ticketDetails");
const ticketCounter = document.querySelector("#ticketCounter");
const historyTable = document.querySelector("#historyTable");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const priorityFilter = document.querySelector("#priorityFilter");
const openTicketMetric = document.querySelector("#openTicketMetric");
const completedTicketMetric = document.querySelector("#completedTicketMetric");
const overdueTicketMetric = document.querySelector("#overdueTicketMetric");
const inProgressTicketMetric = document.querySelector("#inProgressTicketMetric");
const clearData = document.querySelector("#clearData");
const toast = document.querySelector("#toast");
const requesterInput = document.querySelector("#requester");
const emailInput = document.querySelector("#email");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const validatedInputs = [requesterInput, emailInput, titleInput, descriptionInput];

validatedInputs.forEach((input) => {
  input.addEventListener("input", () => validateTicketField(input));
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("is-active"));
    views.forEach((view) => view.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.querySelector(`#${tab.dataset.view}`).classList.add("is-active");
    render();
  });
});

ticketForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateTicketForm()) {
    ticketForm.reportValidity();
    return;
  }

  const formTicket = {
    id: nextId(),
    requester: requesterInput.value.trim().replace(/\s+/gu, " "),
    email: emailInput.value.trim(),
    category: document.querySelector("#category").value,
    priority: document.querySelector("#priority").value,
    status: "Aberto",
    title: titleInput.value.trim().replace(/\s+/gu, " "),
    description: descriptionInput.value.trim(),
    correction: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    events: [
      `Chamado aberto por ${document.querySelector("#requester").value.trim()}.`
    ]
  };

  const duplicateTicket = findDuplicateTicket(formTicket);
  if (duplicateTicket) {
    showToast(`Poss\u00edvel duplica\u00e7\u00e3o: o chamado #${duplicateTicket.id} ja existe.`);
    return;
  }

  tickets.unshift(formTicket);
  selectedTicketId = formTicket.id;
  saveTickets();
  ticketForm.reset();
  showToast(`Chamado cadastrado com sucesso. Protocolo: #${formTicket.id}.`);
  render();
});

searchInput.addEventListener("input", renderTicketList);
statusFilter.addEventListener("change", renderTicketList);
priorityFilter.addEventListener("change", renderTicketList);

clearData.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  tickets = [...seedTickets];
  selectedTicketId = tickets[0].id;
  saveTickets();
  showToast("Base local restaurada.");
  render();
});

function normalizeDuplicateValue(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

function findDuplicateTicket(candidate) {
  const candidateEmail = normalizeDuplicateValue(candidate.email);
  const candidateTitle = normalizeDuplicateValue(candidate.title);
  const candidateDescription = normalizeDuplicateValue(candidate.description);

  return tickets.find((ticket) =>
    ticket.status !== "Resolvido" &&
    normalizeDuplicateValue(ticket.email) === candidateEmail &&
    normalizeDuplicateValue(ticket.title) === candidateTitle &&
    normalizeDuplicateValue(ticket.description) === candidateDescription
  );
}

function validateTicketForm() {
  let isValid = true;

  validatedInputs.forEach((input) => {
    if (!validateTicketField(input)) {
      isValid = false;
    }
  });

  return isValid;
}

function validateTicketField(input) {
  const value = input.value.trim();
  let message = "";

  if (value) {
    switch (input.id) {
      case "requester": {
        const normalizedName = value.replace(/\s+/gu, " ");
        const letterCount = Array.from(normalizedName.matchAll(/\p{L}/gu)).length;
        if (letterCount < 3 || !/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(normalizedName)) {
          message = "Informe um nome valido com pelo menos 3 letras; use apenas letras, espacos, hifens ou apostrofos.";
        }
        break;
      }
      case "email":
        if (!/^[^\s@]+@[^\s@.]+\.[^\s@.]{2,}$/u.test(value)) {
          message = "Informe um e-mail valido, como nome@empresa.com.";
        }
        break;
      case "title": {
        const usefulCharacters = Array.from(value.matchAll(/[\p{L}\p{N}]/gu)).length;
        if (usefulCharacters < 5) {
          message = "Use um titulo descritivo com pelo menos 5 letras ou numeros.";
        }
        break;
      }
      case "description": {
        const usefulCharacters = Array.from(value.matchAll(/[\p{L}\p{N}]/gu)).length;
        if (usefulCharacters < 12) {
          message = "Descreva o problema com pelo menos 12 letras ou numeros.";
        }
        break;
      }
    }
  }

  input.setCustomValidity(message);
  return input.checkValidity();
}

function loadTickets() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTickets));
    return [...seedTickets];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [...seedTickets];
  }
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function nextId() {
  return Math.max(...tickets.map((ticket) => ticket.id)) + 1;
}

function render() {
  renderMetrics();
  renderTicketList();
  renderTicketDetails();
  renderHistory();
}

function renderMetrics() {
  const now = Date.now();
  const overdueAfterMs = 3 * 24 * 60 * 60 * 1000;

  openTicketMetric.textContent = tickets.filter((ticket) => ticket.status === "Aberto").length;
  completedTicketMetric.textContent = tickets.filter((ticket) => ticket.status === "Resolvido").length;
  inProgressTicketMetric.textContent = tickets.filter((ticket) => ticket.status === "Em atendimento").length;
  overdueTicketMetric.textContent = tickets.filter((ticket) => {
    const createdAt = Date.parse(ticket.createdAt);
    return ticket.status !== "Resolvido" && Number.isFinite(createdAt) && now - createdAt > overdueAfterMs;
  }).length;
}

function renderTicketList() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedPriority = priorityFilter.value;
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = (
      String(ticket.id).includes(term) ||
      ticket.title.toLowerCase().includes(term) ||
      ticket.requester.toLowerCase().includes(term)
    );

    return matchesSearch &&
      (!selectedStatus || ticket.status === selectedStatus) &&
      (!selectedPriority || ticket.priority === selectedPriority);
  });

  ticketCounter.textContent = `${filteredTickets.length} chamado${filteredTickets.length === 1 ? "" : "s"}`;

  if (filteredTickets.length === 0) {
    ticketList.innerHTML = '<div class="empty-state"><p>Nenhum chamado encontrado.</p></div>';
    return;
  }

  ticketList.innerHTML = filteredTickets.map((ticket) => `
    <button class="ticket-card ${ticket.id === selectedTicketId ? "is-selected" : ""}" data-ticket-id="${ticket.id}">
      <span class="ticket-title">#${ticket.id} - ${escapeHtml(ticket.title)}</span>
      <span class="ticket-meta">${escapeHtml(ticket.requester)} • ${formatDate(ticket.updatedAt)}</span>
      <span class="badge-row">
        <span class="badge ${statusClass(ticket.status)}">${ticket.status}</span>
        <span class="badge ${priorityClass(ticket.priority)}">${ticket.priority}</span>
      </span>
    </button>
  `).join("");

  document.querySelectorAll(".ticket-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedTicketId = Number(card.dataset.ticketId);
      renderTicketList();
      renderTicketDetails();
    });
  });
}

function renderTicketDetails() {
  const ticket = tickets.find((item) => item.id === selectedTicketId);

  if (!ticket) {
    ticketDetails.innerHTML = `
      <div class="empty-state">
        <h3>Selecione um chamado</h3>
        <p>Ao escolher um item da fila, os campos de status, prioridade e correção aparecem aqui.</p>
      </div>
    `;
    return;
  }

  ticketDetails.innerHTML = `
    <div class="details-header">
      <div>
        <p class="eyebrow">Chamado #${ticket.id}</p>
        <h3>${escapeHtml(ticket.title)}</h3>
        <p class="ticket-meta">Aberto por ${escapeHtml(ticket.requester)} em ${formatDate(ticket.createdAt)}</p>
      </div>
      <span class="badge ${statusClass(ticket.status)}">${ticket.status}</span>
    </div>

    <div class="details-grid">
      <label>
        Status
        <select id="detailStatus">
          <option ${ticket.status === "Aberto" ? "selected" : ""}>Aberto</option>
          <option ${ticket.status === "Em atendimento" ? "selected" : ""}>Em atendimento</option>
          <option ${ticket.status === "Aguardando usuário" ? "selected" : ""}>Aguardando usuário</option>
          <option ${ticket.status === "Resolvido" ? "selected" : ""}>Resolvido</option>
        </select>
      </label>
      <label>
        Prioridade
        <select id="detailPriority">
          <option ${ticket.priority === "Baixa" ? "selected" : ""}>Baixa</option>
          <option ${ticket.priority === "Média" ? "selected" : ""}>Média</option>
          <option ${ticket.priority === "Alta" ? "selected" : ""}>Alta</option>
          <option ${ticket.priority === "Crítica" ? "selected" : ""}>Crítica</option>
        </select>
      </label>
    </div>

    <label>
      Descrever correção
      <textarea id="detailCorrection" rows="5" placeholder="Informe a solução aplicada ou próxima ação.">${escapeHtml(ticket.correction)}</textarea>
    </label>

    <div class="description-box">
      <strong>Descrição do usuário</strong>
      <p>${escapeHtml(ticket.description)}</p>
      <p class="ticket-meta">${escapeHtml(ticket.category)} • ${escapeHtml(ticket.email)}</p>
    </div>

    <div class="form-actions">
      <button class="primary" id="saveTicket">Salvar alterações</button>
    </div>

    <div class="history-box">
      <strong>Histórico deste chamado</strong>
      <ul>
        ${ticket.events.map((event) => `<li class="history-line">${escapeHtml(event)}</li>`).join("")}
      </ul>
    </div>

    <section class="internal-notes" aria-labelledby="internalNotesTitle">
      <h4 id="internalNotesTitle">Observações internas (somente analistas)</h4>
      <label for="internalCommentInput">Adicionar observação</label>
      <textarea id="internalCommentInput" rows="3" maxlength="1000" placeholder="Escreva uma observação interna para a equipe."></textarea>
      <button class="primary" id="addInternalComment" type="button">Adicionar observação</button>
      <ul id="internalCommentList">
        ${(ticket.internalComments || []).map((comment) => `
          <li class="internal-note">
            <p>${escapeHtml(comment.text)}</p>
            <time class="ticket-meta">${formatDate(comment.createdAt)}</time>
          </li>
        `).join("") || "<li class=\"ticket-meta\">Nenhuma observação interna.</li>"}
      </ul>
    </section>
  `;

  document.querySelector("#saveTicket").addEventListener("click", () => updateSelectedTicket(ticket.id));
  document.querySelector("#addInternalComment").addEventListener("click", () => addInternalComment(ticket.id));
}

function addInternalComment(ticketId) {
  const ticket = tickets.find((item) => item.id === ticketId);
  const commentInput = document.querySelector("#internalCommentInput");
  const text = commentInput.value.trim();

  if (!ticket || !text) {
    showToast("Digite uma observação antes de adicionar.");
    commentInput.focus();
    return;
  }

  if (!Array.isArray(ticket.internalComments)) {
    ticket.internalComments = [];
  }

  ticket.internalComments.push({
    text,
    createdAt: new Date().toISOString()
  });
  ticket.updatedAt = new Date().toISOString();
  saveTickets();
  showToast("Observação interna adicionada.");
  render();
}

function updateSelectedTicket(ticketId) {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) return;

  const newStatus = document.querySelector("#detailStatus").value;
  const newPriority = document.querySelector("#detailPriority").value;
  const newCorrection = document.querySelector("#detailCorrection").value.trim();
  const eventList = [];

  if (ticket.status !== newStatus) {
    eventList.push(`Status alterado de ${ticket.status} para ${newStatus}.`);
  }

  if (ticket.priority !== newPriority) {
    eventList.push(`Prioridade alterada de ${ticket.priority} para ${newPriority}.`);
  }

  if (ticket.correction !== newCorrection && newCorrection) {
    eventList.push(`Correção registrada: ${newCorrection}`);
  }

  ticket.status = newStatus;
  ticket.priority = newPriority;
  ticket.correction = newCorrection;
  ticket.updatedAt = new Date().toISOString();
  ticket.events = ticket.events.concat(eventList);

  showToast(`Chamado #${ticket.id} atualizado.`);
  render();
}

function renderHistory() {
  historyTable.innerHTML = tickets.map((ticket) => `
    <tr>
      <td>#${ticket.id}</td>
      <td>${escapeHtml(ticket.title)}</td>
      <td>${escapeHtml(ticket.requester)}</td>
      <td><span class="badge ${statusClass(ticket.status)}">${ticket.status}</span></td>
      <td><span class="badge ${priorityClass(ticket.priority)}">${ticket.priority}</span></td>
      <td>${formatDate(ticket.updatedAt)}</td>
    </tr>
  `).join("");
}

function statusClass(status) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function priorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

render();
