
import { Router } from "express";
import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import Comment from "../models/Comment.js";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

const validStatuses = ["To Do", "In Progress", "Done"];
const validPriorities = ["Low", "Medium", "High", "Critical"];

const isText = (value) => typeof value === "string";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getAccessibleProject(projectId, userId) {
  if (!mongoose.isValidObjectId(projectId)) return null;

  return Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { teamMembers: userId }]
  });
}

// GET tickets for an accessible project
router.get("/", async (req, res) => {
  try {
    const { projectId, status, priority, assignee, search } = req.query;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ message: "A valid project ID is required" });
    }

    const project = await getAccessibleProject(projectId, req.user._id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid ticket priority" });
    }

    if (assignee && !mongoose.isValidObjectId(assignee)) {
      return res.status(400).json({ message: "Invalid assignee ID" });
    }

    if (search !== undefined &&
        (typeof search !== "string" || search.length > 100)) {
      return res.status(400).json({ message: "Search must be 100 characters or fewer" });
    }

    const query = { project: project._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;

    if (search?.trim()) {
      query.title = {
        $regex: escapeRegex(search.trim()),
        $options: "i"
      };
    }

    const tickets = await Ticket.find(query)
      .populate("assignee", "name email")
      .populate("reporter", "name")
      .sort({ updatedAt: -1 });

    return res.json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    return res.status(500).json({ message: "Unable to load tickets" });
  }
});

// CREATE ticket
router.post("/", async (req, res) => {
  try {
    const { title, projectId, description, priority, status, assignee } =
      req.body || {};

    if (!isText(title) || !title.trim() || title.trim().length > 160) {
      return res.status(400).json({
        message: "Ticket title is required and must be 160 characters or fewer"
      });
    }

    if (description !== undefined &&
        (!isText(description) || description.length > 5000)) {
      return res.status(400).json({ message: "Description is invalid or too long" });
    }

    const project = await getAccessibleProject(projectId, req.user._id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid ticket priority" });
    }

    if (assignee !== undefined && assignee !== null && assignee !== "") {
      if (!mongoose.isValidObjectId(assignee) ||
          !project.teamMembers.some(id => id.equals(assignee))) {
        return res.status(400).json({
          message: "Assignee must be a valid project member"
        });
      }
    }

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description || "",
      priority: priority || "Medium",
      status: status || "To Do",
      project: project._id,
      assignee: assignee || null,
      reporter: req.user._id
    });

    await ticket.populate([
      { path: "assignee", select: "name email" },
      { path: "reporter", select: "name" }
    ]);

    return res.status(201).json(ticket);
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({ message: "Unable to create ticket" });
  }
});

// UPDATE ticket
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const project = await getAccessibleProject(ticket.project, req.user._id);

    if (!project) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const body = req.body || {};
    const allowedFields = [
      "title", "description", "priority", "status", "assignee"
    ];

    if (Object.keys(body).some(key => !allowedFields.includes(key))) {
      return res.status(400).json({ message: "Unsupported update field" });
    }

    if (Object.keys(body).length === 0) {
      return res.status(400).json({ message: "No update fields supplied" });
    }

    const { title, description, priority, status, assignee } = body;

    if (title !== undefined) {
      if (!isText(title) || !title.trim() || title.trim().length > 160) {
        return res.status(400).json({ message: "Invalid ticket title" });
      }
      ticket.title = title.trim();
    }

    if (description !== undefined) {
      if (!isText(description) || description.length > 5000) {
        return res.status(400).json({ message: "Invalid ticket description" });
      }
      ticket.description = description;
    }

    if (priority !== undefined) {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: "Invalid ticket priority" });
      }
      ticket.priority = priority;
    }

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid ticket status" });
      }
      ticket.status = status;
    }

    if (assignee !== undefined) {
      if (assignee !== null && assignee !== "" &&
          (!mongoose.isValidObjectId(assignee) ||
           !project.teamMembers.some(id => id.equals(assignee)))) {
        return res.status(400).json({
          message: "Assignee must be a valid project member"
        });
      }

      ticket.assignee = assignee || null;
    }

    await ticket.save();

    await ticket.populate([
      { path: "assignee", select: "name email" },
      { path: "reporter", select: "name" }
    ]);

    return res.json(ticket);
  } catch (error) {
    console.error("Update ticket error:", error);
    return res.status(400).json({ message: "Unable to update ticket" });
  }
});

// DELETE ticket: creator OR project owner only
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const project = await getAccessibleProject(ticket.project, req.user._id);

    if (!project) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const isCreator = ticket.reporter.equals(req.user._id);
    const isProjectOwner = project.owner.equals(req.user._id);

    if (!isCreator && !isProjectOwner) {
      return res.status(403).json({
        message: "Only the ticket creator or project owner can delete this ticket"
      });
    }
await Comment.deleteMany({ ticket: ticket._id });
await ticket.deleteOne();

    return res.json({ message: "Ticket deleted" });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({ message: "Unable to delete ticket" });
  }
});


// GET comments for a ticket
router.get("/:id/comments", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const project = await getAccessibleProject(
      ticket.project,
      req.user._id
    );

    if (!project) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const comments = await Comment.find({ ticket: ticket._id })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    return res.json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({
      message: "Unable to load comments"
    });
  }
});

// ADD comment
router.post("/:id/comments", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const project = await getAccessibleProject(
      ticket.project,
      req.user._id
    );

    if (!project) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const { text } = req.body || {};

    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.trim().length > 2000
    ) {
      return res.status(400).json({
        message: "Comment is required and must be 2000 characters or fewer"
      });
    }

    const comment = await Comment.create({
      ticket: ticket._id,
      project: project._id,
      author: req.user._id,
      text: text.trim()
    });

    await comment.populate("author", "name email");

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({
      message: "Unable to add comment"
    });
  }
});

// DELETE comment: author only
router.delete("/comments/:commentId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const project = await getAccessibleProject(
      comment.project,
      req.user._id
    );

    if (!project) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({
        message: "You can only delete your own comments"
      });
    }

    await comment.deleteOne();

    return res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({
      message: "Unable to delete comment"
    });
  }
});


export default router;
