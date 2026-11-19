
import { useEffect, useState } from "react";
import api from "../api";

const statuses = ["To Do", "In Progress", "Done"];

export default function Dashboard({ page = "dashboard" }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tickets, setTickets] = useState([]);
  const [members, setMembers] = useState([]);

  // Ticket comments
const [expandedCommentsId, setExpandedCommentsId] = useState("");
const [commentsByTicket, setCommentsByTicket] = useState({});
const [commentDrafts, setCommentDrafts] = useState({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [ticketStatus, setTicketStatus] = useState("To Do");
  const [assignee, setAssignee] = useState("");

  // Ticket editing state
  const [editingTicketId, setEditingTicketId] = useState("");
  const [editTicketForm, setEditTicketForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "To Do",
    assignee: ""
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [error, setError] = useState("");
  const [editingProject, setEditingProject] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id || "";

  const selected = projects.find(p => p._id === projectId);
  const selectedOwnerId = selected?.owner?._id || selected?.owner;
  const isProjectOwner =
    selected && String(selectedOwnerId) === String(userId);

  // Load only projects accessible to the logged-in user
  const loadProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);

      setProjectId(currentId =>
        data.some(p => p._id === currentId)
          ? currentId
          : data[0]?._id || ""
      );
    } catch (e) {
      setError(e.response?.data?.message || "Could not load projects");
    }
  };

  const loadTickets = async (id = projectId) => {
    if (!id) {
      setTickets([]);
      return;
    }

    try {
      const { data } = await api.get("/tickets", {
        params: {
          projectId: id,
          search: search || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          assignee: assigneeFilter || undefined
        }
      });

      setTickets(data);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load tickets");
    }
  };

  // Reload data when account changes
  useEffect(() => {
    setProjects([]);
    setTickets([]);
    setMembers([]);
    setProjectId("");
    loadProjects();
  }, [userId]);

  // Load selected project's members and tickets
  useEffect(() => {
    if (!projectId) {
      setTickets([]);
      setMembers([]);
      return;
    }

    const project = projects.find(p => p._id === projectId);
    setMembers(project?.teamMembers || []);
    loadTickets(projectId);
  }, [projectId, projects]);

  // Search and filter tickets
  useEffect(() => {
    if (!projectId) return;

    const timer = setTimeout(() => loadTickets(projectId), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, assigneeFilter]);

  const createProject = async e => {
    e.preventDefault();

    try {
      const { data } = await api.post("/projects", {
        title,
        description
      });

      setTitle("");
      setDescription("");
      setProjects(prev => [data, ...prev]);
      setProjectId(data._id);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not create project");
    }
  };

  const updateProject = async e => {
    e.preventDefault();

    try {
      const { data } = await api.patch(`/projects/${projectId}`, {
        title: editProjectTitle,
        description: editProjectDescription
      });

      setProjects(prev =>
        prev.map(p => p._id === data._id ? data : p)
      );

      setEditingProject(false);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not update project");
    }
  };

  const deleteProject = async () => {
    if (!window.confirm("Delete this project and all its tickets?")) return;

    try {
      await api.delete(`/projects/${projectId}`);

      setProjects(prev => prev.filter(p => p._id !== projectId));
      setProjectId("");
      setTickets([]);
      setMembers([]);
      setEditingProject(false);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not delete project");
    }
  };

  const createTicket = async e => {
    e.preventDefault();

    try {
      await api.post("/tickets", {
        title: ticketTitle,
        description: ticketDescription,
        priority,
        status: ticketStatus,
        assignee: assignee || null,
        projectId
      });

      setTicketTitle("");
      setTicketDescription("");
      setPriority("Medium");
      setTicketStatus("To Do");
      setAssignee("");

      setError("");
      await loadTickets(projectId);
    } catch (e) {
      setError(e.response?.data?.message || "Could not create ticket");
    }
  };

  const updateTicket = async (id, patch) => {
    try {
      await api.patch(`/tickets/${id}`, patch);
      await loadTickets(projectId);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not update ticket");
    }
  };

  const deleteTicket = async id => {
    if (!confirm("Delete this ticket?")) return;

    try {
      await api.delete(`/tickets/${id}`);
      await loadTickets(projectId);
    } catch (e) {
      setError(e.response?.data?.message || "Could not delete ticket");
    }
  };

  const startEditingTicket = ticket => {
    setEditingTicketId(ticket._id);
    setEditTicketForm({
      title: ticket.title || "",
      description: ticket.description || "",
      priority: ticket.priority || "Medium",
      status: ticket.status || "To Do",
      assignee: ticket.assignee?._id || ""
    });
  };

  const saveEditedTicket = async e => {
    e.preventDefault();

    try {
      await api.patch(`/tickets/${editingTicketId}`, {
        ...editTicketForm,
        assignee: editTicketForm.assignee || null
      });
      setEditingTicketId("");
      setError("");
      await loadTickets(projectId);
    } catch (e) {
      setError(e.response?.data?.message || "Could not update ticket");
    }
  };


const loadComments = async ticketId => {
  try {
    const { data } = await api.get(`/tickets/${ticketId}/comments`);

    setCommentsByTicket(prev => ({
      ...prev,
      [ticketId]: data
    }));
  } catch (e) {
    setError(e.response?.data?.message || "Could not load comments");
  }
};

const toggleComments = async ticketId => {
  if (expandedCommentsId === ticketId) {
    setExpandedCommentsId("");
    return;
  }

  setExpandedCommentsId(ticketId);
  await loadComments(ticketId);
};

const addComment = async ticketId => {
  const text = commentDrafts[ticketId] || "";

  if (!text.trim()) return;

  try {
    const { data } = await api.post(
      `/tickets/${ticketId}/comments`,
      { text }
    );

    setCommentsByTicket(prev => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), data]
    }));

    setCommentDrafts(prev => ({
      ...prev,
      [ticketId]: ""
    }));

    setError("");
  } catch (e) {
    setError(e.response?.data?.message || "Could not add comment");
  }
};

