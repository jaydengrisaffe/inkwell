// server/src/routes/post.routes.js
//
// Wires PostService's publish(), listPublished()/search(), and delete() to
// the API contract's POST /api/posts, GET /api/posts, and DELETE /api/posts/:id.
// Thin-route discipline: no business rules here.

import { Router } from "express";
import { PostService } from "../services/post.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// POST /posts (hardened against DoS & unauthorized author override)
router.post("/posts", requireAuth, async (req, res, next) => {
  try {
    const MAX_PAGE_SIZE = 100;

    // DoS Mitigation: If query params or body specify pageSize, enforce an upper bound
    let pageSize = parseInt(req.query.pageSize || req.body.pageSize, 10);
    if (!isNaN(pageSize)) {
      pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    }

    // Never trust client-supplied identity fields — derive
    // authorId from the authenticated request, not the request body.
    const post = await PostService.publish({
      ...req.body,
      ...(pageSize && { pageSize }),
      authorId: req.user.id, // Set by requireAuth middleware from verified JWT
    });

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// GET /posts (supports pagination and optional search query)
router.get("/posts", async (req, res, next) => {
  try {
    const { page = 1, search } = req.query;
    const result = search
      ? await PostService.search({ query: search, page: Number(page) })
      : await PostService.listPublished({ page: Number(page) });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// server/src/routes/post.routes.js AFTER (fixed)
router.delete("/posts/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await PostService.getById(req.params.id);
    if (!post) return res.status(404).json({ error: { code: "NOT_FOUND" } });

    // A01's fix, in one line: check that the logged-in user actually
    // owns this resource before allowing the action on it.
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN" } });
    }

    await PostService.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;