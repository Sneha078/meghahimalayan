import express from "express";
import {
  listFolders,
  createFolder,
  deleteFolder,
  listAssets,
  uploadAssets,
  deleteAsset,
  moveAsset,
} from "../controllers/mediaLibraryController.js";

// NOTE: import these from wherever your existing admin product/order routes
// get their auth middleware — the names below are a guess based on common
// convention. Swap them for whatever actually guards e.g. /admin/product/create.
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

const adminOnly = [verifyUserAuth, roleBasedAccess("admin")];

router.get("/admin/media/folders", ...adminOnly, listFolders);
router.post("/admin/media/folders", ...adminOnly, createFolder);
router.delete("/admin/media/folders", ...adminOnly, deleteFolder);

router.get("/admin/media/assets", ...adminOnly, listAssets);
router.post("/admin/media/assets", ...adminOnly, uploadAssets);
router.delete("/admin/media/assets", ...adminOnly, deleteAsset);
router.put("/admin/media/assets/move", ...adminOnly, moveAsset);

export default router;

// In your main server file (app.js / server.js / index.js), mount this
// alongside your other route files, e.g.:
//
//   import mediaLibraryRoutes from "./routes/mediaLibraryRoutes.js";
//   app.use("/api/v1", mediaLibraryRoutes);