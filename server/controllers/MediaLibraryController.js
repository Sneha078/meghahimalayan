import cloudinary from "../config/cloudinary.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

// Normalize a folder path: strip leading/trailing slashes, collapse doubles
const normalizePath = (p = "") =>
  p.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/").trim();

// ── List folders (root or subfolders of a given path) ───────────────────────
// GET /api/v1/admin/media/folders?path=products/variants
export const listFolders = handleAsyncError(async (req, res, next) => {
  const path = normalizePath(req.query.path || "");

  const result = path
    ? await cloudinary.api.sub_folders(path)
    : await cloudinary.api.root_folders();

  res.status(200).json({
    success: true,
    path,
    folders: result.folders, // [{ name, path }]
  });
});

// ── Create a folder (and any missing parent folders) ────────────────────────
// POST /api/v1/admin/media/folders  { path: "products/variants/newcolor" }
export const createFolder = handleAsyncError(async (req, res, next) => {
  const path = normalizePath(req.body.path);

  if (!path) {
    return next(new HandleError("Folder path is required", 400));
  }

  const result = await cloudinary.api.create_folder(path);

  res.status(201).json({
    success: true,
    folder: result,
  });
});

// ── Delete a folder ──────────────────────────────────────────────────────────
// Cloudinary only allows deleting a folder once it's empty (no assets, no
// subfolders). We check first and return a clear message instead of letting
// Cloudinary's raw error bubble up.
// DELETE /api/v1/admin/media/folders  { path: "products/variants/oldcolor" }
export const deleteFolder = handleAsyncError(async (req, res, next) => {
  const path = normalizePath(req.body.path);

  if (!path) {
    return next(new HandleError("Folder path is required", 400));
  }

  const assets = await cloudinary.api.resources({
    type: "upload",
    prefix: `${path}/`,
    max_results: 1,
  });

  if (assets.resources.length > 0) {
    return next(
      new HandleError(
        "This folder still has images in it. Delete or move them first.",
        400
      )
    );
  }

  const sub = await cloudinary.api
    .sub_folders(path)
    .catch(() => ({ folders: [] }));

  if (sub.folders?.length > 0) {
    return next(
      new HandleError(
        "This folder still has subfolders in it. Delete those first.",
        400
      )
    );
  }

  await cloudinary.api.delete_folder(path);

  res.status(200).json({
    success: true,
    message: "Folder deleted",
  });
});

// ── List assets directly inside a folder (not including subfolders) ─────────
// GET /api/v1/admin/media/assets?folder=products/variants&cursor=xxx
export const listAssets = handleAsyncError(async (req, res, next) => {
  const folder = normalizePath(req.query.folder || "");
  const cursor = req.query.cursor || undefined;
  const prefix = folder ? `${folder}/` : "";

  const result = await cloudinary.api.resources({
    type: "upload",
    prefix,
    max_results: 50,
    next_cursor: cursor,
  });

  // Cloudinary's prefix search is recursive into subfolders too — keep only
  // direct children of this exact folder, so the grid matches what the
  // folder tree shows (subfolder contents appear when you click into them).
  const directChildren = result.resources.filter((r) => {
    const rest = r.public_id.slice(prefix.length);
    return !rest.includes("/");
  });

  res.status(200).json({
    success: true,
    assets: directChildren.map((r) => ({
      public_id: r.public_id,
      url: r.secure_url,
      format: r.format,
      bytes: r.bytes,
      width: r.width,
      height: r.height,
      created_at: r.created_at,
    })),
    nextCursor: result.next_cursor || null,
  });
});

// ── Upload one or more images into a folder ──────────────────────────────────
// POST /api/v1/admin/media/assets  { folder: "products/variants", images: [base64,...] }
export const uploadAssets = handleAsyncError(async (req, res, next) => {
  const folder = normalizePath(req.body.folder || "");
  const images = Array.isArray(req.body.images) ? req.body.images : [];

  if (images.length === 0) {
    return next(new HandleError("No images provided", 400));
  }

  const uploaded = await Promise.all(
    images.map((img) =>
      cloudinary.uploader.upload(img, { folder: folder || undefined })
    )
  );

  res.status(201).json({
    success: true,
    assets: uploaded.map((r) => ({
      public_id: r.public_id,
      url: r.secure_url,
    })),
  });
});

// ── Delete a single asset ────────────────────────────────────────────────────
// DELETE /api/v1/admin/media/assets  { publicId: "products/variants/xyz" }
export const deleteAsset = handleAsyncError(async (req, res, next) => {
  const { publicId } = req.body;

  if (!publicId) {
    return next(new HandleError("publicId is required", 400));
  }

  await cloudinary.uploader.destroy(publicId);

  res.status(200).json({
    success: true,
    message: "Asset deleted",
  });
});

// ── Move an asset to a different folder ──────────────────────────────────────
// Cloudinary has no separate "move" op — an asset's folder lives inside its
// public_id, so moving means renaming the public_id to a new path prefix.
// PUT /api/v1/admin/media/assets/move  { publicId: "products/old/a", toFolder: "products/new" }
export const moveAsset = handleAsyncError(async (req, res, next) => {
  const { publicId, toFolder } = req.body;

  if (!publicId || toFolder === undefined) {
    return next(new HandleError("publicId and toFolder are required", 400));
  }

  const filename = publicId.split("/").pop();
  const folder = normalizePath(toFolder);
  const newPublicId = folder ? `${folder}/${filename}` : filename;

  const result = await cloudinary.uploader.rename(publicId, newPublicId, {
    overwrite: false,
  });

  res.status(200).json({
    success: true,
    asset: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  });
});