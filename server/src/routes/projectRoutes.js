
import { Router } from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Ticket from "../models/Ticket.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = Router();
router.use(auth);

const isText = (value) => typeof value === "string";

// GET projects accessible to the logged-in user
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { teamMembers: req.user._id }
      ]
    })
      .populate("owner", "name email")
      .populate("teamMembers", "name email")
      .sort({ updatedAt: -1 });

    return res.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return res.status(500).json({ message: "Unable to load projects" });
  }
});

// CREATE project
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body || {};

    if (!isText(title) || !title.trim() || title.trim().length > 120) {
      return res.status(400).json({
        message: "Project title is required and must be 120 characters or fewer"
      });
    }

    if (description !== undefined &&
        (!isText(description) || description.length > 2000)) {
      return res.status(400).json({
        message: "Project description is invalid or too long"
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description || "",
      owner: req.user._id,
      teamMembers: [req.user._id]
    });

    await project.populate("teamMembers", "name email");

    return res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ message: "Unable to create project" });
  }
});

// UPDATE project: only project owner
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not its owner"
      });
    }

    const body = req.body || {};
    const allowedFields = ["title", "description"];

    if (
      Object.keys(body).length === 0 ||
      Object.keys(body).some(key => !allowedFields.includes(key))
    ) {
      return res.status(400).json({ message: "Invalid project update" });
    }

    if (body.title !== undefined) {
      if (!isText(body.title) || !body.title.trim() || body.title.trim().length > 120) {
        return res.status(400).json({ message: "Project title is invalid" });
      }

      project.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (!isText(body.description) || body.description.length > 2000) {
        return res.status(400).json({ message: "Project description is invalid" });
      }

      project.description = body.description;
    }

    await project.save();

    await project.populate("owner", "name email");
    await project.populate("teamMembers", "name email");

    return res.json(project);
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({ message: "Unable to update project" });
  }
});

// ADD team member: only project owner
router.post("/:id/members", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not its owner"
      });
    }

    const email = req.body?.email;

    if (!isText(email) || !email.trim() || email.length > 254) {
      return res.status(400).json({ message: "A valid member email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const member = await User.findOne({ email: normalizedEmail });

    if (!member) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    const alreadyMember = project.teamMembers.some(
      id => id.equals(member._id)
    );

    if (!alreadyMember) {
      project.teamMembers.push(member._id);
      await project.save();
    }

    await project.populate("teamMembers", "name email");

    return res.json(project);
  } catch (error) {
    console.error("Add project member error:", error);
    return res.status(500).json({ message: "Unable to add project member" });
  }
});

// DELETE project: owner only
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not its owner"
      });
    }

    // Remove tickets belonging to this project
   await Comment.deleteMany({ project: project._id });
await Ticket.deleteMany({ project: project._id });

    await project.deleteOne();

    return res.json({ message: "Project and its tickets deleted" });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ message: "Unable to delete project" });
  }
});

export default router;
