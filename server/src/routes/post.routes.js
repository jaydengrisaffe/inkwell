// server/src/routes/post.routes.js
//
// Wires PostService's publish() and listPublished()/search() to
// the API contract's POST /api/posts and GET /api/posts.
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

export default router;