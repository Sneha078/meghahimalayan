import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Folder, FolderPlus, FolderOpen, ChevronRight, ChevronDown,
  Upload, Trash2, Move, X, Image as ImageIcon, Loader2,
} from 'lucide-react'
import {
  getMediaFolders,
  createMediaFolder,
  deleteMediaFolder,
  getMediaAssets,
  uploadMediaAssets,
  deleteMediaAsset,
  moveMediaAsset,
} from '../../api/adminClient'

// ── Helpers ──────────────────────────────────────────────────────────────────
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const folderLabel = (path) => path.split('/').pop() || 'Home'

// ── Recursive folder tree node (used in both sidebar and the move picker) ───
function FolderNode({ path, depth, selectedPath, onSelect, childrenCache, onExpand }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const [loading, setLoading] = useState(false)
  const children = childrenCache[path]

  const toggle = async () => {
    const next = !expanded
    setExpanded(next)
    if (next && children === undefined) {
      setLoading(true)
      await onExpand(path)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (expanded && children === undefined) {
      setLoading(true)
      onExpand(path).finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isSelected = selectedPath === path

  return (
    <div>
      <div
        onClick={() => onSelect(path)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 8px', paddingLeft: `${8 + depth * 16}px`,
          borderRadius: '6px', cursor: 'pointer',
          backgroundColor: isSelected ? '#eef2ff' : 'transparent',
          color: isSelected ? '#2563eb' : '#334155',
          fontSize: '0.85rem', fontWeight: isSelected ? '600' : '500',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc' }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); toggle() }}
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: '16px' }}
        >
          {loading ? (
            <Loader2 size={13} className="spin" />
          ) : expanded ? (
            <ChevronDown size={13} />
          ) : (
            <ChevronRight size={13} />
          )}
        </span>
        {isSelected ? <FolderOpen size={15} /> : <Folder size={15} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {folderLabel(path) || 'Home'}
        </span>
      </div>

      {expanded && children?.map((f) => (
        <FolderNode
          key={f.path}
          path={f.path}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
          childrenCache={childrenCache}
          onExpand={onExpand}
        />
      ))}
    </div>
  )
}

// ── Move-to-folder modal (reuses the same tree, separate cache) ─────────────
function MoveModal({ asset, onClose, onMoved }) {
  const [cache, setCache] = useState({})
  const [targetPath, setTargetPath] = useState('')
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState(null)

  const loadChildren = useCallback(async (path) => {
    try {
      const data = await getMediaFolders(path)
      setCache((prev) => ({ ...prev, [path]: data.folders }))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const handleMove = async () => {
    setMoving(true)
    setError(null)
    try {
      await moveMediaAsset(asset.public_id, targetPath)
      onMoved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setMoving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '14px', width: '420px',
        maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Move image
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 10px', overflowY: 'auto', flex: 1 }}>
          <FolderNode
            path=""
            depth={0}
            selectedPath={targetPath}
            onSelect={setTargetPath}
            childrenCache={cache}
            onExpand={loadChildren}
          />
        </div>

        {error && (
          <p style={{ padding: '0 20px', color: '#dc2626', fontSize: '0.8rem' }}>{error}</p>
        )}

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#64748b', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={moving}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none',
              backgroundColor: moving ? '#cbd5e1' : 'var(--color-navy, #0f172a)',
              color: '#fff', fontSize: '0.82rem', fontWeight: '700',
              cursor: moving ? 'not-allowed' : 'pointer',
            }}
          >
            {moving ? 'Moving…' : `Move here${targetPath ? ` (/${targetPath})` : ' (Home)'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
function AdminMediaLibrary() {
  const [treeCache, setTreeCache] = useState({})
  const [selectedFolder, setSelectedFolder] = useState('')

  const [assets, setAssets] = useState([])
  const [cursor, setCursor] = useState(null)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [moveTarget, setMoveTarget] = useState(null) // asset being moved

  const loadTreeChildren = useCallback(async (path) => {
    try {
      const data = await getMediaFolders(path)
      setTreeCache((prev) => ({ ...prev, [path]: data.folders }))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const loadAssets = useCallback((folder, append = false, afterCursor = null) => {
    setAssetsLoading(true)
    setError(null)
    getMediaAssets(folder, afterCursor)
      .then((data) => {
        setAssets((prev) => (append ? [...prev, ...data.assets] : data.assets))
        setCursor(data.nextCursor)
      })
      .catch((err) => setError(err.message))
      .finally(() => setAssetsLoading(false))
  }, [])

  useEffect(() => {
    loadAssets(selectedFolder, false, null)
  }, [selectedFolder, loadAssets])

  const refreshCurrentFolder = () => loadAssets(selectedFolder, false, null)

  const handleSelectFolder = (path) => setSelectedFolder(path)

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return

    const path = selectedFolder ? `${selectedFolder}/${name}` : name
    setCreatingFolder(true)
    setError(null)
    try {
      await createMediaFolder(path)
      setNewFolderName('')
      // Invalidate the parent's cached children so the tree re-fetches and
      // shows the new folder.
      setTreeCache((prev) => {
        const next = { ...prev }
        delete next[selectedFolder]
        return next
      })
      await loadTreeChildren(selectedFolder)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleDeleteCurrentFolder = async () => {
    if (!selectedFolder) return
    if (!window.confirm(`Delete folder "${folderLabel(selectedFolder)}"? It must be empty.`)) return

    setError(null)
    try {
      await deleteMediaFolder(selectedFolder)
      const parent = selectedFolder.split('/').slice(0, -1).join('/')
      setTreeCache((prev) => {
        const next = { ...prev }
        delete next[parent]
        return next
      })
      await loadTreeChildren(parent)
      setSelectedFolder(parent)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpload = async (e) => {
    const files = [...e.target.files]
    if (files.length === 0) return

    setUploading(true)
    setError(null)
    try {
      const base64s = await Promise.all(files.map(toBase64))
      await uploadMediaAssets(selectedFolder, base64s)
      refreshCurrentFolder()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAsset = async (asset) => {
    if (!window.confirm('Delete this image? This cannot be undone.')) return
    setError(null)
    try {
      await deleteMediaAsset(asset.public_id)
      setAssets((prev) => prev.filter((a) => a.public_id !== asset.public_id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: '32px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

      {/* ── Sidebar: folder tree ──────────────────────────────────────────── */}
      <div style={{
        width: '260px', flexShrink: 0,
        backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
        padding: '14px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>
            Folders
          </h2>
        </div>

        <FolderNode
          path=""
          depth={0}
          selectedPath={selectedFolder}
          onSelect={handleSelectFolder}
          childrenCache={treeCache}
          onExpand={loadTreeChildren}
        />

        <div style={{ marginTop: '14px', padding: '10px 8px 0', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px' }}>
            New folder in "{folderLabel(selectedFolder) || 'Home'}"
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }}
              placeholder="Folder name"
              style={{
                flex: 1, padding: '7px 10px', borderRadius: '6px',
                border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none',
              }}
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              style={{
                padding: '7px 9px', borderRadius: '6px', border: 'none',
                backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <FolderPlus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main: asset grid ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
              {selectedFolder ? `/ ${selectedFolder}` : 'Home'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {assetsLoading ? 'Loading…' : `${assets.length} image${assets.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedFolder && (
              <button
                onClick={handleDeleteCurrentFolder}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 14px', borderRadius: '8px', border: '1px solid #fecaca',
                  backgroundColor: '#fff', color: '#dc2626', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Delete Folder
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: uploading ? '#cbd5e1' : '#0f172a', color: '#fff',
                fontSize: '0.8rem', fontWeight: '700', cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Upload Images'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2',
            border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {assetsLoading && assets.length === 0 && (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading images…</p>
        )}

        {!assetsLoading && assets.length === 0 && (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1',
          }}>
            <ImageIcon size={32} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No images in this folder yet.</p>
          </div>
        )}

        {assets.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '14px',
          }}>
            {assets.map((asset) => (
              <div
                key={asset.public_id}
                style={{
                  position: 'relative', borderRadius: '10px', overflow: 'hidden',
                  border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', aspectRatio: '1 / 1',
                }}
                className="media-card"
              >
                <img
                  src={asset.url}
                  alt={asset.public_id}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  className="media-card-overlay"
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%)',
                    opacity: 0, transition: 'opacity 0.15s ease',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
                    padding: '8px', gap: '6px',
                  }}
                >
                  <button
                    onClick={() => setMoveTarget(asset)}
                    title="Move"
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                      backgroundColor: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a',
                    }}
                  >
                    <Move size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(asset)}
                    title="Delete"
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                      backgroundColor: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cursor && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => loadAssets(selectedFolder, true, cursor)}
              disabled={assetsLoading}
              style={{
                padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0',
                backgroundColor: '#fff', color: '#334155', fontSize: '0.82rem', fontWeight: '600',
                cursor: assetsLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {assetsLoading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {moveTarget && (
        <MoveModal
          asset={moveTarget}
          onClose={() => setMoveTarget(null)}
          onMoved={refreshCurrentFolder}
        />
      )}

      <style>{`
        .media-card:hover .media-card-overlay { opacity: 1; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default AdminMediaLibrary