const deleteComment = async (ticketId, commentId) => {
  if (!window.confirm("Delete this comment?")) return;

  try {
    await api.delete(`/tickets/comments/${commentId}`);

    setCommentsByTicket(prev => ({
      ...prev,
      [ticketId]: (prev[ticketId] || []).filter(
        comment => comment._id !== commentId
      )
    }));

    setError("");
  } catch (e) {
    setError(e.response?.data?.message || "Could not delete comment");
  }
};


  const addMember = async e => {
    e.preventDefault();

    const email = e.target.email.value;

    try {
      const { data } = await api.post(
        `/projects/${projectId}/members`,
        { email }
      );

      setProjects(prev =>
        prev.map(p => p._id === data._id ? data : p)
      );

      setError("");
      e.target.reset();
    } catch (e) {
      setError(e.response?.data?.message || "Could not add member");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="bg-red-50 text-red-700 p-3 rounded-lg">
          {error}
          <button
            className="ml-3 underline"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </p>
      )}

      {page === "projects" && (
        <section className="max-w-xl">
          <aside className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="font-semibold">Projects</h2>

            <select
              className="w-full border rounded-lg p-2"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
            >
              <option value="">Choose project</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Show project form only when no project is selected */}
            {!selected && (
              <form
                onSubmit={createProject}
                className="space-y-2 border-t pt-4"
              >
                <h3 className="font-medium text-sm">
                  Create project
                </h3>

                <input
                  className="w-full border rounded-lg p-2"
                  placeholder="Project title"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />

                <textarea
                  className="w-full border rounded-lg p-2"
                  placeholder="Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />

                <button className="w-full bg-indigo-600 text-white rounded-lg p-2">
                  Add project
                </button>
              </form>
            )}

            {selected && (
              <>
                <button
                  type="button"
                  onClick={() => setProjectId("")}
                  className="w-full border rounded-lg p-2 text-sm text-indigo-600"
                >
                  + Create another project
                </button>

                <div className="border-t pt-4 space-y-3">
                  <div className="text-xs text-slate-500">
                    {members.length} project member(s)
                  </div>

                  {isProjectOwner && (
                    <>
                      {!editingProject ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditProjectTitle(selected.title || "");
                            setEditProjectDescription(selected.description || "");
                            setEditingProject(true);
                          }}
                          className="w-full border border-indigo-600 text-indigo-600 rounded-lg p-2"
                        >
                          Edit project
                        </button>
                      ) : (
                        <form onSubmit={updateProject} className="space-y-2">
                          <h3 className="font-medium text-sm">Edit project</h3>

                          <input
                            className="w-full border rounded-lg p-2"
                            placeholder="Project title"
                            maxLength={120}
                            required
                            value={editProjectTitle}
                            onChange={e => setEditProjectTitle(e.target.value)}
                          />

                          <textarea
                            className="w-full border rounded-lg p-2"
                            placeholder="Project description"
                            maxLength={2000}
                            value={editProjectDescription}
                            onChange={e => setEditProjectDescription(e.target.value)}
                          />

                          <button className="w-full bg-indigo-600 text-white rounded-lg p-2">
                            Save changes
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingProject(false)}
                            className="w-full border rounded-lg p-2"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                       <button
                        type="button"
                        onClick={deleteProject}
                        className="w-full bg-red-50 text-red-600 border border-red-200 rounded-lg p-2"
                      >
                        Delete project
                      </button>

                      <form onSubmit={addMember} className="space-y-2">
                        <h3 className="font-medium text-sm">Add team member</h3>

                        <input
                          name="email"
                          type="email"
                          className="w-full border rounded-lg p-2"
                          placeholder="Registered user's email"
                          required
                        />

                        <button className="w-full border border-indigo-600 text-indigo-600 rounded-lg p-2">
                          Add member
                        </button>
                      </form>

                     
                    </>
                  )}
                </div>
              </>
            )}
          </aside>
        </section>
      )}

      {page === "tickets" && (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm max-w-md">
            <label className="block text-sm font-medium mb-2" htmlFor="ticket-project">Choose project</label>
            <select id="ticket-project" className="w-full border rounded-lg p-2" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">Choose project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold">
                {selected?.title || "Select a project"}
              </h2>
              <p className="text-slate-500 text-sm">
                {selected?.description}
              </p>
            </div>

            {selected && (
              <form
                onSubmit={createTicket}
                className="bg-white rounded-2xl shadow-sm p-5 grid md:grid-cols-2 gap-3"
              >
                <input
                  className="border rounded-lg p-2"
                  placeholder="Ticket title"
                  required
                  value={ticketTitle}
                  onChange={e => setTicketTitle(e.target.value)}
                />

                <select
                  className="border rounded-lg p-2"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>

                <input
                  className="border rounded-lg p-2"
                  placeholder="Description"
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                />

                {/* New ticket status selector */}
                <select
                  className="border rounded-lg p-2"
                  value={ticketStatus}
                  onChange={e => setTicketStatus(e.target.value)}
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="border rounded-lg p-2"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <button className="md:col-span-2 bg-indigo-600 text-white rounded-lg p-2">
                  Create ticket
                </button>
              </form>
            )}

            {selected && (
              <div className="flex flex-wrap gap-2">
                <input
                  className="border rounded-lg p-2 bg-white flex-1 min-w-48"
                  placeholder="Search ticket title..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />

                <select
                  className="border rounded-lg p-2 bg-white"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="border rounded-lg p-2 bg-white"
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  aria-label="Filter by priority"
                >
                  <option value="">All priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <select
                  className="border rounded-lg p-2 bg-white"
                  value={assigneeFilter}
                  onChange={e => setAssigneeFilter(e.target.value)}
                  aria-label="Filter by assignee"
                >
                  <option value="">All assignees</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className="border rounded-lg px-3 py-2 bg-white text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setPriorityFilter("");
                    setAssigneeFilter("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

            {selected && (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
                {statuses.map(status => (
                  <div
                    key={status}
                   className="bg-slate-100 rounded-2xl p-3 min-h-64 min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-start"
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      const id = e.dataTransfer.getData("ticketId");
                      if (id) updateTicket(id, { status });
                    }}
                  >
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold">{status}</h3>
                      <span className="text-xs bg-white rounded-full px-2 py-1">
                        {tickets.filter(t => t.status === status).length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {tickets
                        .filter(t => t.status === status)
                        .map(t => (
                          <article
                            key={t._id}
                            draggable={editingTicketId !== t._id}
                            onDragStart={e =>
                              e.dataTransfer.setData("ticketId", t._id)
                            }
                            className="bg-white rounded-xl p-3 shadow-sm space-y-2"
                          >
                            {editingTicketId === t._id ? (
                              <form onSubmit={saveEditedTicket} className="space-y-2">
                                <input
                                  className="w-full border rounded-lg p-2 text-sm"
                                  placeholder="Ticket title"
                                  maxLength={160}
                                  required
                                  value={editTicketForm.title}
                                  onChange={e => setEditTicketForm({ ...editTicketForm, title: e.target.value })}
                                />

                                <textarea
                                  className="w-full border rounded-lg p-2 text-sm"
                                  placeholder="Description"
                                  maxLength={5000}
                                  rows={3}
                                  value={editTicketForm.description}
                                  onChange={e => setEditTicketForm({ ...editTicketForm, description: e.target.value })}
                                />

                                <select
                                  className="w-full border rounded-lg p-2 text-sm"
                                  value={editTicketForm.priority}
                                  onChange={e => setEditTicketForm({ ...editTicketForm, priority: e.target.value })}
                                >
                                  <option>Low</option>
                                  <option>Medium</option>
                                  <option>High</option>
                                  <option>Critical</option>
                                </select>

                                <select
                                  className="w-full border rounded-lg p-2 text-sm"
                                  value={editTicketForm.status}
                                  onChange={e => setEditTicketForm({ ...editTicketForm, status: e.target.value })}
                                >
                                  {statuses.map(s => <option key={s}>{s}</option>)}
                                </select>

                                <select
                                  className="w-full border rounded-lg p-2 text-sm"
                                  value={editTicketForm.assignee}
                                  onChange={e => setEditTicketForm({ ...editTicketForm, assignee: e.target.value })}
                                >
                                  <option value="">Unassigned</option>
                                  {members.map(m => (
                                    <option key={m._id} value={m._id}>{m.name}</option>
                                  ))}
                                </select>

                                <div className="flex gap-2">
                                  <button className="flex-1 bg-indigo-600 text-white rounded-lg p-2 text-sm">
                                    Save changes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTicketId("")}
                                    className="flex-1 border rounded-lg p-2 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="flex justify-between gap-2">
                                  <h4 className="font-medium">{t.title}</h4>
                                  <div className="flex items-start gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEditingTicket(t)}
                                      className="text-xs text-indigo-600 hover:underline"
                                      title="Edit ticket"
                                    >
                                      Edit
                                    </button>
                                    {(t.reporter?._id === userId ||
                                      selected?.owner?._id === userId) && (
                                        <button
                                          type="button"
                                          onClick={() => deleteTicket(t._id)}
                                          className="text-slate-400 hover:text-red-600"
                                          title="Delete ticket"
                                        >
                                          ×
                                        </button>
                                      )}
                                  </div>
                                </div>

                                {t.description && (
                                  <p className="text-xs text-slate-500">{t.description}</p>
                                )}

                                <div className="flex justify-between text-xs">
                                  <span className={
                                    t.priority === "High" || t.priority === "Critical"
                                      ? "text-red-600"
                                      : t.priority === "Low"
                                        ? "text-slate-500"
                                        : "text-amber-600"
                                  }>
                                    {t.priority}
                                  </span>
                                  <span className="text-slate-500">
                                    {t.assignee?.name || "Unassigned"}
                                  </span>
                                </div>

                                <select
                                  aria-label="Change ticket status"
                                  className="w-full border rounded p-1 text-xs"
                                  value={t.status}
                                  onChange={e => updateTicket(t._id, { status: e.target.value })}
                                >
                                  {statuses.map(s => <option key={s}>{s}</option>)}
                                </select>
                              </>
                              
                            )}

{/* Comments section */}
<div className="border-t pt-2 space-y-2">
  <button
    type="button"
    onClick={() => toggleComments(t._id)}
    className="text-sm text-indigo-600 hover:underline"
  >
    {expandedCommentsId === t._id
      ? "Hide comments"
      : `Comments (${commentsByTicket[t._id]?.length ?? "View"})`}
  </button>

  {expandedCommentsId === t._id && (
    <div className="space-y-3">
      {/* Comment list */}
      <div className="space-y-2">
        {(commentsByTicket[t._id] || []).map(comment => (
          <div
            key={comment._id}
            className="bg-slate-50 rounded-lg p-2 text-sm"
          >
            <div className="flex justify-between gap-2">
              <span className="font-medium">
                {comment.author?.name || "User"}
              </span>

              {String(comment.author?._id) === String(userId) && (
                <button
                  type="button"
                  onClick={() => deleteComment(t._id, comment._id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>

            <p className="text-slate-700 whitespace-pre-wrap break-words">
              {comment.text}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        ))}

        {commentsByTicket[t._id]?.length === 0 && (
          <p className="text-xs text-slate-500">
            No comments yet.
          </p>
        )}
      </div>

      {/* Add comment */}
      <form
        onSubmit={e => {
          e.preventDefault();
          addComment(t._id);
        }}
        className="space-y-2"
      >
        <textarea
          className="w-full border rounded-lg p-2 text-sm"
          placeholder="Write a comment..."
          rows={2}
          maxLength={2000}
          value={commentDrafts[t._id] || ""}
          onChange={e =>
            setCommentDrafts(prev => ({
              ...prev,
              [t._id]: e.target.value
            }))
          }
        />

        <button
          type="submit"
          disabled={!(commentDrafts[t._id] || "").trim()}
          className="bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          Post comment
        </button>
      </form>
    </div>
  )}
</div>

                          </article>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {page === "dashboard" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {user.name || "there"}. Here is your workspace overview.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
            <div className="bg-white rounded-2xl p-6 shadow-sm"><p className="text-sm text-slate-500">Your projects</p><p className="text-3xl font-bold mt-2">{projects.length}</p></div>
            <div className="bg-white rounded-2xl p-6 shadow-sm"><p className="text-sm text-slate-500">Tickets in selected project</p><p className="text-3xl font-bold mt-2">{tickets.length}</p></div>
          </div>
          <p className="text-sm text-slate-500">Use the sidebar to open Projects or Ticket Status.</p>
        </div>
      )}
    </div>
  );
}
